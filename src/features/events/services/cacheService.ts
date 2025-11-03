// Intelligent caching service for achievements, leaderboards, and performance optimization

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  strategy: 'LRU' | 'LFU' | 'FIFO'; // Cache eviction strategy
  persistent: boolean; // Whether to persist to localStorage
  compression: boolean; // Whether to compress data
}

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

interface BackgroundJob {
  id: string;
  name: string;
  fn: () => Promise<void>;
  interval: number;
  lastRun: number;
  isRunning: boolean;
}

export class IntelligentCacheService {
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private backgroundJobs: Map<string, BackgroundJob> = new Map();
  private jobTimers: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultCaches();
    this.startBackgroundJobs();
    this.setupCleanupInterval();
  }

  /**
   * Initialize default cache configurations
   */
  private initializeDefaultCaches(): void {
    // Achievement cache - high TTL, persistent
    this.createCache('achievements', {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 1000,
      strategy: 'LRU',
      persistent: true,
      compression: true
    });

    // Leaderboard cache - medium TTL, frequent updates
    this.createCache('leaderboards', {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 500,
      strategy: 'LFU',
      persistent: true,
      compression: true
    });

    // User stats cache - medium TTL
    this.createCache('userStats', {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 2000,
      strategy: 'LRU',
      persistent: true,
      compression: false
    });

    // Event data cache - short TTL for real-time data
    this.createCache('events', {
      ttl: 2 * 60 * 1000, // 2 minutes
      maxSize: 300,
      strategy: 'LRU',
      persistent: false,
      compression: false
    });

    // API response cache - very short TTL
    this.createCache('apiResponses', {
      ttl: 60 * 1000, // 1 minute
      maxSize: 100,
      strategy: 'FIFO',
      persistent: false,
      compression: true
    });

    // Image cache - long TTL, large size
    this.createCache('images', {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 200,
      strategy: 'LRU',
      persistent: true,
      compression: false
    });
  }

  /**
   * Create a new cache with configuration
   */
  createCache(name: string, config: CacheConfig): void {
    this.caches.set(name, new Map());
    this.configs.set(name, config);
    this.stats.set(name, {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0
    });

    // Load from persistent storage if enabled
    if (config.persistent) {
      this.loadFromPersistentStorage(name);
    }
  }

  /**
   * Get data from cache
   */
  get<T>(cacheName: string, key: string): T | null {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !config || !stats) {
      return null;
    }

    const entry = cache.get(key);
    if (!entry) {
      stats.misses++;
      this.updateHitRate(stats);
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > config.ttl) {
      cache.delete(key);
      stats.evictions++;
      stats.entryCount--;
      stats.totalSize -= entry.size;
      stats.misses++;
      this.updateHitRate(stats);
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = now;

    stats.hits++;
    this.updateHitRate(stats);

    // Decompress if needed
    let data = entry.data;
    if (entry.compressed && config.compression) {
      data = this.decompress(data);
    }

    return data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(cacheName: string, key: string, data: T): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !config || !stats) {
      return;
    }

    const now = Date.now();
    let processedData = data;
    let compressed = false;

    // Compress if enabled
    if (config.compression) {
      processedData = this.compress(data) as T;
      compressed = true;
    }

    const size = this.calculateSize(processedData);
    const entry: CacheEntry<T> = {
      key,
      data: processedData,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size,
      compressed
    };

    // Check if we need to evict entries
    if (cache.size >= config.maxSize) {
      this.evictEntries(cacheName, 1);
    }

    // Remove existing entry if it exists
    const existingEntry = cache.get(key);
    if (existingEntry) {
      stats.totalSize -= existingEntry.size;
      stats.entryCount--;
    }

    // Add new entry
    cache.set(key, entry);
    stats.totalSize += size;
    stats.entryCount++;

    // Persist if enabled
    if (config.persistent) {
      this.saveToPersistentStorage(cacheName);
    }
  }

  /**
   * Delete entry from cache
   */
  delete(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !config || !stats) {
      return false;
    }

    const entry = cache.get(key);
    if (!entry) {
      return false;
    }

    cache.delete(key);
    stats.totalSize -= entry.size;
    stats.entryCount--;

    // Update persistent storage
    if (config.persistent) {
      this.saveToPersistentStorage(cacheName);
    }

    return true;
  }

  /**
   * Clear entire cache
   */
  clear(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !config || !stats) {
      return;
    }

    cache.clear();
    stats.totalSize = 0;
    stats.entryCount = 0;

    // Clear persistent storage
    if (config.persistent) {
      this.clearPersistentStorage(cacheName);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(cacheName: string): CacheStats | null {
    return this.stats.get(cacheName) || null;
  }

  /**
   * Get all cache statistics
   */
  getAllStats(): Map<string, CacheStats> {
    return new Map(this.stats);
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(cacheName: string, count: number): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !config || !stats) {
      return;
    }

    const entries = Array.from(cache.entries());
    let toEvict: string[] = [];

    switch (config.strategy) {
      case 'LRU': // Least Recently Used
        toEvict = entries
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, count)
          .map(([key]) => key);
        break;

      case 'LFU': // Least Frequently Used
        toEvict = entries
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .slice(0, count)
          .map(([key]) => key);
        break;

      case 'FIFO': // First In, First Out
        toEvict = entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, count)
          .map(([key]) => key);
        break;
    }

    // Remove evicted entries
    toEvict.forEach(key => {
      const entry = cache.get(key);
      if (entry) {
        cache.delete(key);
        stats.totalSize -= entry.size;
        stats.entryCount--;
        stats.evictions++;
      }
    });
  }

  /**
   * Calculate data size (approximate)
   */
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default size if calculation fails
    }
  }

  /**
   * Compress data (simple implementation)
   */
  private compress(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression using btoa (base64 encoding)
      // In production, you might want to use a proper compression library
      return btoa(jsonString);
    } catch {
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress data
   */
  private decompress(compressedData: string): any {
    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch {
      return compressedData;
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(stats: CacheStats): void {
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
  }

  /**
   * Load cache from persistent storage
   */
  private loadFromPersistentStorage(cacheName: string): void {
    try {
      const stored = localStorage.getItem(`cache_${cacheName}`);
      if (stored) {
        const data = JSON.parse(stored);
        const cache = this.caches.get(cacheName);
        const stats = this.stats.get(cacheName);

        if (cache && stats) {
          data.entries.forEach((entry: CacheEntry<any>) => {
            cache.set(entry.key, entry);
            stats.totalSize += entry.size;
            stats.entryCount++;
          });

          // Restore stats
          Object.assign(stats, data.stats);
        }
      }
    } catch (error) {
      console.error(`Failed to load cache ${cacheName} from storage:`, error);
    }
  }

  /**
   * Save cache to persistent storage
   */
  private saveToPersistentStorage(cacheName: string): void {
    try {
      const cache = this.caches.get(cacheName);
      const stats = this.stats.get(cacheName);

      if (cache && stats) {
        const data = {
          entries: Array.from(cache.values()),
          stats: { ...stats }
        };

        localStorage.setItem(`cache_${cacheName}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Failed to save cache ${cacheName} to storage:`, error);
    }
  }

  /**
   * Clear persistent storage for cache
   */
  private clearPersistentStorage(cacheName: string): void {
    try {
      localStorage.removeItem(`cache_${cacheName}`);
    } catch (error) {
      console.error(`Failed to clear cache ${cacheName} from storage:`, error);
    }
  }

  /**
   * Setup cleanup interval
   */
  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    this.caches.forEach((cache, cacheName) => {
      const config = this.configs.get(cacheName);
      const stats = this.stats.get(cacheName);

      if (!config || !stats) return;

      const expiredKeys: string[] = [];

      cache.forEach((entry, key) => {
        if (now - entry.timestamp > config.ttl) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => {
        const entry = cache.get(key);
        if (entry) {
          cache.delete(key);
          stats.totalSize -= entry.size;
          stats.entryCount--;
          stats.evictions++;
        }
      });

      // Update persistent storage if needed
      if (config.persistent && expiredKeys.length > 0) {
        this.saveToPersistentStorage(cacheName);
      }
    });
  }

  /**
   * Start background jobs
   */
  private startBackgroundJobs(): void {
    // Preload popular content
    this.addBackgroundJob('preloadPopular', 'Preload Popular Content', async () => {
      await this.preloadPopularContent();
    }, 10 * 60 * 1000); // Every 10 minutes

    // Optimize cache sizes
    this.addBackgroundJob('optimizeCache', 'Optimize Cache Sizes', async () => {
      await this.optimizeCacheSizes();
    }, 30 * 60 * 1000); // Every 30 minutes

    // Update statistics
    this.addBackgroundJob('updateStats', 'Update Cache Statistics', async () => {
      await this.updateCacheStatistics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Add background job
   */
  addBackgroundJob(id: string, name: string, fn: () => Promise<void>, interval: number): void {
    const job: BackgroundJob = {
      id,
      name,
      fn,
      interval,
      lastRun: 0,
      isRunning: false
    };

    this.backgroundJobs.set(id, job);

    const timerId = setInterval(async () => {
      if (!job.isRunning) {
        job.isRunning = true;
        try {
          await job.fn();
          job.lastRun = Date.now();
        } catch (error) {
          console.error(`Background job ${name} failed:`, error);
        } finally {
          job.isRunning = false;
        }
      }
    }, interval);

    this.jobTimers.set(id, timerId as unknown as number);
  }

  /**
   * Preload popular content
   */
  private async preloadPopularContent(): Promise<void> {
    // This would typically fetch and cache popular leaderboards, achievements, etc.
    console.log('Cache: Preloading popular content...');
  }

  /**
   * Optimize cache sizes based on usage patterns
   */
  private async optimizeCacheSizes(): Promise<void> {
    this.stats.forEach((stats, cacheName) => {
      const config = this.configs.get(cacheName);
      if (!config) return;

      // Adjust cache size based on hit rate
      if (stats.hitRate > 90 && stats.entryCount >= config.maxSize * 0.8) {
        // High hit rate and near capacity - increase size
        config.maxSize = Math.min(config.maxSize * 1.2, config.maxSize + 500);
      } else if (stats.hitRate < 50 && stats.entryCount < config.maxSize * 0.3) {
        // Low hit rate and low usage - decrease size
        config.maxSize = Math.max(config.maxSize * 0.8, 50);
      }
    });
  }

  /**
   * Update cache statistics
   */
  private async updateCacheStatistics(): Promise<void> {
    // Calculate and log cache performance metrics
    let totalHits = 0;
    let totalMisses = 0;
    let totalSize = 0;

    this.stats.forEach((stats) => {
      totalHits += stats.hits;
      totalMisses += stats.misses;
      totalSize += stats.totalSize;
    });

    const overallHitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;

    console.log('Cache Performance:', {
      overallHitRate: overallHitRate.toFixed(2) + '%',
      totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
      cacheCount: this.caches.size
    });
  }

  /**
   * Get background job status
   */
  getBackgroundJobStatus(): BackgroundJob[] {
    return Array.from(this.backgroundJobs.values());
  }

  /**
   * Stop background job
   */
  stopBackgroundJob(id: string): void {
    const timerId = this.jobTimers.get(id);
    if (timerId) {
      clearInterval(timerId);
      this.jobTimers.delete(id);
    }
    this.backgroundJobs.delete(id);
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    // Stop all background jobs
    this.jobTimers.forEach(timerId => clearInterval(timerId));
    this.jobTimers.clear();
    this.backgroundJobs.clear();

    // Save all persistent caches
    this.configs.forEach((config, cacheName) => {
      if (config.persistent) {
        this.saveToPersistentStorage(cacheName);
      }
    });

    // Clear memory
    this.caches.clear();
    this.configs.clear();
    this.stats.clear();
  }
}

// Export singleton instance
export const cacheService = new IntelligentCacheService();
export default cacheService;
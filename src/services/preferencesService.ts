/**
 * Preferences Persistence Service
 * 
 * Manages persistence of user preferences (language and theme) to localStorage
 * and Firebase Firestore. Provides error handling, retry logic, and debouncing
 * for optimal performance.
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoredPreferences, LanguageCode, ThemeMode } from '../types/contexts/preferences';

/**
 * LocalStorage Manager
 * 
 * Handles synchronous persistence of preferences to browser localStorage.
 * Provides error handling for quota exceeded and corrupted data scenarios.
 */
export class LocalStorageManager {
  private readonly STORAGE_KEY = 'amaplayer-preferences';

  /**
   * Save preferences to localStorage
   * 
   * @param preferences - The preferences object to save
   * @returns true if save was successful, false otherwise
   */
  save(preferences: StoredPreferences): boolean {
    try {
      const serialized = JSON.stringify(preferences);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          console.error('LocalStorage quota exceeded. Unable to save preferences.');
        } else {
          console.error('Failed to save preferences to localStorage:', error.message);
        }
      }
      return false;
    }
  }

  /**
   * Load preferences from localStorage
   * 
   * @returns The stored preferences or null if not found or invalid
   */
  load(): StoredPreferences | null {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized);
      
      // Validate the structure
      if (this.isValidPreferences(parsed)) {
        return parsed;
      }
      
      console.warn('Invalid preferences structure in localStorage. Clearing corrupted data.');
      this.clear();
      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to load preferences from localStorage:', error.message);
      }
      // Clear corrupted data
      this.clear();
      return null;
    }
  }

  /**
   * Clear preferences from localStorage
   */
  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to clear preferences from localStorage:', error.message);
      }
    }
  }

  /**
   * Validate preferences structure
   * 
   * @param data - The data to validate
   * @returns true if data is valid StoredPreferences
   */
  private isValidPreferences(data: any): data is StoredPreferences {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.language === 'string' &&
      typeof data.theme === 'string' &&
      (data.theme === 'dark' || data.theme === 'light') &&
      typeof data.lastUpdated === 'number'
    );
  }
}

/**
 * Firebase Sync Manager
 * 
 * Handles asynchronous persistence of preferences to Firebase Firestore.
 * Provides retry logic with exponential backoff and debouncing for
 * optimal performance and reduced Firebase costs.
 * 
 * Performance optimizations:
 * - Debouncing to batch multiple rapid changes
 * - Offline queue for syncing when connection restored
 * - Exponential backoff for retries
 * - Batch sync for multiple users (if needed)
 */
export class FirebaseSyncManager {
  private readonly COLLECTION_NAME = 'users';
  private readonly PREFERENCES_SUBCOLLECTION = 'preferences';
  private readonly PREFERENCES_DOC = 'settings';
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 10000; // 10 seconds
  
  // Debouncing
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms
  
  // Pending sync queue
  private pendingSyncs: Map<string, StoredPreferences> = new Map();
  
  // Offline queue
  private offlineQueue: Array<{ userId: string; preferences: StoredPreferences }> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  
  // Performance metrics
  private syncMetrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    syncTimes: [] as number[]
  };

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  /**
   * Sync preferences to Firebase with debouncing
   * 
   * @param userId - The user's Firebase UID
   * @param preferences - The preferences to sync
   * @returns Promise that resolves when sync is complete
   */
  async syncToFirebase(userId: string, preferences: StoredPreferences): Promise<void> {
    // If offline, add to queue
    if (!this.isOnline) {
      
      // Remove any existing entry for this user
      this.offlineQueue = this.offlineQueue.filter(item => item.userId !== userId);
      // Add new entry
      this.offlineQueue.push({ userId, preferences });
      return;
    }

    // Add to pending syncs
    this.pendingSyncs.set(userId, preferences);
    
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set new debounce timer
    return new Promise((resolve, reject) => {
      this.debounceTimer = setTimeout(async () => {
        const syncStart = performance.now();
        
        try {
          await this.executeSyncWithRetry(userId, preferences);
          this.pendingSyncs.delete(userId);
          
          // Track metrics
          const syncTime = performance.now() - syncStart;
          this.syncMetrics.totalSyncs++;
          this.syncMetrics.successfulSyncs++;
          this.syncMetrics.syncTimes.push(syncTime);
          
          // Keep only last 100 sync times
          if (this.syncMetrics.syncTimes.length > 100) {
            this.syncMetrics.syncTimes.shift();
          }
          
          resolve();
        } catch (error) {
          this.pendingSyncs.delete(userId);
          
          // Track metrics
          this.syncMetrics.totalSyncs++;
          this.syncMetrics.failedSyncs++;
          
          reject(error);
        }
      }, this.DEBOUNCE_DELAY);
    });
  }

  /**
   * Execute sync with retry logic
   * 
   * @param userId - The user's Firebase UID
   * @param preferences - The preferences to sync
   * @param retryCount - Current retry attempt
   */
  private async executeSyncWithRetry(
    userId: string,
    preferences: StoredPreferences,
    retryCount: number = 0
  ): Promise<void> {
    try {
      const preferencesRef = doc(
        db,
        this.COLLECTION_NAME,
        userId,
        this.PREFERENCES_SUBCOLLECTION,
        this.PREFERENCES_DOC
      );
      
      await setDoc(preferencesRef, preferences, { merge: true });
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.calculateRetryDelay(retryCount);
        
        console.warn(
          `Firebase sync failed (attempt ${retryCount + 1}/${this.MAX_RETRIES}). ` +
          `Retrying in ${delay}ms...`,
          error
        );
        
        await this.sleep(delay);
        return this.executeSyncWithRetry(userId, preferences, retryCount + 1);
      }
      
      // Max retries exceeded
      if (error instanceof Error) {
        console.error('Firebase sync failed after max retries:', error.message);
        throw new Error(`Failed to sync preferences to Firebase: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Load preferences from Firebase
   * 
   * @param userId - The user's Firebase UID
   * @returns The stored preferences or null if not found
   */
  async loadFromFirebase(userId: string): Promise<StoredPreferences | null> {
    try {
      const preferencesRef = doc(
        db,
        this.COLLECTION_NAME,
        userId,
        this.PREFERENCES_SUBCOLLECTION,
        this.PREFERENCES_DOC
      );
      
      const docSnap = await getDoc(preferencesRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Validate the structure
        if (this.isValidPreferences(data)) {
          return data as StoredPreferences;
        }
        
        console.warn('Invalid preferences structure in Firebase.');
        return null;
      }
      
      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to load preferences from Firebase:', error.message);
      }
      // Return null instead of throwing to allow fallback to localStorage
      return null;
    }
  }

  /**
   * Delete preferences from Firebase
   * 
   * @param userId - The user's Firebase UID
   */
  async deleteFromFirebase(userId: string): Promise<void> {
    try {
      const preferencesRef = doc(
        db,
        this.COLLECTION_NAME,
        userId,
        this.PREFERENCES_SUBCOLLECTION,
        this.PREFERENCES_DOC
      );
      
      await deleteDoc(preferencesRef);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to delete preferences from Firebase:', error.message);
        throw new Error(`Failed to delete preferences from Firebase: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Handle online event - process offline queue
   */
  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    
    await this.processOfflineQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    const queueCopy = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const { userId, preferences } of queueCopy) {
      try {
        await this.executeSyncWithRetry(userId, preferences);
      } catch (error) {
        console.error('Failed to sync queued preferences:', error);
        // Re-queue if still failing
        this.offlineQueue.push({ userId, preferences });
      }
    }
  }

  /**
   * Cancel any pending debounced syncs
   */
  cancelPendingSyncs(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingSyncs.clear();
  }

  /**
   * Get pending syncs (for testing/debugging)
   */
  getPendingSyncs(): Map<string, StoredPreferences> {
    return new Map(this.pendingSyncs);
  }

  /**
   * Get offline queue (for testing/debugging)
   */
  getOfflineQueue(): Array<{ userId: string; preferences: StoredPreferences }> {
    return [...this.offlineQueue];
  }

  /**
   * Get sync metrics
   */
  getSyncMetrics() {
    return {
      ...this.syncMetrics,
      averageSyncTime: this.syncMetrics.syncTimes.length > 0
        ? this.syncMetrics.syncTimes.reduce((a, b) => a + b, 0) / this.syncMetrics.syncTimes.length
        : 0
    };
  }

  /**
   * Reset sync metrics
   */
  resetMetrics(): void {
    this.syncMetrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0,
      syncTimes: []
    };
  }

  /**
   * Print sync metrics to console
   */
  printMetrics(): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const metrics = this.getSyncMetrics();

  }

  /**
   * Calculate retry delay with exponential backoff
   * 
   * @param retryCount - Current retry attempt number
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    return Math.min(delay, this.MAX_RETRY_DELAY);
  }

  /**
   * Sleep utility for retry delays
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate preferences structure
   * 
   * @param data - The data to validate
   * @returns true if data is valid StoredPreferences
   */
  private isValidPreferences(data: any): data is StoredPreferences {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.language === 'string' &&
      typeof data.theme === 'string' &&
      (data.theme === 'dark' || data.theme === 'light') &&
      typeof data.lastUpdated === 'number'
    );
  }
}

/**
 * Singleton instances for use throughout the application
 */
export const localStorageManager = new LocalStorageManager();
export const firebaseSyncManager = new FirebaseSyncManager();

// Expose utilities to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).preferencesService = {
    localStorage: localStorageManager,
    firebaseSync: firebaseSyncManager,
    printMetrics: () => firebaseSyncManager.printMetrics(),
    getMetrics: () => firebaseSyncManager.getSyncMetrics(),
    getOfflineQueue: () => firebaseSyncManager.getOfflineQueue(),
    getPendingSyncs: () => firebaseSyncManager.getPendingSyncs()
  };
}

// Bundle size optimization and loading performance utilities

interface LoadingStrategy {
  preload: string[];
  lazy: string[];
  critical: string[];
  defer: string[];
}

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  memoryUsage: number;
}

interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  chunkSizeLimit: number;
  preloadThreshold: number;
}

export class BundleOptimizationService {
  private config: OptimizationConfig = {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableCompression: true,
    enableCaching: true,
    chunkSizeLimit: 244 * 1024, // 244KB recommended by webpack
    preloadThreshold: 50 * 1024 // 50KB
  };

  private loadedModules: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupResourceHints();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      try {
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'measure', 'paint'] 
        });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }
    }
  }

  /**
   * Process performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationTiming(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.handleResourceTiming(entry as PerformanceResourceTiming);
        break;
      case 'paint':
        this.handlePaintTiming(entry);
        break;
      case 'measure':
        this.handleCustomMeasure(entry);
        break;
    }
  }

  /**
   * Handle navigation timing
   */
  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      totalTime: entry.loadEventEnd - entry.fetchStart,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnect: entry.connectEnd - entry.connectStart,
      serverResponse: entry.responseEnd - entry.requestStart
    };

    console.log('Navigation Performance:', metrics);
    this.reportPerformanceMetrics('navigation', metrics);
  }

  /**
   * Handle resource timing
   */
  private handleResourceTiming(entry: PerformanceResourceTiming): void {
    if (entry.name.includes('.js') || entry.name.includes('.css')) {
      const resourceMetrics = {
        name: entry.name,
        size: entry.transferSize || 0,
        loadTime: entry.responseEnd - entry.startTime,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0
      };

      this.analyzeResourcePerformance(resourceMetrics);
    }
  }

  /**
   * Handle paint timing
   */
  private handlePaintTiming(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      console.log('First Contentful Paint:', entry.startTime + 'ms');
    } else if (entry.name === 'largest-contentful-paint') {
      console.log('Largest Contentful Paint:', entry.startTime + 'ms');
    }
  }

  /**
   * Handle custom measures
   */
  private handleCustomMeasure(entry: PerformanceEntry): void {
    console.log(`Custom Measure ${entry.name}:`, entry.duration + 'ms');
  }

  /**
   * Analyze resource performance
   */
  private analyzeResourcePerformance(resource: any): void {
    // Check if resource is too large
    if (resource.size > this.config.chunkSizeLimit) {
      console.warn(`Large resource detected: ${resource.name} (${(resource.size / 1024).toFixed(2)}KB)`);
    }

    // Check if resource took too long to load
    if (resource.loadTime > 3000) {
      console.warn(`Slow resource detected: ${resource.name} (${resource.loadTime.toFixed(2)}ms)`);
    }

    // Log cache hits
    if (resource.cached) {
      console.log(`Cache hit: ${resource.name}`);
    }
  }

  /**
   * Setup resource hints for better loading
   */
  private setupResourceHints(): void {
    // Preconnect to external domains
    this.addResourceHint('preconnect', 'https://fonts.googleapis.com');
    this.addResourceHint('preconnect', 'https://api.example.com');

    // DNS prefetch for external resources
    this.addResourceHint('dns-prefetch', 'https://cdn.example.com');
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  /**
   * Add resource hint to document head
   */
  private addResourceHint(rel: string, href: string): void {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    const criticalResources = [
      '/static/css/main.css',
      '/static/js/vendor.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Lazy load module with code splitting
   */
  async lazyLoadModule<T>(modulePath: string): Promise<T> {
    if (this.loadedModules.has(modulePath)) {
      // Module already loaded, return from cache
      return Promise.resolve({} as T);
    }

    // Check if already loading
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath)!;
    }

    // Start loading
    const loadingPromise = this.loadModuleWithRetry<T>(modulePath);
    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.add(modulePath);
      this.loadingPromises.delete(modulePath);
      return module;
    } catch (error) {
      this.loadingPromises.delete(modulePath);
      throw error;
    }
  }

  /**
   * Load module with retry logic
   */
  private async loadModuleWithRetry<T>(modulePath: string, maxRetries: number = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        performance.mark(`module-load-start-${modulePath}`);
        
        const module = await import(modulePath);
        
        performance.mark(`module-load-end-${modulePath}`);
        performance.measure(
          `module-load-${modulePath}`,
          `module-load-start-${modulePath}`,
          `module-load-end-${modulePath}`
        );

        return module as T;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Module load attempt ${attempt} failed for ${modulePath}:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Failed to load module ${modulePath} after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Prefetch modules that are likely to be needed
   */
  prefetchModules(modules: string[]): void {
    modules.forEach(modulePath => {
      if (!this.loadedModules.has(modulePath) && !this.loadingPromises.has(modulePath)) {
        // Use requestIdleCallback if available
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            this.lazyLoadModule(modulePath).catch(error => {
              console.warn(`Prefetch failed for ${modulePath}:`, error);
            });
          });
        } else {
          // Fallback to setTimeout
          setTimeout(() => {
            this.lazyLoadModule(modulePath).catch(error => {
              console.warn(`Prefetch failed for ${modulePath}:`, error);
            });
          }, 100);
        }
      }
    });
  }

  /**
   * Optimize images for better loading
   */
  optimizeImages(): void {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add lazy loading
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }

      // Add decode hint
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }

      // Optimize based on viewport
      this.optimizeImageForViewport(img);
    });
  }

  /**
   * Optimize image based on viewport size
   */
  private optimizeImageForViewport(img: HTMLImageElement): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          const rect = image.getBoundingClientRect();
          
          // Use appropriate image size based on display size
          if (rect.width <= 300) {
            this.loadOptimizedImage(image, 'small');
          } else if (rect.width <= 600) {
            this.loadOptimizedImage(image, 'medium');
          } else {
            this.loadOptimizedImage(image, 'large');
          }
          
          observer.unobserve(image);
        }
      });
    }, {
      rootMargin: '50px'
    });

    observer.observe(img);
  }

  /**
   * Load optimized image variant
   */
  private loadOptimizedImage(img: HTMLImageElement, size: 'small' | 'medium' | 'large'): void {
    const originalSrc = img.src;
    const optimizedSrc = this.getOptimizedImageUrl(originalSrc, size);
    
    if (optimizedSrc !== originalSrc) {
      img.src = optimizedSrc;
    }
  }

  /**
   * Get optimized image URL
   */
  private getOptimizedImageUrl(originalUrl: string, size: 'small' | 'medium' | 'large'): string {
    // This would typically integrate with an image optimization service
    // For now, just return the original URL
    return originalUrl;
  }

  /**
   * Measure and report performance metrics
   */
  measurePerformance(name: string, fn: () => void | Promise<void>): void {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;

    performance.mark(startMark);

    const execute = async () => {
      try {
        await fn();
      } finally {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      }
    };

    execute();
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      bundleSize: this.estimateBundleSize(),
      loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      interactiveTime: navigation ? navigation.domInteractive - navigation.fetchStart : 0,
      memoryUsage: memory ? memory.usedJSHeapSize : 0
    };
  }

  /**
   * Estimate bundle size from loaded resources
   */
  private estimateBundleSize(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources
      .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
      .reduce((total, resource) => total + (resource.transferSize || 0), 0);
  }

  /**
   * Report performance metrics to analytics
   */
  private reportPerformanceMetrics(type: string, metrics: any): void {
    // This would typically send metrics to an analytics service
    console.log(`Performance Report [${type}]:`, metrics);
  }

  /**
   * Optimize font loading
   */
  optimizeFontLoading(): void {
    // Preload critical fonts
    const criticalFonts = [
      '/fonts/roboto-regular.woff2',
      '/fonts/roboto-bold.woff2'
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Add font-display: swap to CSS
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Roboto';
        font-display: swap;
        src: url('/fonts/roboto-regular.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup service worker for caching
   */
  setupServiceWorkerCaching(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered for caching');
          
          // Send cache configuration to service worker
          registration.active?.postMessage({
            type: 'CACHE_CONFIG',
            config: this.config
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    this.loadedModules.clear();
    this.loadingPromises.clear();
  }
}

// Export singleton instance
export const bundleOptimization = new BundleOptimizationService();
export default bundleOptimization;
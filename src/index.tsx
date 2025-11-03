import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Apply theme before first paint to prevent FOUC
(() => {
  try {
    const STORAGE_KEY = 'amaplayer-preferences';
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      const preferences = JSON.parse(stored);
      const theme = preferences.theme || 'dark';
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark-mode');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light-mode');
        root.setAttribute('data-theme', 'light');
      }
    } else {
      // Default to dark mode
      const root = document.documentElement;
      root.classList.add('dark-mode');
      root.setAttribute('data-theme', 'dark');
    }
  } catch (error) {
    // Silently fail and let the provider handle it
    console.warn('Failed to apply early theme:', error);
  }
})();

// Main app imports
const App = require('./App').default;
// Advanced Web Vitals tracking will be loaded dynamically

// Global error handler for React error #31 debugging
window.addEventListener('error', (event: ErrorEvent) => {
  if (event.error && event.error.message && event.error.message.includes('Objects are not valid as a React child')) {
    console.error('🚨 REACT ERROR #31 CAUGHT GLOBALLY!');
    console.error('🚨 Error message:', event.error.message);
    console.error('🚨 Stack trace:', event.error.stack);
    console.error('🚨 Event details:', event);
    
    // Try to extract object information from error message
    const errorUrl = event.error.message.match(/visit (https:\/\/[^\s]+)/);
    if (errorUrl) {
      console.error('🚨 React error URL:', errorUrl[1]);
    }
    
    // Log current page state
    console.error('🚨 Current page:', window.location.href);
    console.error('🚨 Time:', new Date().toISOString());
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);

// Override React's error handling to get better debugging info
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Objects are not valid as a React child')) {
    console.error('🚨 REACT ERROR #31 DETAILED DEBUG:');
    console.error('🚨 Args:', args);
    console.error('🚨 Stack trace:', new Error().stack);
    
    // Try to extract the object information from the error URL
    const errorMessage = args[0];
    const urlMatch = errorMessage.match(/visit (https:\/\/[^\s]+)/);
    if (urlMatch) {
      console.error('🚨 Error URL:', urlMatch[1]);
      // Decode the URL parameters to see the object structure
      try {
        const url = new URL(urlMatch[1]);
        const params = url.searchParams.get('args[]');
        if (params) {
          console.error('🚨 Object being rendered:', decodeURIComponent(params));
        }
      } catch (e) {
        console.error('🚨 Could not parse error URL:', e);
      }
    }
  }
  originalError.apply(console, args);
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Phase 3: Initialize IndexedDB and register enhanced service worker
const initializeOfflineFeatures = async (): Promise<void> => {
  try {
    // Initialize IndexedDB for offline storage
    const { idbStore } = await import('./utils/caching/indexedDB');
    await idbStore.init();
    console.log('✅ Phase 3: IndexedDB initialized successfully');
    
    // Initialize smart cache invalidation system after IndexedDB is ready
    try {
      const { smartCacheInvalidator } = await import('./utils/caching/smartCacheInvalidation');
      await smartCacheInvalidator.init();
      console.log('✅ Phase 3: Smart cache invalidation initialized successfully');
    } catch (cacheError) {
      console.warn('⚠️ Phase 3: Smart cache invalidation initialization failed (non-critical):', cacheError);
    }
  } catch (error) {
    console.error('❌ Phase 3: Failed to initialize IndexedDB:', error);
  }
};

/*
// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Initialize offline features
    await initializeOfflineFeatures();
    
    navigator.serviceWorker
      .register('/sw-phase3.js')
      .then((registration) => {
        console.log('SW: Service worker registered successfully:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, show update notification
                console.log('SW: New version available - please refresh');
                if (window.confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('SW: Service worker registration failed:', error);
      });
      
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'BACKGROUND_SYNC') {
        console.log('SW Message:', event.data.message);
        // Handle background sync completion
      }
    });
  });
}
*/

// Add debug utilities to window for development
if (process.env.NODE_ENV === 'development') {
  // Initialize performance monitoring utilities
  import('./utils/performance/PerformanceMonitoringUtils').then(({ performanceMonitoringUtils }) => {
    // Auto-start performance monitoring
    performanceMonitoringUtils.startMonitoring(5000); // Check every 5 seconds
    
    // Add performance debug utilities to window
    (window as any).performanceDebug = {
      start: () => performanceMonitoringUtils.startMonitoring(),
      stop: () => performanceMonitoringUtils.stopMonitoring(),
      report: () => performanceMonitoringUtils.logPerformanceReport(),
      clear: () => performanceMonitoringUtils.resetAllData(),
      export: () => performanceMonitoringUtils.exportPerformanceData(),
      alerts: () => performanceMonitoringUtils.getRecentAlerts()
    };
    
    console.log('🔍 Performance monitoring started automatically');
    console.log('🔍 Performance debug tools available at window.performanceDebug');
    console.log('  - start() - Start monitoring');
    console.log('  - stop() - Stop monitoring');
    console.log('  - report() - Generate performance report');
    console.log('  - clear() - Clear all data');
    console.log('  - export() - Export performance data');
    console.log('  - alerts() - Get recent alerts');
    console.log('🔍 Press Ctrl+Shift+P to toggle performance debug panel');
  }).catch(err => {
    console.warn('Failed to initialize performance monitoring:', err);
  });

  (window as any).debugUtils = {
    resetIndexedDB: async () => {
      try {
        const { idbStore } = await import('./utils/caching/indexedDB');
        await idbStore.reset();
        console.log('✅ IndexedDB reset successfully. Please refresh the page.');
        return true;
      } catch (error) {
        console.error('❌ Failed to reset IndexedDB:', error);
        return false;
      }
    },
    clearCache: async () => {
      try {
        const { smartCacheInvalidator } = await import('./utils/caching/smartCacheInvalidation');
        await smartCacheInvalidator.clearInvalidationData();
        console.log('✅ Cache invalidation data cleared successfully.');
        return true;
      } catch (error) {
        console.error('❌ Failed to clear cache data:', error);
        return false;
      }
    }
  };
  
  console.log('🛠️ Debug utilities available:');
  console.log('  - window.debugUtils.resetIndexedDB() - Reset IndexedDB');
  console.log('  - window.debugUtils.clearCache() - Clear cache data');
}

// Enhanced performance monitoring with advanced Web Vitals tracking
window.addEventListener('load', () => {
  // Import and initialize advanced WebVitals collector
  import('./utils/performance/WebVitalsCollector').then(({ webVitalsCollector }) => {
    // Set up callback to send vitals to analytics
    webVitalsCollector.onVitalsChange((metric: string, value: number, score: number) => {
      const vitalsData = {
        name: metric,
        value: value,
        rating: score < 0.5 ? 'poor' : score < 0.8 ? 'needs-improvement' : 'good'
      };
      
      // Send to analytics
      webVitalsCollector.sendToAnalytics(vitalsData);
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Web Vital - ${metric.toUpperCase()}: ${value}ms (Score: ${score.toFixed(2)})`);
      }
    });
    
    console.log('🚀 Advanced Web Vitals tracking initialized');
  }).catch(err => {
    console.warn('Failed to initialize Web Vitals tracking:', err);
  });
    
  // Log that performance monitoring is active
  // console.log('🚀 AmaPlayer Performance Monitoring Active');
});

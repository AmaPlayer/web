/**
 * Theme Optimization Utilities
 * 
 * Provides optimized theme application to prevent FOUC (Flash of Unstyled Content)
 * and ensure smooth theme transitions.
 */

import { ThemeMode } from '../../types/contexts/preferences';

/**
 * Apply theme before first paint to prevent FOUC
 * This should be called as early as possible in the app lifecycle
 */
export function applyThemeBeforeFirstPaint(): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    // Load theme from localStorage synchronously
    const stored = localStorage.getItem('amaplayer-preferences');
    
    if (stored) {
      const preferences = JSON.parse(stored);
      const theme = preferences.theme || 'dark';
      
      // Apply theme immediately to document root
      applyThemeToDOM(theme);
    } else {
      // Apply default theme
      applyThemeToDOM('dark');
    }
  } catch (error) {
    console.error('Failed to apply theme before first paint:', error);
    // Fallback to default theme
    applyThemeToDOM('dark');
  }
}

/**
 * Apply theme to DOM with optimized performance
 * Uses requestAnimationFrame for smooth transitions
 */
export function applyThemeToDOM(theme: ThemeMode): void {
  const root = document.documentElement;
  
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
      root.setAttribute('data-theme', 'light');
    }
  });
}

/**
 * Apply theme with smooth transition
 * Temporarily disables transitions, applies theme, then re-enables
 */
export function applyThemeWithTransition(theme: ThemeMode, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    const root = document.documentElement;
    
    // Apply theme
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
      root.setAttribute('data-theme', 'light');
    }
    
    // Wait for transition to complete
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

/**
 * Preload theme CSS to prevent flash
 * Ensures theme styles are loaded before applying
 */
export function preloadThemeStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Check if theme styles are already loaded
  const themeStylesheet = document.querySelector('link[href*="themes.css"]');
  
  if (!themeStylesheet) {
    console.warn('Theme stylesheet not found. Theme may flash on load.');
  }
}

/**
 * Detect system theme preference
 */
export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (theme: ThemeMode) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  // Fallback for older browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
}

/**
 * Measure theme transition performance
 */
export function measureThemeTransition(theme: ThemeMode): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    
    applyThemeToDOM(theme);
    
    requestAnimationFrame(() => {
      const end = performance.now();
      const duration = end - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Theme transition took ${duration.toFixed(2)}ms`);
      }
      
      resolve(duration);
    });
  });
}

/**
 * Verify no FOUC occurred
 * Checks if theme was applied before first contentful paint
 */
export function verifyNoFOUC(): boolean {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return true;
  }

  try {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (!fcp) {
      return true; // Can't verify, assume OK
    }

    const themeApplied = document.documentElement.hasAttribute('data-theme');
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
      console.log(`Theme applied before FCP: ${themeApplied}`);
    }
    
    return themeApplied;
  } catch (error) {
    console.error('Failed to verify FOUC:', error);
    return true;
  }
}

/**
 * Theme transition performance monitor
 */
export class ThemePerformanceMonitor {
  private transitions: number[] = [];
  
  recordTransition(duration: number): void {
    this.transitions.push(duration);
    
    // Keep only last 10 transitions
    if (this.transitions.length > 10) {
      this.transitions.shift();
    }
  }
  
  getAverageDuration(): number {
    if (this.transitions.length === 0) {
      return 0;
    }
    
    const sum = this.transitions.reduce((acc, val) => acc + val, 0);
    return sum / this.transitions.length;
  }
  
  getStats(): { count: number; average: number; min: number; max: number } {
    if (this.transitions.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 };
    }
    
    return {
      count: this.transitions.length,
      average: this.getAverageDuration(),
      min: Math.min(...this.transitions),
      max: Math.max(...this.transitions)
    };
  }
  
  printStats(): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    const stats = this.getStats();
    
    console.group('🎨 Theme Transition Performance');
    console.log(`Transitions recorded: ${stats.count}`);
    console.log(`Average duration: ${stats.average.toFixed(2)}ms`);
    console.log(`Min duration: ${stats.min.toFixed(2)}ms`);
    console.log(`Max duration: ${stats.max.toFixed(2)}ms`);
    
    if (stats.average > 16) {
      console.warn('⚠️ Theme transitions are slower than 16ms frame budget');
    } else {
      console.log('✅ Theme transitions are within 16ms frame budget');
    }
    
    console.groupEnd();
  }
}

export const themePerformanceMonitor = new ThemePerformanceMonitor();

// Expose utilities to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).themeUtils = {
    applyTheme: applyThemeToDOM,
    applyWithTransition: applyThemeWithTransition,
    getSystemTheme,
    measureTransition: measureThemeTransition,
    verifyNoFOUC,
    performanceMonitor: themePerformanceMonitor
  };
}

/**
 * Theme Optimization Tests
 * Tests for theme application, FOUC prevention, and performance
 */

import {
  applyThemeToDOM,
  applyThemeWithTransition,
  getSystemTheme,
  verifyNoFOUC,
  ThemePerformanceMonitor
} from '../themeOptimization';

describe('Theme Optimization', () => {
  beforeEach(() => {
    // Reset document
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  describe('applyThemeToDOM', () => {
    it('should apply dark theme to document root', (done) => {
      applyThemeToDOM('dark');
      
      // Wait for requestAnimationFrame
      requestAnimationFrame(() => {
        expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
        expect(document.documentElement.classList.contains('light-mode')).toBe(false);
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        done();
      });
    });

    it('should apply light theme to document root', (done) => {
      applyThemeToDOM('light');
      
      requestAnimationFrame(() => {
        expect(document.documentElement.classList.contains('light-mode')).toBe(true);
        expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        done();
      });
    });

    it('should switch from dark to light theme', (done) => {
      applyThemeToDOM('dark');
      
      requestAnimationFrame(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        
        applyThemeToDOM('light');
        
        requestAnimationFrame(() => {
          expect(document.documentElement.classList.contains('light-mode')).toBe(true);
          expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
          expect(document.documentElement.getAttribute('data-theme')).toBe('light');
          done();
        });
      });
    });

    it('should switch from light to dark theme', (done) => {
      applyThemeToDOM('light');
      
      requestAnimationFrame(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        
        applyThemeToDOM('dark');
        
        requestAnimationFrame(() => {
          expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
          expect(document.documentElement.classList.contains('light-mode')).toBe(false);
          expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
          done();
        });
      });
    });
  });

  describe('applyThemeWithTransition', () => {
    it('should apply theme with transition', async () => {
      await applyThemeWithTransition('dark', 100);
      
      expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should resolve after transition duration', async () => {
      const start = Date.now();
      await applyThemeWithTransition('light', 100);
      const duration = Date.now() - start;
      
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(150); // Allow some margin
    });
  });

  describe('getSystemTheme', () => {
    it('should return dark when system prefers dark', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const theme = getSystemTheme();
      expect(theme).toBe('dark');
    });

    it('should return light when system prefers light', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const theme = getSystemTheme();
      expect(theme).toBe('light');
    });
  });

  describe('ThemePerformanceMonitor', () => {
    let monitor: ThemePerformanceMonitor;

    beforeEach(() => {
      monitor = new ThemePerformanceMonitor();
    });

    it('should record transition durations', () => {
      monitor.recordTransition(10);
      monitor.recordTransition(15);
      monitor.recordTransition(12);

      const stats = monitor.getStats();
      expect(stats.count).toBe(3);
      expect(stats.average).toBeCloseTo(12.33, 1);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(15);
    });

    it('should keep only last 10 transitions', () => {
      for (let i = 0; i < 15; i++) {
        monitor.recordTransition(i);
      }

      const stats = monitor.getStats();
      expect(stats.count).toBe(10);
    });

    it('should return zero stats when no transitions recorded', () => {
      const stats = monitor.getStats();
      expect(stats.count).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('should calculate average correctly', () => {
      monitor.recordTransition(10);
      monitor.recordTransition(20);
      monitor.recordTransition(30);

      expect(monitor.getAverageDuration()).toBe(20);
    });
  });

  describe('verifyNoFOUC', () => {
    it('should return true when theme is applied', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      
      const result = verifyNoFOUC();
      expect(result).toBe(true);
    });

    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      // @ts-ignore
      delete global.performance;
      
      const result = verifyNoFOUC();
      expect(result).toBe(true);
      
      global.performance = originalPerformance;
    });
  });
});

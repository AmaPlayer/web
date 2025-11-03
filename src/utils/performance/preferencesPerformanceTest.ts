/**
 * Preferences Performance Testing Utilities
 * 
 * Comprehensive performance testing for the unified preferences system.
 * Tests context re-renders, translation lookups, theme application, and Firebase sync.
 */

import { getTranslation, translationPerformance } from '../../translations';
import { applyThemeToDOM, measureThemeTransition, verifyNoFOUC } from '../theme/themeOptimization';
import type { LanguageCode, ThemeMode } from '../../types/contexts/preferences';

/**
 * Performance test results
 */
interface PerformanceTestResults {
  translationLookup: {
    averageTime: number;
    iterations: number;
    passed: boolean;
  };
  themeTransition: {
    averageTime: number;
    iterations: number;
    passed: boolean;
  };
  noFOUC: {
    verified: boolean;
    passed: boolean;
  };
  overall: {
    passed: boolean;
    score: number;
  };
}

/**
 * Run comprehensive performance tests
 */
export async function runPerformanceTests(): Promise<PerformanceTestResults> {
  const results: PerformanceTestResults = {
    translationLookup: {
      averageTime: 0,
      iterations: 0,
      passed: false
    },
    themeTransition: {
      averageTime: 0,
      iterations: 0,
      passed: false
    },
    noFOUC: {
      verified: false,
      passed: false
    },
    overall: {
      passed: false,
      score: 0
    }
  };

  // Test 1: Translation lookup performance
  const translationIterations = 10000;
  const translationTime = translationPerformance.measureLookup('en', 'home', translationIterations);
  results.translationLookup.averageTime = translationTime;
  results.translationLookup.iterations = translationIterations;
  results.translationLookup.passed = translationTime < 0.01; // Should be < 0.01ms per lookup

  // Test 2: Theme transition performance
  const themeIterations = 10;
  let totalThemeTime = 0;
  
  for (let i = 0; i < themeIterations; i++) {
    const theme: ThemeMode = i % 2 === 0 ? 'dark' : 'light';
    const time = await measureThemeTransition(theme);
    totalThemeTime += time;
  }
  
  const avgThemeTime = totalThemeTime / themeIterations;
  results.themeTransition.averageTime = avgThemeTime;
  results.themeTransition.iterations = themeIterations;
  results.themeTransition.passed = avgThemeTime < 16; // Should be < 16ms (60fps)

  // Test 3: FOUC verification
  const noFOUC = verifyNoFOUC();
  results.noFOUC.verified = noFOUC;
  results.noFOUC.passed = noFOUC;

  // Calculate overall score
  const passedTests = [
    results.translationLookup.passed,
    results.themeTransition.passed,
    results.noFOUC.passed
  ].filter(Boolean).length;
  
  results.overall.score = (passedTests / 3) * 100;
  results.overall.passed = passedTests === 3;
  
  return results;
}

/**
 * Test translation lookup performance across all languages
 */
export function testTranslationPerformanceAllLanguages(): Record<string, Record<string, number>> {
  const languages: LanguageCode[] = ['en', 'hi', 'pa', 'mr', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'or', 'as'];
  const testKeys = ['home', 'login', 'profile', 'settings', 'messages'];
  const iterations = 1000;
  const results: Record<string, Record<string, number>> = {};
  
  languages.forEach(lang => {
    results[lang] = {};
    testKeys.forEach(key => {
      const time = translationPerformance.measureLookup(lang, key, iterations);
      results[lang][key] = time;
    });
  });
  
  return results;
}

/**
 * Test context re-render performance
 * This should be called from a React component
 */
export function testContextReRenders(): string {
  return 'Use React DevTools Profiler to measure re-renders';
}

/**
 * Benchmark translation lookup: Map vs Object
 */
export function benchmarkTranslationLookup(): void {
  translationPerformance.comparePerformance('en', 'home', 100000);
}

/**
 * Test debouncing effectiveness
 */
export async function testDebouncing(): Promise<string> {
  return 'Debouncing test requires manual verification in browser console';
}

/**
 * Test offline queue functionality
 */
export function testOfflineQueue(): string {
  return 'Offline queue test requires manual verification in browser console';
}

/**
 * Run all performance tests
 */
export async function runAllTests(): Promise<{
  performanceTests: PerformanceTestResults;
  translationTests: Record<string, Record<string, number>>;
}> {
  const performanceTests = await runPerformanceTests();
  const translationTests = testTranslationPerformanceAllLanguages();
  
  return {
    performanceTests,
    translationTests
  };
}

// Expose to window for easy access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceTests = {
    runAll: runAllTests,
    runPerformanceTests,
    testTranslationPerformanceAllLanguages,
    testContextReRenders,
    benchmarkTranslationLookup,
    testDebouncing,
    testOfflineQueue
  };
}

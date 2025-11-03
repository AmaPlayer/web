/**
 * Preferences Profiler Component
 * 
 * React Profiler wrapper to measure performance of UnifiedPreferencesContext
 * and detect unnecessary re-renders in consuming components.
 * 
 * Usage:
 * Wrap your component tree with <PreferencesProfiler> in development mode
 * to track render performance and identify optimization opportunities.
 */

import React, { Profiler, ProfilerOnRenderCallback } from 'react';

interface PreferencesProfilerProps {
  children: React.ReactNode;
  id?: string;
  enabled?: boolean;
}

/**
 * Profiler callback that logs render metrics
 */
const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  // Only track in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Record metrics for analysis
  PerformanceMetrics.recordRender(id, actualDuration);
};

/**
 * PreferencesProfiler Component
 * 
 * Wraps children with React Profiler to measure render performance.
 * Only active in development mode.
 */
export function PreferencesProfiler({ 
  children, 
  id = 'UnifiedPreferences',
  enabled = process.env.NODE_ENV === 'development'
}: PreferencesProfilerProps): React.ReactElement {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}

/**
 * Hook to track component re-renders
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useRenderTracker('MyComponent');
 *   // ... rest of component
 * }
 * ```
 */
export function useRenderTracker(componentName: string): void {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
  });
}

/**
 * Hook to track prop changes
 * 
 * Usage:
 * ```tsx
 * function MyComponent(props) {
 *   usePropChangeTracker('MyComponent', props);
 *   // ... rest of component
 * }
 * ```
 */
export function usePropChangeTracker(componentName: string, props: Record<string, any>): void {
  const previousProps = React.useRef<Record<string, any>>(props);
  
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const changedProps: Record<string, { old: any; new: any }> = {};
    
    Object.keys(props).forEach(key => {
      if (previousProps.current[key] !== props[key]) {
        changedProps[key] = {
          old: previousProps.current[key],
          new: props[key]
        };
      }
    });
    
    previousProps.current = props;
  });
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  private static metrics: Map<string, number[]> = new Map();
  
  /**
   * Record a render duration
   */
  static recordRender(componentId: string, duration: number): void {
    if (!this.metrics.has(componentId)) {
      this.metrics.set(componentId, []);
    }
    
    this.metrics.get(componentId)!.push(duration);
  }
  
  /**
   * Get average render duration for a component
   */
  static getAverageDuration(componentId: string): number {
    const durations = this.metrics.get(componentId);
    
    if (!durations || durations.length === 0) {
      return 0;
    }
    
    const sum = durations.reduce((acc, val) => acc + val, 0);
    return sum / durations.length;
  }
  
  /**
   * Get all metrics
   */
  static getAllMetrics(): Record<string, { count: number; average: number; max: number; min: number }> {
    const result: Record<string, { count: number; average: number; max: number; min: number }> = {};
    
    this.metrics.forEach((durations, componentId) => {
      result[componentId] = {
        count: durations.length,
        average: this.getAverageDuration(componentId),
        max: Math.max(...durations),
        min: Math.min(...durations)
      };
    });
    
    return result;
  }
  
  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
  }
  
  /**
   * Print metrics to console
   */
  static printMetrics(): Record<string, { count: number; average: number; max: number; min: number }> {
    return this.getAllMetrics();
  }
}

// Expose metrics to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).preferencesMetrics = PerformanceMetrics;
}

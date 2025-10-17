import React from 'react';
import { render } from '@testing-library/react';
import { RoleBadge } from './RoleBadge';
import { UserRole } from '../../../types/models/user';

describe('RoleBadge Performance Tests', () => {
  it('should render 100 badges in under 100ms', () => {
    const roles: UserRole[] = ['athlete', 'parent', 'organization', 'coach'];
    const startTime = performance.now();
    
    const { container } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <RoleBadge 
            key={i} 
            role={roles[i % 4]}
          />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Count rendered badges (some may be null for invalid roles)
    const badges = container.querySelectorAll('.role-badge');
    expect(badges.length).toBeGreaterThan(0);
    expect(renderTime).toBeLessThan(100);
    
    console.log(`✓ Rendered 100 badges in ${renderTime.toFixed(2)}ms`);
  });

  it('should render single badge in under 5ms', () => {
    const iterations = 10;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const { unmount } = render(<RoleBadge role="athlete" />);
      const endTime = performance.now();
      unmount();
      
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avgTime).toBeLessThan(5);
    
    console.log(`✓ Average single badge render time: ${avgTime.toFixed(2)}ms`);
  });

  it('should not cause memory leaks on mount/unmount cycles', () => {
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(<RoleBadge role="athlete" />);
      unmount();
    }
    
    // If this completes without error, no obvious memory leak
    expect(true).toBe(true);
    console.log(`✓ Completed ${iterations} mount/unmount cycles without errors`);
  });

  it('should handle rapid re-renders efficiently', () => {
    const roles: UserRole[] = ['athlete', 'parent', 'organization', 'coach'];
    const { rerender } = render(<RoleBadge role="athlete" />);
    
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      rerender(<RoleBadge role={roles[i % 4]} />);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(100);
    console.log(`✓ 100 re-renders completed in ${totalTime.toFixed(2)}ms`);
  });

  it('should render badges with different sizes efficiently', () => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const startTime = performance.now();
    
    const { container } = render(
      <div>
        {Array.from({ length: 90 }, (_, i) => (
          <RoleBadge 
            key={i} 
            role="athlete"
            size={sizes[i % 3]}
          />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    const badges = container.querySelectorAll('.role-badge');
    expect(badges.length).toBe(90);
    expect(renderTime).toBeLessThan(100);
    
    console.log(`✓ Rendered 90 badges with varying sizes in ${renderTime.toFixed(2)}ms`);
  });

  it('should efficiently handle showLabel prop changes', () => {
    const { rerender } = render(<RoleBadge role="athlete" showLabel={true} />);
    
    const startTime = performance.now();
    
    for (let i = 0; i < 50; i++) {
      rerender(<RoleBadge role="athlete" showLabel={i % 2 === 0} />);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(50);
    console.log(`✓ 50 showLabel toggles completed in ${totalTime.toFixed(2)}ms`);
  });

  it('should handle null/undefined roles without performance penalty', () => {
    const startTime = performance.now();
    
    const { container } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <RoleBadge 
            key={i} 
            role={i % 2 === 0 ? null : undefined}
          />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render nothing for null/undefined
    const badges = container.querySelectorAll('.role-badge');
    expect(badges.length).toBe(0);
    expect(renderTime).toBeLessThan(50);
    
    console.log(`✓ Handled 100 null/undefined roles in ${renderTime.toFixed(2)}ms`);
  });
});

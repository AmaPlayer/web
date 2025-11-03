import React, { useEffect, useState } from 'react';

interface StatCounterProps {
  value: number;
  icon?: string;
  label?: string;
  className?: string;
  animate?: boolean;
  compact?: boolean;
  suffix?: string;
}

/**
 * StatCounter Component
 * Displays animated counters for metrics like views, likes, participants
 */
export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  icon,
  label,
  className = '',
  animate = true,
  compact = false,
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    // Animate counter from 0 to value
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate]);

  /**
   * Format number for display (e.g., 1234 -> 1.2K)
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (compact) {
    return (
      <span className={`stat-counter compact ${className}`}>
        {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
        <span className="stat-value">{formatNumber(displayValue)}{suffix}</span>
      </span>
    );
  }

  return (
    <div className={`stat-counter ${className}`}>
      {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
      <div className="stat-content">
        <span className="stat-value">{formatNumber(displayValue)}{suffix}</span>
        {label && <span className="stat-label">{label}</span>}
      </div>
    </div>
  );
};

export default StatCounter;

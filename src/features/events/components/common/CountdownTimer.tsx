import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';

interface CountdownTimerProps {
  targetDate: Date | Timestamp;
  onComplete?: () => void;
  className?: string;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * CountdownTimer Component
 * Displays countdown to event start time
 * Shows "Happening Now" when event starts
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  onComplete,
  className = '',
  compact = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeRemaining.total <= 0) {
    return (
      <div className={`countdown-timer happening-now ${className}`}>
        <span className="live-indicator">🔴</span>
        <span className="happening-text">Happening Now</span>
      </div>
    );
  }

  // Compact format for cards
  if (compact) {
    if (timeRemaining.days > 0) {
      return (
        <div className={`countdown-timer compact ${className}`}>
          <span className="countdown-value">{timeRemaining.days}d {timeRemaining.hours}h</span>
        </div>
      );
    }

    if (timeRemaining.hours > 0) {
      return (
        <div className={`countdown-timer compact ${className}`}>
          <span className="countdown-value">{timeRemaining.hours}h {timeRemaining.minutes}m</span>
        </div>
      );
    }

    return (
      <div className={`countdown-timer compact urgent ${className}`}>
        <span className="countdown-value pulse">{timeRemaining.minutes}m {timeRemaining.seconds}s</span>
      </div>
    );
  }

  // Full format for detail page
  return (
    <div className={`countdown-timer full ${className}`}>
      {timeRemaining.days > 0 && (
        <div className="countdown-segment">
          <span className="countdown-number">{timeRemaining.days}</span>
          <span className="countdown-label">{timeRemaining.days === 1 ? 'day' : 'days'}</span>
        </div>
      )}

      {(timeRemaining.days > 0 || timeRemaining.hours > 0) && (
        <div className="countdown-segment">
          <span className="countdown-number">{timeRemaining.hours}</span>
          <span className="countdown-label">{timeRemaining.hours === 1 ? 'hour' : 'hours'}</span>
        </div>
      )}

      <div className="countdown-segment">
        <span className="countdown-number">{timeRemaining.minutes}</span>
        <span className="countdown-label">{timeRemaining.minutes === 1 ? 'minute' : 'minutes'}</span>
      </div>

      {timeRemaining.days === 0 && (
        <div className="countdown-segment">
          <span className="countdown-number">{timeRemaining.seconds}</span>
          <span className="countdown-label">{timeRemaining.seconds === 1 ? 'second' : 'seconds'}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Calculate time remaining until target date
 */
function calculateTimeRemaining(targetDate: Date | Timestamp): TimeRemaining {
  const now = new Date().getTime();
  const target = targetDate instanceof Date ? targetDate.getTime() : targetDate.toMillis();
  const total = target - now;

  if (total <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    total,
  };
}

export default CountdownTimer;

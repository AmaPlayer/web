import React from 'react';
import { StreakInfo, StreakType } from '@features/events/types/user.types';
import { formatDaysAgo } from '@features/events/utils/timestampHelpers';

interface StreakDisplayProps {
  streaks: StreakInfo[];
  showAll?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * StreakDisplay Component
 * Displays user streak information with visual indicators
 * Requirements: 2.2, 8.2 - Streak counting and progress visualization
 */
export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streaks,
  showAll = true,
  compact = false,
  className = ''
}) => {
  const getStreakIcon = (type: StreakType): string => {
    switch (type) {
      case StreakType.DAILY_LOGIN:
        return '📅';
      case StreakType.EVENT_PARTICIPATION:
        return '🏃';
      case StreakType.CHALLENGE_COMPLETION:
        return '🎯';
      case StreakType.SOCIAL_INTERACTION:
        return '💬';
      default:
        return '🔥';
    }
  };

  const getStreakName = (type: StreakType): string => {
    switch (type) {
      case StreakType.DAILY_LOGIN:
        return 'Daily Login';
      case StreakType.EVENT_PARTICIPATION:
        return 'Event Participation';
      case StreakType.CHALLENGE_COMPLETION:
        return 'Challenge Completion';
      case StreakType.SOCIAL_INTERACTION:
        return 'Social Interaction';
      default:
        return (type as string).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStreakDescription = (type: StreakType): string => {
    switch (type) {
      case StreakType.DAILY_LOGIN:
        return 'Consecutive days logged in';
      case StreakType.EVENT_PARTICIPATION:
        return 'Consecutive events participated';
      case StreakType.CHALLENGE_COMPLETION:
        return 'Consecutive challenges completed';
      case StreakType.SOCIAL_INTERACTION:
        return 'Consecutive days with social activity';
      default:
        return 'Consecutive activities';
    }
  };

  const getStreakColor = (current: number, longest: number): string => {
    if (current === 0) return 'streak-inactive';
    if (current >= longest * 0.8) return 'streak-hot';
    if (current >= 7) return 'streak-good';
    if (current >= 3) return 'streak-building';
    return 'streak-starting';
  };

  // Use imported formatDaysAgo from timestampHelpers

  // Filter streaks to show
  const displayStreaks = showAll ? streaks : streaks.filter(s => s.isActive || s.current > 0);

  if (displayStreaks.length === 0) {
    return (
      <div className={`streak-display empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">🔥</div>
          <h4 className="empty-title">No Active Streaks</h4>
          <p className="empty-description">
            Start participating in activities to build your streaks!
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`streak-display compact ${className}`}>
        <div className="streak-summary">
          {displayStreaks.map((streak) => (
            <div
              key={streak.type}
              className={`streak-item-compact ${getStreakColor(streak.current, streak.longest)}`}
              title={`${getStreakName(streak.type)}: ${streak.current} current, ${streak.longest} best`}
            >
              <span className="streak-icon">{getStreakIcon(streak.type)}</span>
              <span className="streak-count">{streak.current}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`streak-display ${className}`}>
      <div className="streak-header">
        <h3 className="streak-title">🔥 Current Streaks</h3>
        <div className="streak-legend">
          <span className="legend-item">
            <span className="legend-dot streak-hot"></span>
            <span className="legend-text">Hot</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot streak-good"></span>
            <span className="legend-text">Good</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot streak-building"></span>
            <span className="legend-text">Building</span>
          </span>
        </div>
      </div>

      <div className="streak-grid">
        {displayStreaks.map((streak) => (
          <div
            key={streak.type}
            className={`streak-card ${getStreakColor(streak.current, streak.longest)} ${
              streak.isActive ? 'active' : 'inactive'
            }`}
          >
            {/* Header */}
            <div className="streak-card-header">
              <div className="streak-info">
                <span className="streak-icon-large">{getStreakIcon(streak.type)}</span>
                <div className="streak-details">
                  <h4 className="streak-name">{getStreakName(streak.type)}</h4>
                  <p className="streak-description">{getStreakDescription(streak.type)}</p>
                </div>
              </div>
              <div className="streak-status">
                {streak.isActive ? (
                  <span className="status-badge active">Active</span>
                ) : (
                  <span className="status-badge inactive">Inactive</span>
                )}
              </div>
            </div>

            {/* Current Streak */}
            <div className="streak-current">
              <div className="current-count">
                <span className="count-number">{streak.current}</span>
                <span className="count-label">Current</span>
              </div>
              
              {/* Progress bar */}
              <div className="streak-progress">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min((streak.current / Math.max(streak.longest, 1)) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span className="progress-start">0</span>
                  <span className="progress-end">{streak.longest}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="streak-stats">
              <div className="stat-item">
                <span className="stat-value">{streak.longest}</span>
                <span className="stat-label">Best</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatDaysAgo(streak.lastUpdated)}</span>
                <span className="stat-label">Last Updated</span>
              </div>
            </div>

            {/* Motivational message */}
            {streak.isActive && (
              <div className="streak-motivation">
                {streak.current >= 7 && "🔥 You're on fire! Keep it up!"}
                {streak.current >= 3 && streak.current < 7 && "💪 Great momentum! Don't break it!"}
                {streak.current > 0 && streak.current < 3 && "🌱 Building a habit! Stay consistent!"}
              </div>
            )}

            {/* Achievement indicator */}
            {streak.current === streak.longest && streak.current > 0 && (
              <div className="streak-achievement">
                <span className="achievement-icon">🏆</span>
                <span className="achievement-text">Personal Best!</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall streak summary */}
      <div className="streak-summary-footer">
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-value">
              {displayStreaks.filter(s => s.isActive).length}
            </span>
            <span className="summary-label">Active Streaks</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">
              {Math.max(...displayStreaks.map(s => s.longest))}
            </span>
            <span className="summary-label">Longest Streak</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">
              {displayStreaks.reduce((sum, s) => sum + s.current, 0)}
            </span>
            <span className="summary-label">Total Current</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;
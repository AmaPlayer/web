import React, { useState, useEffect } from 'react';
import { LeaderboardType, LeaderboardPeriod, RankChange } from '@features/events/types/engagement.types';

interface RankingChange {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  leaderboardType: LeaderboardType;
  period: LeaderboardPeriod;
  oldRank: number;
  newRank: number;
  change: RankChange;
  timestamp: Date;
}

interface RankingChangeNotificationProps {
  changes: RankingChange[];
  onDismiss?: (changeId: string) => void;
  onDismissAll?: () => void;
  autoHideDelay?: number; // in milliseconds
  maxVisible?: number;
  className?: string;
}

export const RankingChangeNotification: React.FC<RankingChangeNotificationProps> = ({
  changes,
  onDismiss,
  onDismissAll,
  autoHideDelay = 5000,
  maxVisible = 3,
  className = ''
}) => {
  const [visibleChanges, setVisibleChanges] = useState<RankingChange[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Filter out dismissed changes and limit to maxVisible
    const filtered = changes
      .filter(change => !dismissedIds.has(change.id))
      .slice(0, maxVisible);
    
    setVisibleChanges(filtered);
  }, [changes, dismissedIds, maxVisible]);

  useEffect(() => {
    if (autoHideDelay > 0) {
      const timers = visibleChanges.map(change => 
        setTimeout(() => {
          handleDismiss(change.id);
        }, autoHideDelay)
      );

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [visibleChanges, autoHideDelay]);

  const handleDismiss = (changeId: string) => {
    setDismissedIds(prev => new Set([...prev, changeId]));
    if (onDismiss) {
      onDismiss(changeId);
    }
  };

  const handleDismissAll = () => {
    const allIds = new Set(visibleChanges.map(change => change.id));
    setDismissedIds(prev => new Set([...prev, ...allIds]));
    if (onDismissAll) {
      onDismissAll();
    }
  };

  const getLeaderboardTitle = (type: LeaderboardType): string => {
    const titles = {
      [LeaderboardType.ENGAGEMENT_SCORE]: 'Engagement',
      [LeaderboardType.PARTICIPATION]: 'Participation',
      [LeaderboardType.ACHIEVEMENTS]: 'Achievements',
      [LeaderboardType.CHALLENGE_WINS]: 'Challenges',
      [LeaderboardType.SOCIAL_IMPACT]: 'Social Impact',
      [LeaderboardType.TEAM_PERFORMANCE]: 'Team Performance'
    };
    return titles[type] || 'Leaderboard';
  };

  const getPeriodLabel = (period: LeaderboardPeriod): string => {
    const labels = {
      [LeaderboardPeriod.DAILY]: 'Daily',
      [LeaderboardPeriod.WEEKLY]: 'Weekly',
      [LeaderboardPeriod.MONTHLY]: 'Monthly',
      [LeaderboardPeriod.ALL_TIME]: 'All Time',
      [LeaderboardPeriod.EVENT_SPECIFIC]: 'Event'
    };
    return labels[period] || 'All Time';
  };

  const getChangeMessage = (change: RankingChange): string => {
    const leaderboard = getLeaderboardTitle(change.leaderboardType);
    const period = getPeriodLabel(change.period);
    
    switch (change.change) {
      case RankChange.UP:
        const positionsUp = change.oldRank - change.newRank;
        return `You moved up ${positionsUp} position${positionsUp !== 1 ? 's' : ''} to #${change.newRank} in ${period} ${leaderboard}!`;
      
      case RankChange.DOWN:
        const positionsDown = change.newRank - change.oldRank;
        return `You dropped ${positionsDown} position${positionsDown !== 1 ? 's' : ''} to #${change.newRank} in ${period} ${leaderboard}.`;
      
      case RankChange.NEW:
        return `You're now ranked #${change.newRank} in ${period} ${leaderboard}!`;
      
      default:
        return `Your rank in ${period} ${leaderboard} is #${change.newRank}.`;
    }
  };

  const getChangeIcon = (change: RankChange): string => {
    const icons = {
      [RankChange.UP]: '🎉',
      [RankChange.DOWN]: '📉',
      [RankChange.NEW]: '🆕',
      [RankChange.SAME]: 'ℹ️'
    };
    return icons[change] || 'ℹ️';
  };

  const getChangeColor = (change: RankChange): string => {
    const colors = {
      [RankChange.UP]: 'success',
      [RankChange.DOWN]: 'warning',
      [RankChange.NEW]: 'info',
      [RankChange.SAME]: 'neutral'
    };
    return colors[change] || 'neutral';
  };

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (visibleChanges.length === 0) {
    return null;
  }

  return (
    <div className={`ranking-change-notifications ${className}`}>
      <div className="notifications-header">
        <h4 className="notifications-title">Ranking Updates</h4>
        {visibleChanges.length > 1 && (
          <button
            className="dismiss-all-button"
            onClick={handleDismissAll}
            aria-label="Dismiss all notifications"
          >
            Dismiss All
          </button>
        )}
      </div>

      <div className="notifications-list">
        {visibleChanges.map((change) => (
          <div
            key={change.id}
            className={`ranking-notification ${getChangeColor(change.change)}`}
            role="alert"
            aria-live="polite"
          >
            <div className="notification-icon">
              <span aria-hidden="true">{getChangeIcon(change.change)}</span>
            </div>

            <div className="notification-content">
              <div className="notification-header">
                {change.userAvatar && (
                  <img
                    src={change.userAvatar}
                    alt={`${change.userName}'s avatar`}
                    className="user-avatar-small"
                  />
                )}
                <span className="user-name">{change.userName}</span>
                <span className="timestamp">{formatTimeAgo(change.timestamp)}</span>
              </div>

              <div className="notification-message">
                {getChangeMessage(change)}
              </div>

              <div className="notification-details">
                <div className="rank-change-visual">
                  <span className="old-rank">#{change.oldRank}</span>
                  <span className="arrow" aria-hidden="true">
                    {change.change === RankChange.UP ? '↗️' : 
                     change.change === RankChange.DOWN ? '↘️' : '→'}
                  </span>
                  <span className="new-rank">#{change.newRank}</span>
                </div>
              </div>
            </div>

            <button
              className="dismiss-button"
              onClick={() => handleDismiss(change.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {changes.length > maxVisible && (
        <div className="notifications-footer">
          <span className="more-notifications">
            +{changes.length - maxVisible} more ranking updates
          </span>
        </div>
      )}
    </div>
  );
};

// Hook for managing ranking change notifications
export const useRankingChangeNotifications = () => {
  const [changes, setChanges] = useState<RankingChange[]>([]);

  const addRankingChange = (change: Omit<RankingChange, 'id' | 'timestamp'>) => {
    const newChange: RankingChange = {
      ...change,
      id: `${change.userId}_${change.leaderboardType}_${change.period}_${Date.now()}`,
      timestamp: new Date()
    };
    
    setChanges(prev => [newChange, ...prev]);
  };

  const dismissChange = (changeId: string) => {
    setChanges(prev => prev.filter(change => change.id !== changeId));
  };

  const dismissAll = () => {
    setChanges([]);
  };

  const clearOldChanges = (maxAge: number = 24 * 60 * 60 * 1000) => { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    setChanges(prev => prev.filter(change => change.timestamp > cutoff));
  };

  return {
    changes,
    addRankingChange,
    dismissChange,
    dismissAll,
    clearOldChanges
  };
};
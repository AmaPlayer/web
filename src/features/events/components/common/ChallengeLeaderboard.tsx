import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, RankChange } from '@features/events/types/engagement.types';
import { challengeSystem, ChallengeLeaderboardEntry } from '@features/events/services/challengeSystem';

interface ChallengeLeaderboardProps {
  challengeId: string;
  className?: string;
  maxEntries?: number;
  showUserHighlight?: boolean;
  currentUserId?: string;
  refreshInterval?: number; // in milliseconds for real-time updates
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challengeId,
  className = '',
  maxEntries = 10,
  showUserHighlight = true,
  currentUserId,
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const entries = await challengeSystem.getChallengeLeaderboard(challengeId);
      setLeaderboard(entries.slice(0, maxEntries));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time updates
    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => clearInterval(interval);
  }, [challengeId, maxEntries, refreshInterval]);

  const getRankChangeIcon = (change: RankChange): string => {
    const icons = {
      [RankChange.UP]: '📈',
      [RankChange.DOWN]: '📉',
      [RankChange.SAME]: '➖',
      [RankChange.NEW]: '🆕'
    };
    return icons[change] || '';
  };

  const getRankChangeColor = (change: RankChange): string => {
    const colors = {
      [RankChange.UP]: 'green',
      [RankChange.DOWN]: 'red',
      [RankChange.SAME]: 'gray',
      [RankChange.NEW]: 'blue'
    };
    return colors[change] || 'gray';
  };

  const getRankMedal = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (loading) {
    return (
      <div className={`challenge-leaderboard loading ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Leaderboard</h3>
        </div>
        <div className="leaderboard-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`challenge-leaderboard error ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Leaderboard</h3>
        </div>
        <div className="leaderboard-error">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="retry-button"
            onClick={fetchLeaderboard}
            aria-label="Retry loading leaderboard"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={`challenge-leaderboard empty ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Leaderboard</h3>
        </div>
        <div className="leaderboard-empty">
          <span className="empty-icon" aria-hidden="true">🏆</span>
          <span className="empty-message">No participants yet</span>
          <span className="empty-subtitle">Be the first to join this challenge!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`challenge-leaderboard ${className}`}>
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <div className="leaderboard-meta">
          <span className="participant-count">
            {leaderboard.length} participant{leaderboard.length !== 1 ? 's' : ''}
          </span>
          <span className="last-updated">
            Updated {formatLastUpdated(lastUpdated)}
          </span>
        </div>
      </div>

      <div className="leaderboard-list">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = showUserHighlight && currentUserId === entry.userId;
          const medal = getRankMedal(entry.rank);
          
          return (
            <div
              key={entry.userId}
              className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''}`}
              role="listitem"
            >
              <div className="entry-rank">
                {medal ? (
                  <span className="rank-medal" aria-hidden="true">{medal}</span>
                ) : (
                  <span className="rank-number">#{entry.rank}</span>
                )}
                
                {entry.change !== RankChange.SAME && (
                  <span 
                    className={`rank-change ${getRankChangeColor(entry.change)}`}
                    aria-label={`Rank ${entry.change}`}
                  >
                    {getRankChangeIcon(entry.change)}
                  </span>
                )}
              </div>

              <div className="entry-user">
                {entry.userAvatar && (
                  <img
                    src={entry.userAvatar}
                    alt={`${entry.userName}'s avatar`}
                    className="user-avatar"
                  />
                )}
                <div className="user-info">
                  <span className="user-name">
                    {entry.userName}
                    {isCurrentUser && (
                      <span className="current-user-badge" aria-label="You">
                        (You)
                      </span>
                    )}
                  </span>
                  <span className="user-level">Level {entry.level}</span>
                </div>
              </div>

              <div className="entry-score">
                <span className="score-value">{entry.score.toLocaleString()}</span>
                <span className="score-label">points</span>
              </div>

              {entry.badges.length > 0 && (
                <div className="entry-badges">
                  {entry.badges.slice(0, 3).map((badge, badgeIndex) => (
                    <span
                      key={badgeIndex}
                      className="user-badge"
                      title={badge.description}
                      aria-label={badge.name}
                    >
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt={badge.name} />
                      ) : (
                        '🏆'
                      )}
                    </span>
                  ))}
                  {entry.badges.length > 3 && (
                    <span className="badge-count">+{entry.badges.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leaderboard.length >= maxEntries && (
        <div className="leaderboard-footer">
          <span className="view-all-hint">
            Showing top {maxEntries} participants
          </span>
        </div>
      )}
    </div>
  );
};
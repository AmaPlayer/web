import React, { useState, useEffect, useCallback } from 'react';
import { 
  Leaderboard, 
  LeaderboardEntry, 
  LeaderboardType, 
  LeaderboardPeriod, 
  RankChange 
} from '@features/events/types/engagement.types';
import { leaderboardService } from '@features/events/services/leaderboardService';

interface LeaderboardDisplayProps {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  eventId?: string;
  challengeId?: string;
  className?: string;
  maxEntries?: number;
  showUserHighlight?: boolean;
  currentUserId?: string;
  showFilters?: boolean;
  showStats?: boolean;
  refreshInterval?: number; // in milliseconds for real-time updates
  onUserClick?: (userId: string) => void;
}

export const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({
  type,
  period,
  eventId,
  challengeId,
  className = '',
  maxEntries = 20,
  showUserHighlight = true,
  currentUserId,
  showFilters = true,
  showStats = false,
  refreshInterval = 60000, // 1 minute default
  onUserClick
}) => {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LeaderboardType>(type);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(period);
  const [stats, setStats] = useState<any>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const data = await leaderboardService.getLeaderboard(
        selectedType, 
        selectedPeriod, 
        eventId, 
        challengeId
      );
      setLeaderboard(data as Leaderboard);

      if (showStats) {
        const statsData = await leaderboardService.getLeaderboardStats(selectedType, selectedPeriod);
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPeriod, eventId, challengeId, showStats]);

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time updates
    const interval = setInterval(fetchLeaderboard, refreshInterval);

    // Subscribe to real-time updates
    const unsubscribe = leaderboardService.subscribeToLeaderboard(
      selectedType,
      selectedPeriod,
      (updatedLeaderboard) => {
        setLeaderboard(updatedLeaderboard as Leaderboard);
      },
      eventId,
      challengeId
    );

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchLeaderboard, refreshInterval, selectedType, selectedPeriod, eventId, challengeId]);

  const getLeaderboardTitle = (type: LeaderboardType): string => {
    const titles = {
      [LeaderboardType.ENGAGEMENT_SCORE]: 'Engagement Leaders',
      [LeaderboardType.PARTICIPATION]: 'Most Active',
      [LeaderboardType.ACHIEVEMENTS]: 'Achievement Masters',
      [LeaderboardType.CHALLENGE_WINS]: 'Challenge Champions',
      [LeaderboardType.SOCIAL_IMPACT]: 'Community Leaders',
      [LeaderboardType.TEAM_PERFORMANCE]: 'Team Stars'
    };
    return titles[type] || 'Leaderboard';
  };

  const getPeriodLabel = (period: LeaderboardPeriod): string => {
    const labels = {
      [LeaderboardPeriod.DAILY]: 'Today',
      [LeaderboardPeriod.WEEKLY]: 'This Week',
      [LeaderboardPeriod.MONTHLY]: 'This Month',
      [LeaderboardPeriod.ALL_TIME]: 'All Time',
      [LeaderboardPeriod.EVENT_SPECIFIC]: 'Event'
    };
    return labels[period] || 'All Time';
  };

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

  const formatScore = (score: number, type: LeaderboardType): string => {
    if (type === LeaderboardType.PARTICIPATION && score < 100) {
      return score.toFixed(1);
    }
    return score.toLocaleString();
  };

  const getScoreLabel = (type: LeaderboardType): string => {
    const labels = {
      [LeaderboardType.ENGAGEMENT_SCORE]: 'points',
      [LeaderboardType.PARTICIPATION]: 'events',
      [LeaderboardType.ACHIEVEMENTS]: 'points',
      [LeaderboardType.CHALLENGE_WINS]: 'wins',
      [LeaderboardType.SOCIAL_IMPACT]: 'impact',
      [LeaderboardType.TEAM_PERFORMANCE]: 'score'
    };
    return labels[type] || 'points';
  };

  const handleUserClick = (userId: string) => {
    if (onUserClick) {
      onUserClick(userId);
    }
  };

  const handleTypeChange = (newType: LeaderboardType) => {
    setSelectedType(newType);
    setLoading(true);
  };

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setSelectedPeriod(newPeriod);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className={`leaderboard-display loading ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">{getLeaderboardTitle(selectedType)}</h3>
          <span className="leaderboard-period">{getPeriodLabel(selectedPeriod)}</span>
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
      <div className={`leaderboard-display error ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">{getLeaderboardTitle(selectedType)}</h3>
          <span className="leaderboard-period">{getPeriodLabel(selectedPeriod)}</span>
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

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <div className={`leaderboard-display empty ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">{getLeaderboardTitle(selectedType)}</h3>
          <span className="leaderboard-period">{getPeriodLabel(selectedPeriod)}</span>
        </div>
        <div className="leaderboard-empty">
          <span className="empty-icon" aria-hidden="true">🏆</span>
          <span className="empty-message">No participants yet</span>
          <span className="empty-subtitle">Be the first to make your mark!</span>
        </div>
      </div>
    );
  }

  const displayEntries = leaderboard.entries.slice(0, maxEntries);
  const currentUserEntry = showUserHighlight && currentUserId 
    ? leaderboard.entries.find(entry => entry.userId === currentUserId)
    : null;

  return (
    <div className={`leaderboard-display ${className}`}>
      <div className="leaderboard-header">
        <div className="header-main">
          <h3 className="leaderboard-title">{getLeaderboardTitle(selectedType)}</h3>
          <span className="leaderboard-period">{getPeriodLabel(selectedPeriod)}</span>
        </div>
        
        {showFilters && (
          <div className="leaderboard-filters">
            <div className="filter-group">
              <label htmlFor="type-select" className="filter-label">Category:</label>
              <select
                id="type-select"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as LeaderboardType)}
                className="filter-select"
              >
                <option value={LeaderboardType.ENGAGEMENT_SCORE}>Engagement</option>
                <option value={LeaderboardType.PARTICIPATION}>Participation</option>
                <option value={LeaderboardType.ACHIEVEMENTS}>Achievements</option>
                <option value={LeaderboardType.CHALLENGE_WINS}>Challenges</option>
                <option value={LeaderboardType.SOCIAL_IMPACT}>Social Impact</option>
                <option value={LeaderboardType.TEAM_PERFORMANCE}>Team Performance</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="period-select" className="filter-label">Period:</label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value as LeaderboardPeriod)}
                className="filter-select"
              >
                <option value={LeaderboardPeriod.DAILY}>Daily</option>
                <option value={LeaderboardPeriod.WEEKLY}>Weekly</option>
                <option value={LeaderboardPeriod.MONTHLY}>Monthly</option>
                <option value={LeaderboardPeriod.ALL_TIME}>All Time</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {showStats && stats && (
        <div className="leaderboard-stats">
          <div className="stat-item">
            <span className="stat-label">Participants</span>
            <span className="stat-value">{stats.totalParticipants}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Score</span>
            <span className="stat-value">{stats.averageScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Top Score</span>
            <span className="stat-value">{stats.topScore}</span>
          </div>
        </div>
      )}

      {currentUserEntry && currentUserEntry.rank > maxEntries && (
        <div className="current-user-position">
          <div className="position-label">Your Position:</div>
          <div className="leaderboard-entry current-user">
            <div className="entry-rank">
              <span className="rank-number">#{currentUserEntry.rank}</span>
              {currentUserEntry.change !== RankChange.SAME && (
                <span 
                  className={`rank-change ${getRankChangeColor(currentUserEntry.change)}`}
                  aria-label={`Rank ${currentUserEntry.change}`}
                >
                  {getRankChangeIcon(currentUserEntry.change)}
                </span>
              )}
            </div>
            <div className="entry-user">
              {currentUserEntry.userAvatar && (
                <img
                  src={currentUserEntry.userAvatar}
                  alt={`${currentUserEntry.userName}'s avatar`}
                  className="user-avatar"
                />
              )}
              <div className="user-info">
                <span className="user-name">{currentUserEntry.userName} (You)</span>
                <span className="user-level">Level {currentUserEntry.level}</span>
              </div>
            </div>
            <div className="entry-score">
              <span className="score-value">
                {formatScore(currentUserEntry.score, selectedType)}
              </span>
              <span className="score-label">{getScoreLabel(selectedType)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="leaderboard-list" role="list">
        {displayEntries.map((entry, index) => {
          const isCurrentUser = showUserHighlight && currentUserId === entry.userId;
          const medal = getRankMedal(entry.rank);
          
          return (
            <div
              key={entry.userId}
              className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''} ${onUserClick ? 'clickable' : ''}`}
              role="listitem"
              onClick={() => handleUserClick(entry.userId)}
              tabIndex={onUserClick ? 0 : -1}
              onKeyDown={(e) => {
                if (onUserClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleUserClick(entry.userId);
                }
              }}
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
                    title={entry.previousRank ? `Previous rank: #${entry.previousRank}` : ''}
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
                <span className="score-value">
                  {formatScore(entry.score, selectedType)}
                </span>
                <span className="score-label">{getScoreLabel(selectedType)}</span>
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

      <div className="leaderboard-footer">
        <div className="footer-info">
          <span className="entry-count">
            Showing top {displayEntries.length} of {leaderboard.entries.length} participants
          </span>
          <span className="last-updated">
            Updated {leaderboard.lastUpdated.toDate().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
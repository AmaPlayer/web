import React, { useState, useEffect } from 'react';
import { Team } from '@features/events/types/engagement.types';
import { teamSystem } from '@features/events/services/teamSystem';

interface TeamLeaderboardProps {
  sport: string;
  className?: string;
  maxEntries?: number;
  showUserTeamHighlight?: boolean;
  currentUserId?: string;
  refreshInterval?: number;
}

type SortCriteria = 'totalScore' | 'challengesWon' | 'winRate';

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({
  sport,
  className = '',
  maxEntries = 10,
  showUserTeamHighlight = true,
  currentUserId,
  refreshInterval = 60000 // 1 minute default
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortCriteria>('totalScore');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const leaderboard = await teamSystem.getTeamLeaderboard(sport, sortBy);
      setTeams(leaderboard.slice(0, maxEntries));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time updates
    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => clearInterval(interval);
  }, [sport, sortBy, maxEntries, refreshInterval]);

  const getRankMedal = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
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

  const getSortLabel = (criteria: SortCriteria): string => {
    const labels = {
      totalScore: 'Total Score',
      challengesWon: 'Challenges Won',
      winRate: 'Win Rate'
    };
    return labels[criteria];
  };

  const getSortValue = (team: Team, criteria: SortCriteria): string => {
    switch (criteria) {
      case 'totalScore':
        return team.stats.totalScore.toLocaleString();
      case 'challengesWon':
        return team.stats.challengesWon.toString();
      case 'winRate':
        return `${team.stats.winRate.toFixed(1)}%`;
      default:
        return '0';
    }
  };

  const isUserTeam = (team: Team): boolean => {
    return showUserTeamHighlight && currentUserId ? 
      team.memberIds.includes(currentUserId) || team.captainId === currentUserId : 
      false;
  };

  if (loading) {
    return (
      <div className={`team-leaderboard loading ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Team Leaderboard - {sport}</h3>
        </div>
        <div className="leaderboard-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <span>Loading team rankings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`team-leaderboard error ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Team Leaderboard - {sport}</h3>
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

  if (teams.length === 0) {
    return (
      <div className={`team-leaderboard empty ${className}`}>
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Team Leaderboard - {sport}</h3>
        </div>
        <div className="leaderboard-empty">
          <span className="empty-icon" aria-hidden="true">🏆</span>
          <span className="empty-message">No teams yet</span>
          <span className="empty-subtitle">Be the first to create a team for {sport}!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`team-leaderboard ${className}`}>
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">Team Leaderboard - {sport}</h3>
        
        <div className="leaderboard-controls">
          <div className="sort-controls">
            <label htmlFor="sortBy" className="sort-label">Sort by:</label>
            <select
              id="sortBy"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortCriteria)}
            >
              <option value="totalScore">Total Score</option>
              <option value="challengesWon">Challenges Won</option>
              <option value="winRate">Win Rate</option>
            </select>
          </div>
          
          <div className="leaderboard-meta">
            <span className="team-count">
              {teams.length} team{teams.length !== 1 ? 's' : ''}
            </span>
            <span className="last-updated">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          </div>
        </div>
      </div>

      <div className="leaderboard-list">
        {teams.map((team, index) => {
          const rank = index + 1;
          const medal = getRankMedal(rank);
          const isCurrentUserTeam = isUserTeam(team);
          
          return (
            <div
              key={team.id}
              className={`team-leaderboard-entry ${isCurrentUserTeam ? 'user-team' : ''}`}
              role="listitem"
            >
              <div className="entry-rank">
                {medal ? (
                  <span className="rank-medal" aria-hidden="true">{medal}</span>
                ) : (
                  <span className="rank-number">#{rank}</span>
                )}
              </div>

              <div className="entry-team">
                <div className="team-info">
                  <span className="team-name">
                    {team.name}
                    {isCurrentUserTeam && (
                      <span className="user-team-badge" aria-label="Your team">
                        (Your Team)
                      </span>
                    )}
                  </span>
                  <div className="team-details">
                    <span className="member-count">
                      👥 {team.memberIds.length}/{team.maxMembers} members
                    </span>
                    <span className="team-visibility">
                      {team.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="entry-stats">
                <div className="primary-stat">
                  <span className="stat-value">
                    {getSortValue(team, sortBy)}
                  </span>
                  <span className="stat-label">
                    {getSortLabel(sortBy)}
                  </span>
                </div>
                
                <div className="secondary-stats">
                  {sortBy !== 'challengesWon' && (
                    <span className="secondary-stat">
                      🏆 {team.stats.challengesWon} wins
                    </span>
                  )}
                  {sortBy !== 'totalScore' && (
                    <span className="secondary-stat">
                      ⭐ {team.stats.totalScore.toLocaleString()} pts
                    </span>
                  )}
                  <span className="secondary-stat">
                    📊 {team.stats.eventsParticipated} events
                  </span>
                </div>
              </div>

              {team.achievements.length > 0 && (
                <div className="entry-achievements">
                  {team.achievements.slice(0, 3).map((achievement, achievementIndex) => (
                    <span
                      key={achievementIndex}
                      className="team-achievement"
                      title={achievement.description}
                      aria-label={achievement.name}
                    >
                      {achievement.iconUrl ? (
                        <img src={achievement.iconUrl} alt={achievement.name} />
                      ) : (
                        '🏆'
                      )}
                    </span>
                  ))}
                  {team.achievements.length > 3 && (
                    <span className="achievement-count">+{team.achievements.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {teams.length >= maxEntries && (
        <div className="leaderboard-footer">
          <span className="view-all-hint">
            Showing top {maxEntries} teams
          </span>
        </div>
      )}
    </div>
  );
};
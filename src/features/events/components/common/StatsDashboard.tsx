import React, { useState, useEffect } from 'react';
import { 
  AthleteStats, 
  ProgressMetric, 
  UserInsights
} from '@features/events/types/user.types';
import { GoalProgress, statisticsService } from '@features/events/services/statisticsService';
import { ProgressChart } from '@features/events/components/common/ProgressChart';

interface StatsDashboardProps {
  userId: string;
  className?: string;
  showInsights?: boolean;
  showGoals?: boolean;
  showCharts?: boolean;
  compactMode?: boolean;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  userId,
  className = '',
  showInsights = true,
  showGoals = true,
  showCharts = true,
  compactMode = false
}) => {
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'goals' | 'insights'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, goalsData] = await Promise.all([
        statisticsService.getUserStatistics(userId),
        statisticsService.getUserGoals(userId)
      ]);

      setStats(statsData);
      setGoals(goalsData);

      // Try to get cached insights first, then generate if needed
      let insightsData = await statisticsService.getCachedUserInsights(userId);
      if (!insightsData && showInsights) {
        insightsData = await statisticsService.generateUserInsights(userId);
      }
      setInsights(insightsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };



  const renderOverviewTab = () => {
    if (!stats) return null;

    const keyStats = [
      {
        label: 'Events Joined',
        value: stats.eventsJoined,
        icon: '🎯',
        color: 'blue',
        subtitle: `${formatPercentage(stats.participationRate)} completion rate`
      },
      {
        label: 'Achievements',
        value: stats.totalAchievements,
        icon: '🏆',
        color: 'yellow',
        subtitle: `${stats.achievementPoints} points earned`
      },
      {
        label: 'Social Impact',
        value: stats.reactionsReceived + stats.commentsReceived,
        icon: '🤝',
        color: 'green',
        subtitle: `${stats.reactionsReceived} reactions received`
      },
      {
        label: 'Challenge Wins',
        value: stats.challengesWon,
        icon: '🥇',
        color: 'purple',
        subtitle: `${formatPercentage(stats.challengeWinRate)} win rate`
      },
      {
        label: 'Current Streak',
        value: stats.currentStreak,
        icon: '🔥',
        color: 'red',
        subtitle: `${stats.longestStreak} longest streak`
      },
      {
        label: 'Global Rank',
        value: stats.globalRank || 'Unranked',
        icon: '⭐',
        color: 'indigo',
        subtitle: 'All-time ranking'
      }
    ];

    return (
      <div className="stats-overview">
        <div className="stats-grid">
          {keyStats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-header">
                <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-value">
                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              </div>
              <div className="stat-subtitle">{stat.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Quick insights */}
        <div className="quick-insights">
          <h4 className="insights-title">Quick Insights</h4>
          <div className="insights-list">
            {stats.participationRate > 80 && (
              <div className="insight-item positive">
                <span className="insight-icon">✨</span>
                <span>Excellent participation rate! You're highly engaged.</span>
              </div>
            )}
            {stats.currentStreak > 7 && (
              <div className="insight-item positive">
                <span className="insight-icon">🔥</span>
                <span>Amazing streak! Your consistency is paying off.</span>
              </div>
            )}
            {stats.challengeWinRate > 60 && (
              <div className="insight-item positive">
                <span className="insight-icon">🏆</span>
                <span>Strong challenge performance! Keep competing.</span>
              </div>
            )}
            {stats.reactionsReceived > 50 && (
              <div className="insight-item positive">
                <span className="insight-icon">💫</span>
                <span>Your content resonates well with the community!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressTab = () => {
    if (!showCharts) return null;

    const chartMetrics = [
      ProgressMetric.ENGAGEMENT_SCORE,
      ProgressMetric.PARTICIPATION_RATE,
      ProgressMetric.ACHIEVEMENTS
    ];

    return (
      <div className="stats-progress">
        <ProgressChart
          userId={userId}
          metrics={chartMetrics}
          days={30}
          height={compactMode ? 200 : 300}
          showLegend={true}
          showGrid={true}
          showTooltip={true}
        />

        {insights && insights.performanceTrends.length > 0 && (
          <div className="performance-trends">
            <h4 className="trends-title">Performance Trends</h4>
            <div className="trends-list">
              {insights.performanceTrends.map((trend, index) => (
                <div key={index} className={`trend-item ${trend.trend}`}>
                  <div className="trend-header">
                    <span className="trend-metric">{trend.metric}</span>
                    <span className={`trend-indicator ${trend.trend}`}>
                      {trend.trend === 'improving' ? '📈' : 
                       trend.trend === 'declining' ? '📉' : '➖'}
                      {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%
                    </span>
                  </div>
                  <div className="trend-insights">
                    {trend.insights.map((insight, i) => (
                      <span key={i} className="trend-insight">{insight}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGoalsTab = () => {
    if (!showGoals) return null;

    return (
      <div className="stats-goals">
        <div className="goals-header">
          <h4 className="goals-title">Your Goals</h4>
          <button className="add-goal-button" aria-label="Add new goal">
            + Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="goals-empty">
            <span className="empty-icon" aria-hidden="true">🎯</span>
            <span className="empty-message">No goals set yet</span>
            <span className="empty-subtitle">Set goals to track your progress!</span>
          </div>
        ) : (
          <div className="goals-list">
            {goals.map((goalProgress) => (
              <div key={goalProgress.goal.id} className="goal-card">
                <div className="goal-header">
                  <div className="goal-info">
                    <h5 className="goal-title">{goalProgress.goal.title}</h5>
                    <p className="goal-description">{goalProgress.goal.description}</p>
                  </div>
                  <div className="goal-status">
                    <span className={`goal-difficulty ${goalProgress.goal.difficulty}`}>
                      {goalProgress.goal.difficulty}
                    </span>
                    {goalProgress.daysRemaining !== undefined && (
                      <span className="goal-deadline">
                        {goalProgress.daysRemaining} days left
                      </span>
                    )}
                  </div>
                </div>

                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${goalProgress.onTrack ? 'on-track' : 'behind'}`}
                      style={{ width: `${Math.min(goalProgress.progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    <span className="progress-value">
                      {goalProgress.currentValue} / {goalProgress.targetValue}
                    </span>
                    <span className="progress-percentage">
                      {formatPercentage(goalProgress.progress)}
                    </span>
                  </div>
                </div>

                {goalProgress.projectedCompletion && (
                  <div className="goal-projection">
                    <span className={`projection-status ${goalProgress.onTrack ? 'positive' : 'warning'}`}>
                      {goalProgress.onTrack ? '✅' : '⚠️'}
                      Projected completion: {goalProgress.projectedCompletion.toDate().toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Suggested goals */}
        {insights && insights.suggestedGoals.length > 0 && (
          <div className="suggested-goals">
            <h5 className="suggested-title">Suggested Goals</h5>
            <div className="suggested-list">
              {insights.suggestedGoals.map((goal, index) => (
                <div key={index} className="suggested-goal">
                  <div className="suggested-info">
                    <span className="suggested-name">{goal.title}</span>
                    <span className="suggested-description">{goal.description}</span>
                  </div>
                  <button className="add-suggested-goal" aria-label={`Add ${goal.title} goal`}>
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInsightsTab = () => {
    if (!showInsights || !insights) return null;

    return (
      <div className="stats-insights">
        {/* Strength areas */}
        <div className="insights-section">
          <h4 className="section-title">Your Strengths</h4>
          <div className="strengths-list">
            {insights.strengthAreas.map((strength, index) => (
              <div key={index} className="strength-item">
                <span className="strength-icon" aria-hidden="true">💪</span>
                <span className="strength-name">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement areas */}
        <div className="insights-section">
          <h4 className="section-title">Growth Opportunities</h4>
          <div className="improvements-list">
            {insights.improvementAreas.map((area, index) => (
              <div key={index} className="improvement-item">
                <span className="improvement-icon" aria-hidden="true">🎯</span>
                <span className="improvement-name">{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement patterns */}
        {insights.engagementPatterns.length > 0 && (
          <div className="insights-section">
            <h4 className="section-title">Engagement Patterns</h4>
            <div className="patterns-list">
              {insights.engagementPatterns.map((pattern, index) => (
                <div key={index} className="pattern-item">
                  <div className="pattern-header">
                    <span className="pattern-name">{pattern.pattern}</span>
                    <span className={`pattern-impact ${pattern.impact}`}>
                      {pattern.impact} impact
                    </span>
                  </div>
                  <div className="pattern-recommendation">
                    {pattern.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration style */}
        <div className="insights-section">
          <h4 className="section-title">Your Style</h4>
          <div className="collaboration-style">
            <span className="style-icon" aria-hidden="true">🤝</span>
            <div className="style-info">
              <span className="style-name">{insights.collaborationStyle}</span>
              <span className="influence-score">
                Influence Score: {Math.round(insights.influenceScore)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`stats-dashboard loading ${className}`}>
        <div className="dashboard-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <span>Loading your statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`stats-dashboard error ${className}`}>
        <div className="dashboard-error">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="retry-button"
            onClick={fetchDashboardData}
            aria-label="Retry loading dashboard"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`stats-dashboard ${compactMode ? 'compact' : ''} ${className}`}>
      <div className="dashboard-header">
        <h3 className="dashboard-title">Your Statistics</h3>
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {showCharts && (
            <button
              className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              Progress
            </button>
          )}
          {showGoals && (
            <button
              className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
            >
              Goals
            </button>
          )}
          {showInsights && insights && (
            <button
              className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </div>

      <div className="dashboard-footer">
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
        <button 
          className="refresh-button"
          onClick={fetchDashboardData}
          aria-label="Refresh dashboard data"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};
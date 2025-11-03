import React from 'react';
import { Milestone, MilestoneCategory } from '@features/events/services/progressTracker';
import { AthleteStats, ProgressMetric } from '@features/events/types/user.types';

interface MilestoneTrackerProps {
  achievedMilestones: Milestone[];
  nextMilestones: Milestone[];
  userStats: AthleteStats;
  showProgress?: boolean;
  maxVisible?: number;
  className?: string;
}

/**
 * MilestoneTracker Component
 * Displays milestone progress and achievements
 * Requirements: 8.3 - Milestone detection and progress visualization
 */
export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  achievedMilestones,
  nextMilestones,
  userStats,
  showProgress = true,
  maxVisible = 5,
  className = ''
}) => {
  const getCategoryIcon = (category: MilestoneCategory): string => {
    switch (category) {
      case MilestoneCategory.PARTICIPATION:
        return '🏃';
      case MilestoneCategory.ENGAGEMENT:
        return '⚡';
      case MilestoneCategory.ACHIEVEMENT:
        return '🏆';
      case MilestoneCategory.SOCIAL:
        return '👥';
      case MilestoneCategory.CONSISTENCY:
        return '🔥';
      default:
        return '🎯';
    }
  };

  const getCategoryColor = (category: MilestoneCategory): string => {
    switch (category) {
      case MilestoneCategory.PARTICIPATION:
        return 'category-participation';
      case MilestoneCategory.ENGAGEMENT:
        return 'category-engagement';
      case MilestoneCategory.ACHIEVEMENT:
        return 'category-achievement';
      case MilestoneCategory.SOCIAL:
        return 'category-social';
      case MilestoneCategory.CONSISTENCY:
        return 'category-consistency';
      default:
        return 'category-default';
    }
  };

  const getCurrentValue = (milestone: Milestone): number => {
    switch (milestone.metric) {
      case ProgressMetric.ENGAGEMENT_SCORE:
        return userStats.achievementPoints;
      case ProgressMetric.PARTICIPATION_RATE:
        return userStats.eventsJoined;
      case ProgressMetric.ACHIEVEMENTS:
        return userStats.totalAchievements;
      case ProgressMetric.SOCIAL_IMPACT:
        return (
          userStats.reactionsReceived * 2 +
          userStats.commentsReceived * 3 +
          userStats.mentorshipsCompleted * 10 +
          userStats.menteesHelped * 8 +
          userStats.teamContributions * 5
        );
      default:
        return 0;
    }
  };

  const getProgressPercentage = (milestone: Milestone): number => {
    const current = getCurrentValue(milestone);
    return Math.min((current / milestone.threshold) * 100, 100);
  };

  const formatMetricName = (metric: ProgressMetric): string => {
    switch (metric) {
      case ProgressMetric.ENGAGEMENT_SCORE:
        return 'Engagement Points';
      case ProgressMetric.PARTICIPATION_RATE:
        return 'Events Joined';
      case ProgressMetric.ACHIEVEMENTS:
        return 'Achievements';
      case ProgressMetric.SOCIAL_IMPACT:
        return 'Social Impact';
      default:
        return metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const visibleNextMilestones = nextMilestones.slice(0, maxVisible);

  return (
    <div className={`milestone-tracker ${className}`}>
      {/* Header */}
      <div className="milestone-header">
        <h3 className="milestone-title">🎯 Milestones</h3>
        <div className="milestone-summary">
          <span className="summary-achieved">
            {achievedMilestones.length} achieved
          </span>
          <span className="summary-separator">•</span>
          <span className="summary-next">
            {nextMilestones.length} remaining
          </span>
        </div>
      </div>

      {/* Achieved Milestones */}
      {achievedMilestones.length > 0 && (
        <div className="achieved-milestones">
          <h4 className="section-title">✅ Recently Achieved</h4>
          <div className="milestone-list">
            {achievedMilestones.slice(-3).map((milestone) => (
              <div
                key={milestone.id}
                className={`milestone-item achieved ${getCategoryColor(milestone.category)}`}
              >
                <div className="milestone-icon">
                  {getCategoryIcon(milestone.category)}
                </div>
                <div className="milestone-content">
                  <h5 className="milestone-name">{milestone.name}</h5>
                  <p className="milestone-description">{milestone.description}</p>
                  <div className="milestone-meta">
                    <span className="milestone-category">
                      {milestone.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {milestone.reward && (
                      <span className="milestone-reward">
                        +{milestone.reward.points} points
                      </span>
                    )}
                  </div>
                </div>
                <div className="milestone-status">
                  <span className="status-icon">✅</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Milestones */}
      {visibleNextMilestones.length > 0 && (
        <div className="next-milestones">
          <h4 className="section-title">🎯 Up Next</h4>
          <div className="milestone-list">
            {visibleNextMilestones.map((milestone) => {
              const currentValue = getCurrentValue(milestone);
              const progressPercentage = getProgressPercentage(milestone);
              const isClose = progressPercentage >= 80;

              return (
                <div
                  key={milestone.id}
                  className={`milestone-item next ${getCategoryColor(milestone.category)} ${
                    isClose ? 'close' : ''
                  }`}
                >
                  <div className="milestone-icon">
                    {getCategoryIcon(milestone.category)}
                  </div>
                  <div className="milestone-content">
                    <h5 className="milestone-name">{milestone.name}</h5>
                    <p className="milestone-description">{milestone.description}</p>
                    
                    {showProgress && (
                      <div className="milestone-progress">
                        <div className="progress-header">
                          <span className="progress-current">
                            {currentValue} / {milestone.threshold} {formatMetricName(milestone.metric)}
                          </span>
                          <span className="progress-percentage">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="progress-remaining">
                          {milestone.threshold - currentValue} more to go
                        </div>
                      </div>
                    )}

                    <div className="milestone-meta">
                      <span className="milestone-category">
                        {milestone.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {milestone.reward && (
                        <span className="milestone-reward">
                          +{milestone.reward.points} points
                          {milestone.reward.badge && ' + badge'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="milestone-status">
                    {isClose ? (
                      <span className="status-icon close">🔥</span>
                    ) : (
                      <span className="status-icon">⏳</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {achievedMilestones.length === 0 && nextMilestones.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h4 className="empty-title">No Milestones Available</h4>
          <p className="empty-description">
            Start participating in activities to unlock milestones!
          </p>
        </div>
      )}

      {/* Show More Button */}
      {nextMilestones.length > maxVisible && (
        <div className="milestone-actions">
          <button className="btn-secondary show-more-btn">
            Show {nextMilestones.length - maxVisible} More Milestones
          </button>
        </div>
      )}

      {/* Progress Summary */}
      {achievedMilestones.length > 0 && (
        <div className="milestone-summary-footer">
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-value">
                {achievedMilestones.reduce((sum, m) => sum + (m.reward?.points || 0), 0)}
              </span>
              <span className="summary-label">Points Earned</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {new Set(achievedMilestones.map(m => m.category)).size}
              </span>
              <span className="summary-label">Categories</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {achievedMilestones.filter(m => m.reward?.badge).length}
              </span>
              <span className="summary-label">Badges Earned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;
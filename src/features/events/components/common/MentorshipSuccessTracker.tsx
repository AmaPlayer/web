import React, { useState, useEffect } from 'react';
import { mentorshipSystem } from '@features/events/services/mentorshipSystem';

interface MentorshipSuccessTrackerProps {
  mentorId: string;
  className?: string;
}

interface SuccessMetrics {
  totalMentorships: number;
  completedMentorships: number;
  averageRating: number;
  successRate: number;
  totalMenteesHelped: number;
}

export const MentorshipSuccessTracker: React.FC<MentorshipSuccessTrackerProps> = ({
  mentorId,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<SuccessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setError(null);
        const successMetrics = await mentorshipSystem.getMentorshipSuccessMetrics(mentorId);
        setMetrics(successMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load success metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [mentorId]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 80) return 'success-high';
    if (rate >= 60) return 'success-medium';
    if (rate >= 40) return 'success-low';
    return 'success-very-low';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return 'rating-excellent';
    if (rating >= 4.0) return 'rating-very-good';
    if (rating >= 3.5) return 'rating-good';
    if (rating >= 3.0) return 'rating-fair';
    return 'rating-poor';
  };

  if (loading) {
    return (
      <div className={`mentorship-success-tracker loading ${className}`}>
        <div className="loading-spinner" aria-hidden="true"></div>
        <span>Loading success metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mentorship-success-tracker error ${className}`}>
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <span className="error-message">{error}</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`mentorship-success-tracker empty ${className}`}>
        <span className="empty-icon" aria-hidden="true">📊</span>
        <span className="empty-message">No metrics available</span>
      </div>
    );
  }

  return (
    <div className={`mentorship-success-tracker ${className}`}>
      <div className="tracker-header">
        <h4 className="tracker-title">Mentorship Success Metrics</h4>
        <span className="tracker-subtitle">Track your impact as a mentor</span>
      </div>

      <div className="metrics-grid">
        {/* Total Mentorships */}
        <div className="metric-card">
          <div className="metric-icon" aria-hidden="true">🤝</div>
          <div className="metric-content">
            <span className="metric-value">{metrics.totalMentorships}</span>
            <span className="metric-label">Total Mentorships</span>
          </div>
        </div>

        {/* Completed Mentorships */}
        <div className="metric-card">
          <div className="metric-icon" aria-hidden="true">✅</div>
          <div className="metric-content">
            <span className="metric-value">{metrics.completedMentorships}</span>
            <span className="metric-label">Completed</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="metric-card">
          <div className="metric-icon" aria-hidden="true">📈</div>
          <div className="metric-content">
            <span className={`metric-value ${getSuccessRateColor(metrics.successRate)}`}>
              {metrics.successRate.toFixed(1)}%
            </span>
            <span className="metric-label">Success Rate</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="metric-card">
          <div className="metric-icon" aria-hidden="true">⭐</div>
          <div className="metric-content">
            <div className="rating-display">
              <span className={`metric-value ${getRatingColor(metrics.averageRating)}`}>
                {metrics.averageRating.toFixed(1)}
              </span>
              <div className="stars-small">
                {renderStars(metrics.averageRating)}
              </div>
            </div>
            <span className="metric-label">Average Rating</span>
          </div>
        </div>

        {/* Total Mentees Helped */}
        <div className="metric-card">
          <div className="metric-icon" aria-hidden="true">👥</div>
          <div className="metric-content">
            <span className="metric-value">{metrics.totalMenteesHelped}</span>
            <span className="metric-label">Mentees Helped</span>
          </div>
        </div>

        {/* Completion Rate Visual */}
        <div className="metric-card wide">
          <div className="metric-content">
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Completion Progress</span>
                <span className="progress-text">
                  {metrics.completedMentorships} of {metrics.totalMentorships} completed
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getSuccessRateColor(metrics.successRate)}`}
                  style={{ width: `${metrics.successRate}%` }}
                  aria-label={`${metrics.successRate.toFixed(1)}% completion rate`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Insights */}
      <div className="success-insights">
        <h5 className="insights-title">Insights</h5>
        <div className="insights-list">
          {metrics.averageRating >= 4.5 && (
            <div className="insight-item positive">
              <span className="insight-icon" aria-hidden="true">🌟</span>
              <span className="insight-text">
                Excellent mentor rating! Your mentees highly value your guidance.
              </span>
            </div>
          )}

          {metrics.successRate >= 80 && (
            <div className="insight-item positive">
              <span className="insight-icon" aria-hidden="true">🎯</span>
              <span className="insight-text">
                Outstanding success rate! You're helping mentees achieve their goals.
              </span>
            </div>
          )}

          {metrics.totalMenteesHelped >= 10 && (
            <div className="insight-item positive">
              <span className="insight-icon" aria-hidden="true">🏆</span>
              <span className="insight-text">
                Impressive impact! You've helped {metrics.totalMenteesHelped} athletes grow.
              </span>
            </div>
          )}

          {metrics.successRate < 60 && metrics.totalMentorships > 2 && (
            <div className="insight-item improvement">
              <span className="insight-icon" aria-hidden="true">💡</span>
              <span className="insight-text">
                Consider focusing on goal-setting and regular check-ins to improve completion rates.
              </span>
            </div>
          )}

          {metrics.averageRating < 3.5 && metrics.completedMentorships > 2 && (
            <div className="insight-item improvement">
              <span className="insight-icon" aria-hidden="true">📚</span>
              <span className="insight-text">
                Seek feedback from mentees to understand how to better support their journey.
              </span>
            </div>
          )}

          {metrics.totalMentorships === 0 && (
            <div className="insight-item neutral">
              <span className="insight-icon" aria-hidden="true">🚀</span>
              <span className="insight-text">
                Ready to start your mentoring journey? Accept mentorship requests to begin!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Milestones */}
      {metrics.totalMentorships > 0 && (
        <div className="achievement-milestones">
          <h5 className="milestones-title">Achievement Milestones</h5>
          <div className="milestones-grid">
            <div className={`milestone ${metrics.totalMentorships >= 1 ? 'achieved' : 'pending'}`}>
              <span className="milestone-icon">🥉</span>
              <span className="milestone-text">First Mentorship</span>
              <span className="milestone-status">
                {metrics.totalMentorships >= 1 ? '✓' : `${metrics.totalMentorships}/1`}
              </span>
            </div>

            <div className={`milestone ${metrics.completedMentorships >= 3 ? 'achieved' : 'pending'}`}>
              <span className="milestone-icon">🥈</span>
              <span className="milestone-text">3 Completed</span>
              <span className="milestone-status">
                {metrics.completedMentorships >= 3 ? '✓' : `${metrics.completedMentorships}/3`}
              </span>
            </div>

            <div className={`milestone ${metrics.totalMenteesHelped >= 10 ? 'achieved' : 'pending'}`}>
              <span className="milestone-icon">🥇</span>
              <span className="milestone-text">10 Mentees Helped</span>
              <span className="milestone-status">
                {metrics.totalMenteesHelped >= 10 ? '✓' : `${metrics.totalMenteesHelped}/10`}
              </span>
            </div>

            <div className={`milestone ${metrics.averageRating >= 4.5 && metrics.completedMentorships >= 5 ? 'achieved' : 'pending'}`}>
              <span className="milestone-icon">🏆</span>
              <span className="milestone-text">Master Mentor</span>
              <span className="milestone-status">
                {metrics.averageRating >= 4.5 && metrics.completedMentorships >= 5 ? '✓' : 
                 `${metrics.averageRating.toFixed(1)}/4.5★`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { Challenge, ChallengeStatus, ChallengeType } from '@features/events/types/engagement.types';
import { StatusBadge } from '@features/events/components/common/StatusBadge';
import { CountdownTimer } from '@features/events/components/common/CountdownTimer';
import { timestampToDate } from '@features/events/utils/timestampHelpers';

interface ChallengeCardProps {
  challenge: Challenge;
  onClick: (challengeId: string) => void;
  onParticipate?: (challengeId: string) => void;
  userParticipated?: boolean;
  className?: string;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  onClick, 
  onParticipate,
  userParticipated = false,
  className = ''
}) => {
  const formatDate = (timestamp: any) => {
    const date = timestampToDate(timestamp);
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChallengeTypeIcon = (type: ChallengeType): string => {
    const icons = {
      [ChallengeType.SKILL_SHOWCASE]: '🎯',
      [ChallengeType.ENDURANCE]: '💪',
      [ChallengeType.CREATIVITY]: '🎨',
      [ChallengeType.TEAM_COLLABORATION]: '🤝',
      [ChallengeType.KNOWLEDGE_QUIZ]: '🧠',
      [ChallengeType.PHOTO_CONTEST]: '📸'
    };
    return icons[type] || '🏆';
  };

  const getChallengeTypeLabel = (type: ChallengeType): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: ChallengeStatus): string => {
    const colors = {
      [ChallengeStatus.UPCOMING]: 'blue',
      [ChallengeStatus.ACTIVE]: 'green',
      [ChallengeStatus.COMPLETED]: 'gray',
      [ChallengeStatus.CANCELLED]: 'red'
    };
    return colors[status] || 'gray';
  };

  const participantCount = challenge.participants.length;
  const submissionCount = challenge.submissions.length;
  const isActive = challenge.status === ChallengeStatus.ACTIVE;
  const isUpcoming = challenge.status === ChallengeStatus.UPCOMING;
  const canParticipate = (isActive || isUpcoming) && !userParticipated && 
                        (!challenge.maxParticipants || participantCount < challenge.maxParticipants);

  const handleParticipateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onParticipate && canParticipate) {
      onParticipate(challenge.id);
    }
  };

  return (
    <div
      className={`challenge-card ${className}`}
      onClick={() => onClick(challenge.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(challenge.id);
        }
      }}
      aria-label={`Challenge: ${challenge.title}`}
    >
      <div className="challenge-card-header">
        <div className="challenge-card-header-top">
          <div className="challenge-card-type">
            <span className="challenge-type-icon" aria-hidden="true">
              {getChallengeTypeIcon(challenge.type)}
            </span>
            <span className="challenge-type-label">
              {getChallengeTypeLabel(challenge.type)}
            </span>
          </div>
          <StatusBadge 
            type={challenge.status} 
            size="small"
          />
        </div>

        <h3 className="challenge-card-title">{challenge.title}</h3>
        
        {/* Countdown timer for active/upcoming challenges */}
        {(isActive || isUpcoming) && (
          <div>
            <div className="challenge-card-label">{isUpcoming ? "Starts in" : "Ends in"}</div>
            <CountdownTimer 
              targetDate={isUpcoming ? challenge.startDate : challenge.endDate}
              compact={true} 
              className="challenge-card-countdown"
            />
          </div>
        )}
      </div>

      <div className="challenge-card-content">
        <p className="challenge-card-description">{challenge.description}</p>

        <div className="challenge-card-details">
          <div className="challenge-card-detail">
            <span className="challenge-card-icon" aria-hidden="true">🏅</span>
            <span className="challenge-card-value">{challenge.sport}</span>
          </div>

          <div className="challenge-card-detail">
            <span className="challenge-card-icon" aria-hidden="true">📅</span>
            <span className="challenge-card-value">
              {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
            </span>
          </div>

          {challenge.maxParticipants && (
            <div className="challenge-card-detail">
              <span className="challenge-card-icon" aria-hidden="true">👥</span>
              <span className="challenge-card-value">
                {participantCount}/{challenge.maxParticipants} participants
              </span>
            </div>
          )}
        </div>

        {/* Rewards section */}
        {challenge.rewards.length > 0 && (
          <div className="challenge-card-rewards">
            <h4 className="challenge-rewards-title">Rewards:</h4>
            <div className="challenge-rewards-list">
              {challenge.rewards.map((reward, index) => (
                <div key={index} className="challenge-reward-item">
                  <span className="reward-icon" aria-hidden="true">
                    {reward.type === 'points' ? '⭐' : 
                     reward.type === 'badge' ? '🏆' : 
                     reward.type === 'title' ? '👑' : '🎁'}
                  </span>
                  <span className="reward-description">{reward.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="challenge-card-footer">
        {/* Participation metrics */}
        <div className="challenge-card-metrics">
          <div className="metric-item">
            <span className="metric-icon" aria-hidden="true">👥</span>
            <span className="metric-value">{participantCount}</span>
            <span className="metric-label">participants</span>
          </div>

          <div className="metric-item">
            <span className="metric-icon" aria-hidden="true">📝</span>
            <span className="metric-value">{submissionCount}</span>
            <span className="metric-label">submissions</span>
          </div>
        </div>

        {/* Participation button */}
        {canParticipate && onParticipate && (
          <button
            className="challenge-participate-btn"
            onClick={handleParticipateClick}
            aria-label={`Participate in ${challenge.title}`}
          >
            {isUpcoming ? 'Join Challenge' : 'Participate Now'}
          </button>
        )}

        {userParticipated && (
          <div className="challenge-participated-badge">
            <span className="participated-icon" aria-hidden="true">✅</span>
            <span className="participated-text">Participating</span>
          </div>
        )}
      </div>
    </div>
  );
};
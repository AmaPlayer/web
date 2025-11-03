import React, { useState, useEffect } from 'react';
import { participationService } from '@features/events/services/participationService';

interface ParticipantCounterProps {
  eventId: string;
  maxParticipants?: number;
  showBreakdown?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * ParticipantCounter Component
 * Displays animated count of event participants with optional breakdown
 * Shows progress bar if event has capacity limit
 */
export const ParticipantCounter: React.FC<ParticipantCounterProps> = ({
  eventId,
  maxParticipants,
  showBreakdown = false,
  animate = true,
  className = '',
}) => {
  const [counts, setCounts] = useState({
    going: 0,
    interested: 0,
    maybe: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadCounts = async () => {
    try {
      const participationCounts = await participationService.getParticipationCounts(eventId);
      setCounts(participationCounts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load participant counts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`participant-counter loading ${className}`}>
        <span className="loading-text">Loading...</span>
      </div>
    );
  }

  const participationPercentage = maxParticipants
    ? Math.min(100, (counts.going / maxParticipants) * 100)
    : 0;

  const isNearCapacity = maxParticipants && counts.going >= maxParticipants * 0.9;
  const isAtCapacity = maxParticipants && counts.going >= maxParticipants;

  return (
    <div className={`participant-counter ${className}`}>
      <div className="counter-main">
        <span className="counter-icon" aria-hidden="true">👥</span>
        <div className="counter-numbers">
          <span className={`counter-value ${animate ? 'animate' : ''}`}>
            {counts.going}
            {maxParticipants && (
              <span className="counter-max"> / {maxParticipants}</span>
            )}
          </span>
          <span className="counter-label">
            {counts.going === 1 ? 'person going' : 'people going'}
          </span>
        </div>

        {(isNearCapacity || isAtCapacity) && (
          <span className={`capacity-badge ${isAtCapacity ? 'full' : 'near-full'}`}>
            {isAtCapacity ? 'Full' : 'Almost Full'}
          </span>
        )}
      </div>

      {showBreakdown && (counts.interested > 0 || counts.maybe > 0) && (
        <div className="counter-breakdown">
          {counts.interested > 0 && (
            <span className="breakdown-item interested">
              <span className="breakdown-icon" aria-hidden="true">⭐</span>
              <span className="breakdown-count">{counts.interested} interested</span>
            </span>
          )}
          {counts.maybe > 0 && (
            <span className="breakdown-item maybe">
              <span className="breakdown-icon" aria-hidden="true">?</span>
              <span className="breakdown-count">{counts.maybe} maybe</span>
            </span>
          )}
        </div>
      )}

      {maxParticipants && maxParticipants > 0 && (
        <div className="capacity-progress">
          <div
            className={`progress-bar ${isNearCapacity ? 'near-full' : ''} ${isAtCapacity ? 'full' : ''}`}
            role="progressbar"
            aria-valuenow={counts.going}
            aria-valuemin={0}
            aria-valuemax={maxParticipants}
            aria-label={`${counts.going} of ${maxParticipants} spots filled`}
          >
            <div
              className="progress-fill"
              style={{ width: `${participationPercentage}%` }}
            ></div>
          </div>
          <span className="capacity-text">
            {maxParticipants - counts.going > 0
              ? `${maxParticipants - counts.going} spots left`
              : 'No spots left'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ParticipantCounter;

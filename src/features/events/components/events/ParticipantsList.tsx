import React, { useState, useEffect } from 'react';
import { EventParticipation, ParticipationType } from '@features/events/types/event.types';
import { participationService } from '@features/events/services/participationService';

interface ParticipantsListProps {
  eventId: string;
  maxDisplay?: number;
  showFilter?: boolean;
  className?: string;
}

type FilterType = 'all' | 'going' | 'interested' | 'maybe';

/**
 * ParticipantsList Component
 * Displays list of event participants with avatars and filters
 */
export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  eventId,
  maxDisplay = 10,
  showFilter = true,
  className = '',
}) => {
  const [participants, setParticipants] = useState<EventParticipation[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, [eventId, filter]);

  const loadParticipants = async () => {
    setLoading(true);

    try {
      let participantData: EventParticipation[];

      if (filter === 'all') {
        participantData = await participationService.getParticipants(eventId);
      } else {
        const filterMap: Record<Exclude<FilterType, 'all'>, ParticipationType> = {
          going: ParticipationType.GOING,
          interested: ParticipationType.INTERESTED,
          maybe: ParticipationType.MAYBE,
        };
        participantData = await participationService.getParticipantsByType(eventId, filterMap[filter]);
      }

      setParticipants(participantData);
    } catch (error) {
      console.error('Failed to load participants:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const displayedParticipants = participants.slice(0, maxDisplay);
  const remainingCount = Math.max(0, participants.length - maxDisplay);

  if (loading) {
    return (
      <div className={`participants-list loading ${className}`}>
        <div className="loading-spinner" aria-label="Loading participants"></div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className={`participants-list empty ${className}`}>
        <p className="empty-message">No participants yet. Be the first to join!</p>
      </div>
    );
  }

  return (
    <div className={`participants-list ${className}`}>
      {showFilter && (
        <div className="participants-filter" role="tablist" aria-label="Filter participants">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            role="tab"
            aria-selected={filter === 'all'}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'going' ? 'active' : ''}`}
            onClick={() => setFilter('going')}
            role="tab"
            aria-selected={filter === 'going'}
          >
            Going
          </button>
          <button
            className={`filter-btn ${filter === 'interested' ? 'active' : ''}`}
            onClick={() => setFilter('interested')}
            role="tab"
            aria-selected={filter === 'interested'}
          >
            Interested
          </button>
          <button
            className={`filter-btn ${filter === 'maybe' ? 'active' : ''}`}
            onClick={() => setFilter('maybe')}
            role="tab"
            aria-selected={filter === 'maybe'}
          >
            Maybe
          </button>
        </div>
      )}

      <div className="participants-grid" role="list">
        {displayedParticipants.map((participant) => (
          <div
            key={`${participant.userId}-${participant.timestamp}`}
            className="participant-item"
            role="listitem"
          >
            <div className="participant-avatar-wrapper">
              <img
                src={participant.userAvatar || `https://i.pravatar.cc/150?u=${participant.userId}`}
                alt={participant.userName}
                className="participant-avatar"
              />
              {participant.type === ParticipationType.GOING && (
                <span className="participant-status going" aria-label="Going" title="Going">
                  ✓
                </span>
              )}
              {participant.type === ParticipationType.INTERESTED && (
                <span className="participant-status interested" aria-label="Interested" title="Interested">
                  ⭐
                </span>
              )}
              {participant.type === ParticipationType.MAYBE && (
                <span className="participant-status maybe" aria-label="Maybe" title="Maybe">
                  ?
                </span>
              )}
            </div>
            <span className="participant-name">{participant.userName}</span>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="participant-item more-count" role="listitem">
            <div className="more-avatar">
              <span className="more-text">+{remainingCount}</span>
            </div>
            <span className="participant-name">more</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;

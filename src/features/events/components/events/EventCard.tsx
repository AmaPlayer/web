import React from 'react';
import { Event, EventStatus } from '@features/events/types/event.types';
import { LazyImage } from '@features/events/components/common/LazyImage';
import { LazyVideo } from '@features/events/components/common/LazyVideo';
import { StatusBadge } from '@features/events/components/common/StatusBadge';
import { CountdownTimer } from '@features/events/components/common/CountdownTimer';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';

interface EventCardProps {
  event: Event;
  onClick: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const { currentLanguage } = useAppPreferences();
  
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(currentLanguage, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate reaction count
  const reactionCount = event.reactions?.length || 0;
  const totalParticipants = (event.participantIds?.length || 0) + (event.interestedIds?.length || 0);

  return (
    <div
      className="event-card"
      onClick={() => onClick(event.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(event.id);
        }
      }}
      aria-label={`Event: ${event.title}`}
    >
      {/* Lazy load thumbnail if available */}
      {event.thumbnailUrl && (
        <div className="event-card-media">
          <LazyImage
            src={event.thumbnailUrl}
            alt={`${event.title} thumbnail`}
            className="event-card-thumbnail"
          />

          {/* Badges overlay */}
          <div className="event-card-badges">
            {event.isTrending && <StatusBadge type="trending" size="small" />}
            {event.status === EventStatus.ONGOING && <StatusBadge type="live" size="small" />}
            {event.isOfficial && <StatusBadge type="official" size="small" />}
          </div>
        </div>
      )}

      {/* Lazy load video preview if available and no thumbnail */}
      {!event.thumbnailUrl && event.videoUrl && (
        <div className="event-card-media">
          <LazyVideo
            src={event.videoUrl}
            className="event-card-video"
            controls={false}
          />

          {/* Badges overlay */}
          <div className="event-card-badges">
            {event.isTrending && <StatusBadge type="trending" size="small" />}
            {event.status === EventStatus.ONGOING && <StatusBadge type="live" size="small" />}
            {event.isOfficial && <StatusBadge type="official" size="small" />}
          </div>
        </div>
      )}

      <div className="event-card-content">
        <div className="event-card-header">
          <div className="event-card-header-top">
            <h3 className="event-card-title">{event.title}</h3>
            <StatusBadge type={event.eventType} size="small" showIcon={true} />
          </div>

          {/* Countdown timer for upcoming events */}
          {event.status === EventStatus.UPCOMING && (
            <CountdownTimer targetDate={event.startDate} compact={true} className="event-card-countdown" />
          )}
        </div>

        <div className="event-card-details">
          <div className="event-card-detail">
            <span className="event-card-icon" aria-hidden="true">🏅</span>
            <span className="event-card-value">{event.sport}</span>
          </div>

          <div className="event-card-detail">
            <span className="event-card-icon" aria-hidden="true">📍</span>
            <span className="event-card-value">{event.location}</span>
          </div>

          <div className="event-card-detail">
            <span className="event-card-icon" aria-hidden="true">📅</span>
            <span className="event-card-value">{formatDate(event.startDate)}</span>
          </div>
        </div>

        {/* Engagement metrics footer */}
        <div className="event-card-metrics">
          {reactionCount > 0 && (
            <div className="metric-item">
              <span className="metric-icon" aria-hidden="true">❤️</span>
              <span className="metric-value">{reactionCount}</span>
            </div>
          )}

          {event.commentCount > 0 && (
            <div className="metric-item">
              <span className="metric-icon" aria-hidden="true">💬</span>
              <span className="metric-value">{event.commentCount}</span>
            </div>
          )}

          {totalParticipants > 0 && (
            <div className="metric-item">
              <span className="metric-icon" aria-hidden="true">👥</span>
              <span className="metric-value">{totalParticipants}</span>
            </div>
          )}

          {event.viewCount > 0 && (
            <div className="metric-item">
              <span className="metric-icon" aria-hidden="true">👁️</span>
              <span className="metric-value">{event.viewCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

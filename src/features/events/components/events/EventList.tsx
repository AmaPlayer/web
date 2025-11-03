import React from 'react';
import { Event } from '@features/events/types/event.types';
import { EventCard } from '@features/events/components/events/EventCard';
import { useInfiniteScroll } from '@features/events/hooks/useInfiniteScroll';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';

interface EventListProps {
  events: Event[];
  loading: boolean;
  error?: string;
  onEventClick: (eventId: string) => void;
  onRetry?: () => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

/**
 * EventList component with error handling, retry functionality, and infinite scroll
 * Requirements: 2.1, 2.3, 2.4, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4, 10.6
 */
export const EventList: React.FC<EventListProps> = ({
  events,
  loading,
  error,
  onEventClick,
  onRetry,
  onLoadMore,
  hasMore = false
}) => {
  const { t } = useAppPreferences();
  
  // Set up infinite scroll
  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(
    onLoadMore || (async () => {}),
    hasMore && !loading && !error
  );
  
  if (loading) {
    return (
      <div className="event-list-loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <span>{t('loadingEvents')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list-error" role="alert" aria-live="assertive">
        <p className="error-message">{error}</p>
        <p className="error-hint">
          {error.includes('timeout') 
            ? t('requestTimeout')
            : error.includes('Network')
            ? t('networkError')
            : t('somethingWentWrong')}
        </p>
        <button 
          className="retry-button"
          onClick={onRetry || (() => window.location.reload())}
          aria-label={t('retry')}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="event-list-empty" role="status">
        <p className="empty-message">{t('noEventsFound')}</p>
        <p className="empty-description">
          {t('checkBackLater')}
        </p>
      </div>
    );
  }

  return (
    <div className="event-list-container">
      <div className="event-list" role="list">
        {events.map((event) => (
          <div key={event.id} role="listitem">
            <EventCard event={event} onClick={onEventClick} />
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger element */}
      {hasMore && !loading && !error && (
        <div ref={loadMoreRef} className="load-more-trigger">
          {isLoadingMore && (
            <div className="load-more-loading" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <span>{t('loadingMoreEvents')}</span>
            </div>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && events.length > 0 && (
        <div className="end-of-list" role="status">
          <p>{t('endOfList')}</p>
        </div>
      )}
    </div>
  );
};

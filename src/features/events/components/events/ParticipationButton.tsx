import React, { useState, useEffect } from 'react';
import { ParticipationType } from '@features/events/types/event.types';
import { participationService } from '@features/events/services/participationService';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';
import { useAuth } from '@contexts/AuthContext';

interface ParticipationButtonProps {
  eventId: string;
  maxParticipants?: number;
  onParticipationChange?: (type: ParticipationType | null) => void;
  className?: string;
}

/**
 * ParticipationButton Component
 * Allows users to indicate their participation status for an event
 * Three states: Going, Interested, Not participating
 */
export const ParticipationButton: React.FC<ParticipationButtonProps> = ({
  eventId,
  maxParticipants,
  onParticipationChange,
  className = '',
}) => {
  const { t } = useAppPreferences();
  const { currentUser } = useAuth();
  const [currentType, setCurrentType] = useState<ParticipationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFull, setIsFull] = useState(false);
  
  const userId = currentUser?.uid || '';

  useEffect(() => {
    loadParticipation();
    checkCapacity();
  }, [eventId, userId]);

  const loadParticipation = async () => {
    try {
      const participation = await participationService.getParticipation(eventId, userId);
      setCurrentType(participation?.type || null);
    } catch (error) {
      console.error('Failed to load participation:', error);
    }
  };

  const checkCapacity = async () => {
    if (!maxParticipants) {
      setIsFull(false);
      return;
    }

    try {
      const full = await participationService.isEventFull(eventId, maxParticipants);
      setIsFull(full);
    } catch (error) {
      console.error('Failed to check capacity:', error);
    }
  };

  const handleParticipationClick = async (type: ParticipationType) => {
    // If clicking the same type, remove participation
    if (currentType === type) {
      await handleRemoveParticipation();
      return;
    }

    // Check if event is full when trying to mark as "Going"
    if (type === ParticipationType.GOING && isFull && currentType !== ParticipationType.GOING) {
      alert(t('eventFullCapacity'));
      return;
    }

    setLoading(true);

    try {
      await participationService.joinEvent(
        eventId, 
        userId, 
        currentUser?.displayName || 'Anonymous',
        currentUser?.photoURL || undefined,
        type
      );
      setCurrentType(type);
      onParticipationChange?.(type);
      await checkCapacity();
    } catch (error) {
      console.error('Failed to update participation:', error);
      alert(t('failedToUpdateParticipation'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipation = async () => {
    setLoading(true);

    try {
      await participationService.leaveEvent(eventId, userId);
      setCurrentType(null);
      onParticipationChange?.(null);
      await checkCapacity();
    } catch (error) {
      console.error('Failed to remove participation:', error);
      alert(t('failedToRemoveParticipation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`participation-button-group ${className}`}>
      <button
        className={`participation-btn going ${currentType === ParticipationType.GOING ? 'active' : ''}`}
        onClick={() => handleParticipationClick(ParticipationType.GOING)}
        disabled={loading || (isFull && currentType !== ParticipationType.GOING)}
        aria-label={currentType === ParticipationType.GOING ? t('removeGoingStatus') : t('markAsGoing')}
        aria-pressed={currentType === ParticipationType.GOING}
      >
        <span className="btn-icon" aria-hidden="true">✓</span>
        <span className="btn-text">
          {currentType === ParticipationType.GOING ? t('imGoing') : t('going')}
        </span>
      </button>

      <button
        className={`participation-btn interested ${currentType === ParticipationType.INTERESTED ? 'active' : ''}`}
        onClick={() => handleParticipationClick(ParticipationType.INTERESTED)}
        disabled={loading}
        aria-label={currentType === ParticipationType.INTERESTED ? t('removeInterestedStatus') : t('markAsInterested')}
        aria-pressed={currentType === ParticipationType.INTERESTED}
      >
        <span className="btn-icon" aria-hidden="true">⭐</span>
        <span className="btn-text">
          {t('interested')}
        </span>
      </button>

      <button
        className={`participation-btn maybe ${currentType === ParticipationType.MAYBE ? 'active' : ''}`}
        onClick={() => handleParticipationClick(ParticipationType.MAYBE)}
        disabled={loading}
        aria-label={currentType === ParticipationType.MAYBE ? t('removeMaybeStatus') : t('markAsMaybe')}
        aria-pressed={currentType === ParticipationType.MAYBE}
      >
        <span className="btn-icon" aria-hidden="true">?</span>
        <span className="btn-text">{t('maybe')}</span>
      </button>

      {isFull && currentType !== ParticipationType.GOING && (
        <span className="capacity-warning" role="status">
          {t('eventFullCapacity')}
        </span>
      )}
    </div>
  );
};

export default ParticipationButton;

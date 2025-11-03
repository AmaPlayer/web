import React, { useState, useEffect } from 'react';
import { Event, EventStatus, EventType } from '@features/events/types/event.types';
import { eventService } from '@features/events/services/eventService';
import { StatusBadge } from '@features/events/components/common/StatusBadge';
import { CountdownTimer } from '@features/events/components/common/CountdownTimer';
import { StatCounter } from '@features/events/components/common/StatCounter';
import { ParticipationButton } from '@features/events/components/events/ParticipationButton';
import { ParticipantsList } from '@features/events/components/events/ParticipantsList';
import { ParticipantCounter } from '@features/events/components/events/ParticipantCounter';
import { LazyImage } from '@features/events/components/common/LazyImage';
import { LazyVideo } from '@features/events/components/common/LazyVideo';
import { LiveActivityFeed } from '@features/events/components/common/LiveActivityFeed';
import { MentorProfile } from '@features/events/components/common/MentorProfile';
import { ReactionButton } from '@features/events/components/common/ReactionButton';
import { ReactionDisplay } from '@features/events/components/common/ReactionDisplay';
import { EventPoll } from '@features/events/components/common/EventPoll';
import { EventQA } from '@features/events/components/common/EventQA';
import { LiveDiscussion } from '@features/events/components/common/LiveDiscussion';
import { ChallengeCard } from '@features/events/components/common/ChallengeCard';
import '@features/events/styles/index.css';
import '@features/events/styles/accessibility.css';
import { Challenge, Poll, QASession } from '@features/events/types';
import { formatDate } from '@features/events/utils/timestampHelpers';
import { MentorProfile as MentorProfileType } from '@features/events/types/social.types';
import { mentorshipSystem } from '@features/events/services/mentorshipSystem';
import { challengeSystem } from '@features/events/services/challengeSystem';
import { interactiveEventService } from '@features/events/services/interactiveEventService';
import { useAuth } from '@contexts/AuthContext';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';


interface EventDetailPageProps {
  eventId: string;
  onBack?: () => void;
}

/**
 * EventDetailPage Component
 * Full detailed view of an event with all information and interaction options
 * Enhanced with engagement features: mentorship, social interactions, and interactive elements
 * Requirements: 5.1, 6.1, 10.1, 10.2, 10.3
 */
export const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onBack }) => {
  // Get authentication and preferences from main app contexts
  const { currentUser } = useAuth();
  const { t, isDarkMode } = useAppPreferences();
  
  const isAuthenticated = !!currentUser && !currentUser.isAnonymous;
  const currentUserId = currentUser?.uid || 'anonymous';
  const currentUserName = currentUser?.displayName || 'User';
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'participants' | 'mentorship' | 'interactive'>('about');
  
  // Engagement features state
  const [mentors, setMentors] = useState<MentorProfileType[]>([]);
  const [eventChallenges, setEventChallenges] = useState<Challenge[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [qaSession, setQASession] = useState<QASession | null>(null);

  useEffect(() => {
    loadEvent();
    loadEngagementFeatures();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    setError(null);

    try {
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);

      // Increment view count
      await eventService.incrementViewCount(eventId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const loadEngagementFeatures = async () => {
    if (!isAuthenticated) return;

    try {
      // Load available mentors for this event's sport
      const criteria = {
        sport: event?.sport || 'general',
        skillLevel: 'intermediate' as any,
        availability: 'available' as any
      };
      const availableMentors = await mentorshipSystem.findMentors(currentUserId, criteria);
      setMentors(availableMentors);

      // Load event-specific challenges
      const challenges = await challengeSystem.getEventChallenges(eventId);
      setEventChallenges(challenges as any);

      // Load active poll for this event
      try {
        const poll = await interactiveEventService.getPoll(eventId);
        setActivePoll(poll);
      } catch (error) {
        // No active poll
        setActivePoll(null);
      }

      // Load Q&A session if active
      try {
        const qa = await interactiveEventService.getQASession(eventId);
        setQASession(qa);
      } catch (error) {
        // No active Q&A
        setQASession(null);
      }

      // Engagement features loaded successfully
    } catch (error) {
      console.error('Failed to load engagement features:', error);
    }
  };

  const handleParticipationChange = () => {
    // Reload event to get updated participant counts
    loadEvent();
  };

  const handleShare = () => {
    // Share functionality (will integrate with parent app)
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  /**
   * Handle mentorship request
   * Requirement 6.1: Mentorship opportunities
   */
  const handleMentorshipRequest = async (mentorId: string, sport: string, message: string, goals: string[]) => {
    if (!isAuthenticated) {
      alert(t('pleaseLoginToRequestMentorship') || 'Please log in to request mentorship');
      return;
    }

    try {
      await mentorshipSystem.requestMentorship(currentUserId, mentorId, sport, message, [goals.join(', ')]);
      alert(t('mentorshipRequestSent') || 'Mentorship request sent successfully!');
      // Reload mentors
      const criteria = {
        sport: event?.sport || 'general',
        skillLevel: 'intermediate' as any,
        availability: 'available' as any
      };
      const updatedMentors = await mentorshipSystem.findMentors(currentUserId, criteria);
      setMentors(updatedMentors);
    } catch (error) {
      console.error('Failed to request mentorship:', error);
      alert(t('mentorshipRequestFailed') || 'Failed to send mentorship request. Please try again.');
    }
  };

  /**
   * Handle challenge participation
   * Requirement 10.1: Interactive challenge elements
   */
  const handleChallengeParticipate = async (challengeId: string) => {
    if (!isAuthenticated) {
      alert(t('pleaseLoginToParticipate') || 'Please log in to participate in challenges');
      return;
    }

    try {
      await challengeSystem.participateInChallenge(challengeId, currentUserId);
      // Reload challenges to show updated participation
      const updatedChallenges = await challengeSystem.getEventChallenges(eventId);
      setEventChallenges(updatedChallenges as any);
    } catch (error) {
      console.error('Failed to participate in challenge:', error);
    }
  };



  const formatDateLocal = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`event-detail-page loading ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="loading-spinner"></div>
        <p>{t('loadingEventDetails') || 'Loading event details...'}</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={`event-detail-page error ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <h2>{t('errorLoadingEvent') || 'Error Loading Event'}</h2>
        <p>{error || t('eventNotFound') || 'Event not found'}</p>
        <button onClick={onBack} className="button button-primary">
          {t('backToEvents') || 'Back to Events'}
        </button>
      </div>
    );
  }

  const reactionCount = event.reactions?.length || 0;
  const totalParticipants = (event.participantIds?.length || 0) + (event.interestedIds?.length || 0);

  return (
    <div className={`event-detail-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="back-button"
        aria-label={t('backToEvents') || 'Back to events'}
      >
        <span aria-hidden="true">←</span> {t('backToEvents') || 'Back to Events'}
      </button>

      {/* Hero Section */}
      <div className="event-hero">
        {event.videoUrl ? (
          <div className="event-hero-media">
            <LazyVideo
              src={event.videoUrl}
              className="event-hero-video"
              controls={true}
            />
          </div>
        ) : event.thumbnailUrl ? (
          <div className="event-hero-media">
            <LazyImage
              src={event.thumbnailUrl}
              alt={event.title}
              className="event-hero-image"
            />
          </div>
        ) : (
          <div className="event-hero-placeholder">
            <span className="hero-icon" aria-hidden="true">🏅</span>
          </div>
        )}

        <div className="event-hero-overlay">
          <div className="hero-badges">
            {event.isTrending && <StatusBadge type="trending" />}
            {event.status === EventStatus.ONGOING && <StatusBadge type="live" />}
            {event.isOfficial && <StatusBadge type="official" />}
          </div>

          <div className="hero-actions">
            <button
              onClick={handleShare}
              className="action-btn share"
              aria-label={t('shareEvent') || 'Share event'}
            >
              <span aria-hidden="true">🔗</span> {t('share') || 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* Title and Info Section */}
      <div className="event-header">
        <div className="event-title-section">
          <h1 className="event-title">{event.title}</h1>
          <div className="event-header-badges">
            <StatusBadge type={event.eventType} showIcon={true} />
            <StatusBadge type={event.status} />
          </div>
        </div>

        {/* Countdown or Status */}
        {event.status === EventStatus.UPCOMING && (
          <div className="event-countdown-section">
            <p className="countdown-label">{t('eventStartsIn') || 'Event starts in:'}</p>
            <CountdownTimer targetDate={event.startDate} compact={false} />
          </div>
        )}

        {event.status === EventStatus.ONGOING && (
          <div className="event-ongoing-section">
            <span className="live-pulse" aria-hidden="true">🔴</span>
            <span className="live-text">{t('happeningNow') || 'Happening Now!'}</span>
          </div>
        )}
      </div>

      {/* Event Info Grid */}
      <div className="event-info-grid">
        <div className="info-item">
          <span className="info-icon" aria-hidden="true">🏅</span>
          <div className="info-content">
            <span className="info-label">{t('sport')}</span>
            <span className="info-value">{event.sport}</span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon" aria-hidden="true">📍</span>
          <div className="info-content">
            <span className="info-label">{t('location')}</span>
            <span className="info-value">{event.location}</span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon" aria-hidden="true">📅</span>
          <div className="info-content">
            <span className="info-label">{t('dateTime')}</span>
            <span className="info-value">{formatDateLocal(event.startDate)}</span>
          </div>
        </div>

        {event.endDate && (
          <div className="info-item">
            <span className="info-icon" aria-hidden="true">🏁</span>
            <div className="info-content">
              <span className="info-label">{t('ends')}</span>
              <span className="info-value">{formatDate(event.endDate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Participation Section */}
      <div className="event-participation-section">
        <ParticipantCounter
          eventId={event.id}
          maxParticipants={event.maxParticipants}
          showBreakdown={true}
          animate={true}
        />

        <ParticipationButton
          eventId={event.id}
          maxParticipants={event.maxParticipants}
          onParticipationChange={handleParticipationChange}
        />
      </div>

      {/* Stats Bar */}
      <div className="event-stats-bar">
        <StatCounter value={event.viewCount} icon="👁️" label={t('views')} compact={true} />
        <StatCounter value={reactionCount} icon="❤️" label={t('reactions')} compact={true} />
        <StatCounter value={event.commentCount} icon="💬" label={t('comments')} compact={true} />
        <StatCounter value={event.shareCount} icon="🔗" label={t('shares')} compact={true} />
      </div>

      {/* Enhanced Reactions Section - Requirement 10.1 */}
      <div className="event-reactions-section">
        <div className="reactions-display">
          <ReactionDisplay
            targetId={eventId}
          />
        </div>
        <div className="reaction-buttons">
          <ReactionButton
            targetId={eventId}
            targetType="event"
            currentUserId={currentUserId}
            currentUserName="Current User"
            sport={event?.sport}
            showCount={true}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="event-tabs-section">
        <div className="tab-buttons" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'about'}
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            {t('about')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'participants'}
            className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            {t('participants')} ({totalParticipants})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'mentorship'}
            className={`tab-button ${activeTab === 'mentorship' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentorship')}
          >
            {t('mentorship')} ({mentors.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'interactive'}
            className={`tab-button ${activeTab === 'interactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('interactive')}
          >
            {t('interactive')}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'about' && (
            <div className="tab-panel about-panel" role="tabpanel">
              <section className="event-section">
                <h2 className="section-title">{t('aboutThisEvent')}</h2>
                <p className="event-description">{event.description}</p>
              </section>

              {event.eventType === EventType.TALENT_HUNT && (
                <>
                  {event.prizes && event.prizes.length > 0 && (
                    <section className="event-section prizes-section">
                      <h2 className="section-title">🏆 {t('prizes')}</h2>
                      <ul className="prizes-list">
                        {event.prizes.map((prize, index) => (
                          <li key={index} className="prize-item">
                            <span className="prize-rank">#{index + 1}</span>
                            <span className="prize-name">{prize}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {event.rules && (
                    <section className="event-section rules-section">
                      <h2 className="section-title">📋 {t('rulesAndGuidelines')}</h2>
                      <div className="rules-content">
                        {event.rules.split('\n').map((rule, index) => (
                          <p key={index} className="rule-item">{rule}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {(event.submissionDeadline || event.votingDeadline) && (
                    <section className="event-section deadlines-section">
                      <h2 className="section-title">⏰ {t('importantDates')}</h2>
                      <div className="deadlines-list">
                        {event.submissionDeadline && (
                          <div className="deadline-item">
                            <span className="deadline-label">{t('submissionDeadline')}:</span>
                            <span className="deadline-value">
                              {formatDate(event.submissionDeadline)}
                            </span>
                          </div>
                        )}
                        {event.votingDeadline && (
                          <div className="deadline-item">
                            <span className="deadline-label">{t('votingDeadline')}:</span>
                            <span className="deadline-value">
                              {formatDate(event.votingDeadline)}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}

              <section className="event-section organizer-section">
                <h2 className="section-title">{t('organizer') || 'Organizer'}</h2>
                <div className="organizer-info">
                  <div className="organizer-avatar">
                    {event.hostType === 'amaplayer_official' ? '⭐' : '👤'}
                  </div>
                  <div className="organizer-details">
                    <p className="organizer-name">
                      {event.hostType === 'amaplayer_official' ? t('amaplayerOfficial') || 'AmaPlayer Official' : event.createdBy}
                    </p>
                    <p className="organizer-badge">
                      {event.isOfficial ? t('verifiedOrganizer') || '✓ Verified Organizer' : t('communityOrganizer') || 'Community Organizer'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="tab-panel participants-panel" role="tabpanel">
              <ParticipantsList
                eventId={event.id}
                maxDisplay={50}
                showFilter={true}
              />
            </div>
          )}

          {activeTab === 'mentorship' && (
            <div className="tab-panel mentorship-panel" role="tabpanel">
              {/* Requirements: 6.1 - Mentorship opportunities */}
              <section className="mentorship-section">
                <h2 className="section-title">🤝 {t('availableMentors') || 'Available Mentors'}</h2>
                
                {mentors.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('noMentorsAvailable') || 'No mentors available for this sport yet.'}</p>
                    <p>{t('checkBackLater') || 'Check back later or consider becoming a mentor yourself!'}</p>
                  </div>
                ) : (
                  <div className="mentorship-grid">
                    {mentors.map((mentor) => (
                      <div key={mentor.userId} className="mentorship-card">
                        <MentorProfile
                          mentor={mentor}
                          currentUserId={currentUserId}
                          onRequestMentorship={handleMentorshipRequest}
                          showRequestButton={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Event-specific challenges */}
              {eventChallenges.length > 0 && (
                <section className="challenges-section">
                  <h2 className="section-title">🏆 Event Challenges</h2>
                  <div className="challenges-grid">
                    {eventChallenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onClick={() => console.log('Navigate to challenge:', challenge.id)}
                        onParticipate={handleChallengeParticipate}
                        userParticipated={challenge.participants.includes(currentUserId)}
                        className="event-challenge"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'interactive' && (
            <div className="tab-panel interactive-panel" role="tabpanel">
              {/* Requirements: 10.1, 10.2, 10.3 - Interactive elements */}
              
              {/* Live Activity Feed */}
              <section className="interactive-section">
                <h2 className="section-title">📢 {t('liveActivity') || 'Live Activity'}</h2>
                <LiveActivityFeed
                  eventId={eventId}
                  maxItems={20}
                  showFilters={true}
                  className="event-activity-feed"
                />
              </section>

              {/* Active Poll - Requirement 10.2 */}
              {activePoll && (
                <section className="interactive-section">
                  <h2 className="section-title">📊 {t('livePoll') || 'Live Poll'}</h2>
                  <EventPoll
                    eventId={eventId}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                  />
                </section>
              )}

              {/* Q&A Session - Requirement 10.3 */}
              {qaSession && (
                <section className="interactive-section">
                  <h2 className="section-title">❓ {t('qaSession') || 'Q&A Session'}</h2>
                  <EventQA
                    eventId={eventId}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                  />
                </section>
              )}

              {/* Live Discussion */}
              <section className="interactive-section">
                <h2 className="section-title">💬 {t('liveDiscussion') || 'Live Discussion'}</h2>
                <LiveDiscussion
                  eventId={eventId}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </section>

              {/* Interactive Elements Info */}
              {!activePoll && !qaSession && (
                <section className="interactive-section">
                  <div className="interactive-info">
                    <h3>🎯 Interactive Features</h3>
                    <p>
                      Stay tuned for live polls, Q&A sessions, and other interactive elements 
                      that will be activated during the event!
                    </p>
                    <div className="feature-list">
                      <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>Live Polls & Voting</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">❓</span>
                        <span>Q&A with Organizers</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">💬</span>
                        <span>Real-time Chat</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">🏆</span>
                        <span>Live Challenges</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

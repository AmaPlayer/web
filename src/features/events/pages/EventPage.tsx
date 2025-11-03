import React, { useState, lazy, Suspense, useEffect } from 'react';
import { EventCategory } from '@features/events/types/event.types';
import { EventTabs } from '@features/events/components/events/EventTabs';
import { EventList } from '@features/events/components/events/EventList';
import { CreateEventButton } from '@features/events/components/events/CreateEventButton';
import { useEvents } from '@features/events/hooks/useEvents';
import { EventDetailPage } from '@features/events/pages/EventDetailPage';
import { LiveActivityFeed } from '@features/events/components/common/LiveActivityFeed';
import { AchievementNotification } from '@features/events/components/common/AchievementNotification';
import { ChallengeCard } from '@features/events/components/common/ChallengeCard';
import { LeaderboardDisplay } from '@features/events/components/common/LeaderboardDisplay';
import { Achievement, Challenge, LeaderboardType, LeaderboardPeriod } from '@features/events/types/engagement.types';
import { achievementEngine } from '@features/events/services/achievementEngine';
import { challengeSystem } from '@features/events/services/challengeSystem';
import { useAuth } from '@contexts/AuthContext';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';
import '@features/events/styles/index.css';
import '@features/events/styles/accessibility.css';

// Lazy load CreateEventForm for better bundle size
const CreateEventForm = lazy(() =>
  import('@features/events/components/events/CreateEventForm').then(module => ({
    default: module.CreateEventForm
  }))
);

interface EventPageProps {
  initialCategory?: EventCategory;
}

/**
 * Main EventPage container component
 * Manages state for active tab and create form visibility
 * Now includes routing to event detail page and engagement features
 * Requirements: 1.1, 1.2, 1.3, 2.4, 3.3, 4.3, 5.1, 5.2
 */
export const EventPage: React.FC<EventPageProps> = ({
  initialCategory = EventCategory.UPCOMING
}) => {
  // Get authentication and preferences from main app contexts
  const { currentUser } = useAuth();
  const { t, isDarkMode } = useAppPreferences();
  
  const isAuthenticated = !!currentUser && !currentUser.isAnonymous;
  const currentUserId = currentUser?.uid || 'anonymous';
  
  const [activeTab, setActiveTab] = useState<EventCategory>(initialCategory);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Engagement features state
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [featuredChallenges, setFeaturedChallenges] = useState<Challenge[]>([]);
  const [showEngagementPanel, setShowEngagementPanel] = useState(true);

  // Fetch events based on active tab with pagination and caching
  const { data: events, isLoading: loading, error, refetch } = useEvents({ category: activeTab });

  // Load featured challenges and check for achievements
  useEffect(() => {
    const loadEngagementData = async () => {
      if (isAuthenticated && currentUserId) {
        try {
          // Load featured challenges
          const challenges = await challengeSystem.getFeaturedChallenges(5);
          setFeaturedChallenges(challenges as any);

          // Check for new achievements
          const userAchievements = await achievementEngine.checkAchievements(currentUserId, { 
            type: 'EVENT_JOINED' as any, 
            userId: currentUserId,
            eventId: '',
            timestamp: new Date()
          });
          if (userAchievements.length > 0) {
            setNewAchievement(userAchievements[0]);
            setShowAchievementNotification(true);
          }
        } catch (error) {
          console.error('Failed to load engagement data:', error);
        }
      }
    };

    loadEngagementData();
  }, [isAuthenticated, currentUserId, activeTab]);

  /**
   * Handle tab change with smooth transition
   * Requirement 1.2: Switch between event categories
   */
  const handleTabChange = (tab: EventCategory) => {
    if (tab === activeTab) return;

    // Trigger fade out
    setIsTransitioning(true);

    // Change tab after fade out starts
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
    }, 200);
  };

  /**
   * Handle event click - navigate to event detail page
   * Requirements: 2.4, 3.4, 4.4
   */
  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  /**
   * Handle back from detail page
   */
  const handleBackToList = () => {
    setSelectedEventId(null);
    // Refresh the list to show updated data
    refetch();
  };

  /**
   * Handle create event button click
   * Requirement 5.1: Open event creation form
   */
  const handleCreateClick = () => {
    if (!isAuthenticated) {
      // Requirement 5.3: Prompt for login if not authenticated
      alert(t('pleaseLoginToCreateEvent') || 'Please log in to create an event');
      // Redirect to login page
      window.location.href = '/login';
      return;
    }
    setShowCreateForm(true);
  };

  /**
   * Handle successful event creation
   * Requirement 5.2: Refresh list after event creation
   */
  const handleEventCreated = async () => {
    // Refresh the event list after successful creation
    await refetch();
    setShowCreateForm(false);
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = () => {
    setShowCreateForm(false);
  };

  /**
   * Handle challenge participation
   * Requirement 3.3: Implement challenge and leaderboard sections
   */
  const handleChallengeParticipate = async (challengeId: string) => {
    if (!isAuthenticated) {
      alert(t('pleaseLoginToParticipate') || 'Please log in to participate in challenges');
      return;
    }

    try {
      await challengeSystem.participateInChallenge(challengeId, currentUserId);
      // Refresh challenges to show updated participation
      const updatedChallenges = await challengeSystem.getFeaturedChallenges(5);
      setFeaturedChallenges(updatedChallenges as any);
    } catch (error) {
      console.error('Failed to participate in challenge:', error);
    }
  };

  /**
   * Handle challenge click
   */
  const handleChallengeClick = (challengeId: string) => {
    // In a real app, this would navigate to challenge detail page
    console.log('Navigate to challenge:', challengeId);
  };

  /**
   * Handle achievement notification close
   */
  const handleAchievementClose = () => {
    setShowAchievementNotification(false);
    setNewAchievement(null);
  };

  /**
   * Toggle engagement panel visibility
   */
  const toggleEngagementPanel = () => {
    setShowEngagementPanel(!showEngagementPanel);
  };

  // If an event is selected, show detail page
  if (selectedEventId) {
    return <EventDetailPage eventId={selectedEventId} onBack={handleBackToList} />;
  }

  // Otherwise show event list with engagement features
  return (
    <div className={`event-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        {t('skipToMainContent') || 'Skip to main content'}
      </a>

      <div className="event-page-header">
        <h1 className="event-page-title" id="page-title">{t('events') || 'Events'}</h1>
        <div className="header-actions">
          <button
            className="engagement-toggle"
            onClick={toggleEngagementPanel}
            aria-label={showEngagementPanel ? t('hideEngagementPanel') || 'Hide engagement panel' : t('showEngagementPanel') || 'Show engagement panel'}
          >
            {showEngagementPanel ? '🔽' : '🔼'} {t('engagement') || 'Engagement'}
          </button>
          <CreateEventButton
            onClick={handleCreateClick}
            disabled={!isAuthenticated}
          />
        </div>
      </div>

      {/* Requirement 1.1: Display three navigation options */}
      <EventTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="event-page-layout">
        {/* Main content area */}
        <main
          id="main-content"
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
          className={`event-page-content ${isTransitioning ? 'content-transitioning' : 'content-visible'}`}
          tabIndex={-1}
        >
          <EventList
            events={events || []}
            loading={loading}
            error={error?.message}
            onEventClick={handleEventClick}
            onRetry={refetch}
          />
        </main>

        {/* Engagement panel - Requirements: 1.1, 2.4, 3.3, 4.3 */}
        {showEngagementPanel && isAuthenticated && (
          <aside className="engagement-panel" aria-label="Engagement features">
            {/* Real-time activity feed - Requirement 1.1 */}
            <section className="engagement-section">
              <LiveActivityFeed
                eventId="global-feed"
                maxItems={10}
                showFilters={false}
                className="global-activity-feed"
              />
            </section>

            {/* Featured challenges - Requirement 3.3 */}
            {featuredChallenges.length > 0 && (
              <section className="engagement-section">
                <h3 className="section-title">{t('featuredChallenges') || 'Featured Challenges'}</h3>
                <div className="challenges-grid">
                  {featuredChallenges.slice(0, 3).map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClick={handleChallengeClick}
                      onParticipate={handleChallengeParticipate}
                      userParticipated={challenge.participants.includes(currentUserId)}
                      className="featured-challenge"
                    />
                  ))}
                </div>
                <button className="view-all-challenges">
                  {t('viewAllChallenges') || 'View All Challenges'}
                </button>
              </section>
            )}

            {/* Leaderboard - Requirement 4.3 */}
            <section className="engagement-section">
              <LeaderboardDisplay
                type={LeaderboardType.ENGAGEMENT_SCORE}
                period={LeaderboardPeriod.WEEKLY}
                maxEntries={10}
                showUserHighlight={true}
                currentUserId={currentUserId}
                showFilters={false}
                className="main-leaderboard"
              />
            </section>
          </aside>
        )}
      </div>

      {/* Achievement notification - Requirement 2.4 */}
      {newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          isVisible={showAchievementNotification}
          onClose={handleAchievementClose}
          autoCloseDelay={6000}
        />
      )}

      {/* Event creation form modal - lazy loaded */}
      {showCreateForm && (
        <Suspense fallback={
          <div className="form-loading" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <span>{t('loadingForm') || 'Loading form...'}</span>
          </div>
        }>
          <CreateEventForm
            isOpen={showCreateForm}
            onSuccess={handleEventCreated}
            onCancel={handleFormCancel}
            userId={currentUserId}
          />
        </Suspense>
      )}
    </div>
  );
};

export default EventPage;

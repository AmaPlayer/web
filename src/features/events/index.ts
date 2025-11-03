/**
 * Events Feature Module
 * 
 * This module contains all events-related functionality including:
 * - Event creation and management
 * - Participation tracking
 * - Gamification (achievements, badges, leaderboards)
 * - Challenges and competitions
 * - Real-time features
 * - Team management
 * - Mentorship system
 */

// Pages
export { default as EventPage } from '@features/events/pages/EventPage';
export { default as EventDetailPage } from '@features/events/pages/EventDetailPage';
export { default as AthleteProfilePage } from '@features/events/pages/AthleteProfilePage';

// Components - Events
export { CreateEventButton } from '@features/events/components/events/CreateEventButton';
export { CreateEventForm } from '@features/events/components/events/CreateEventForm';
export { EventCard } from '@features/events/components/events/EventCard';
export { EventList } from '@features/events/components/events/EventList';
export { EventTabs } from '@features/events/components/events/EventTabs';
export { ParticipantCounter } from '@features/events/components/events/ParticipantCounter';
export { ParticipantsList } from '@features/events/components/events/ParticipantsList';
export { ParticipationButton } from '@features/events/components/events/ParticipationButton';

// Components - Common
export { AchievementNotification } from '@features/events/components/common/AchievementNotification';
export { BadgeCollection } from '@features/events/components/common/BadgeCollection';
export { BadgeDisplay } from '@features/events/components/common/BadgeDisplay';
export { CelebrationGif } from '@features/events/components/common/CelebrationGif';
export { ChallengeCard } from '@features/events/components/common/ChallengeCard';
export { ChallengeLeaderboard } from '@features/events/components/common/ChallengeLeaderboard';
export { ChallengeParticipation } from '@features/events/components/common/ChallengeParticipation';
export { CountdownTimer } from '@features/events/components/common/CountdownTimer';
export { EventPoll } from '@features/events/components/common/EventPoll';
export { EventQA } from '@features/events/components/common/EventQA';
export { GoalSuggestionEngine } from '@features/events/components/common/GoalSuggestionEngine';
export { LazyImage } from '@features/events/components/common/LazyImage';
export { LazyVideo } from '@features/events/components/common/LazyVideo';
export { LeaderboardDisplay } from '@features/events/components/common/LeaderboardDisplay';
export { LeaderboardFilters } from '@features/events/components/common/LeaderboardFilters';
export { LiveActivityFeed } from '@features/events/components/common/LiveActivityFeed';
export { LiveDiscussion } from '@features/events/components/common/LiveDiscussion';
export { LocationInput } from '@features/events/components/common/LocationInput';
export { MentorProfile } from '@features/events/components/common/MentorProfile';
export { MentorshipManagement } from '@features/events/components/common/MentorshipManagement';
export { MentorshipSuccessTracker } from '@features/events/components/common/MentorshipSuccessTracker';
export { MilestoneTracker } from '@features/events/components/common/MilestoneTracker';
export { MotivationalMessageDisplay } from '@features/events/components/common/MotivationalMessageDisplay';
export { MotivationalMessageSender } from '@features/events/components/common/MotivationalMessageSender';
export { NotificationCenter } from '@features/events/components/common/NotificationCenter';
export { PersonalizedEventFeed } from '@features/events/components/common/PersonalizedEventFeed';
export { PersonalizedPerformanceReport } from '@features/events/components/common/PersonalizedPerformanceReport';
export { PreferenceManager } from '@features/events/components/common/PreferenceManager';
export { ProgressChart } from '@features/events/components/common/ProgressChart';
export { RankingChangeNotification } from '@features/events/components/common/RankingChangeNotification';
export { ReactionButton } from '@features/events/components/common/ReactionButton';
export { ReactionCluster } from '@features/events/components/common/ReactionCluster';
export { ReactionDisplay } from '@features/events/components/common/ReactionDisplay';
export { RecommendationFeedback } from '@features/events/components/common/RecommendationFeedback';
export { StatCounter } from '@features/events/components/common/StatCounter';
export { StatsDashboard } from '@features/events/components/common/StatsDashboard';
export { StatusBadge } from '@features/events/components/common/StatusBadge';
export { StreakDisplay } from '@features/events/components/common/StreakDisplay';
export { TeamFormation } from '@features/events/components/common/TeamFormation';
export { TeamLeaderboard } from '@features/events/components/common/TeamLeaderboard';
export { TeamManagement } from '@features/events/components/common/TeamManagement';
export { UserInsightsDashboard } from '@features/events/components/common/UserInsightsDashboard';
export { VideoUpload } from '@features/events/components/common/VideoUpload';

// Hooks
export { useEvents } from '@features/events/hooks/useEvents';
export { useEventForm } from '@features/events/hooks/useEventForm';
export { useVideoUpload } from '@features/events/hooks/useVideoUpload';
export { useInfiniteScroll } from '@features/events/hooks/useInfiniteScroll';

// Services
export { eventService } from '@features/events/services/eventService';
export { participationService } from '@features/events/services/participationService';
export { achievementEngine } from '@features/events/services/achievementEngine';
export { leaderboardService } from '@features/events/services/leaderboardService';
export { challengeSystem } from '@features/events/services/challengeSystem';
export { reactionSystem } from '@features/events/services/reactionSystem';
export { teamSystem } from '@features/events/services/teamSystem';
export { mentorshipSystem } from '@features/events/services/mentorshipSystem';
export { progressTracker } from '@features/events/services/progressTracker';
export { liveFeedManager } from '@features/events/services/liveFeedManager';
export { webSocketService } from '@features/events/services/webSocketService';
export { uploadService } from '@features/events/services/uploadService';
export { cacheService } from '@features/events/services/cacheService';
export { locationService } from '@features/events/services/locationService';
export { interactiveEventService } from '@features/events/services/interactiveEventService';
export { motivationalMessagingSystem } from '@features/events/services/motivationalMessaging';
export { recommendationService } from '@features/events/services/recommendationService';
export { statisticsService } from '@features/events/services/statisticsService';
export { pwaService } from '@features/events/services/pwaService';

// Types
export * from '@features/events/types';

// Utils
export * from '@features/events/utils/constants';
export * from '@features/events/utils/validation';
export * from '@features/events/utils/cache';
export * from '@features/events/utils/debounce';

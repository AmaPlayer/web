import { Timestamp } from 'firebase/firestore';

// Notification System Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  priority: NotificationPriority;
  category: NotificationCategory;
  isRead: boolean;
  read: boolean; // Alias for isRead for backward compatibility
  createdAt: Timestamp;
  readAt?: Timestamp;
  expiresAt?: Timestamp;
  actionUrl?: string;
  actionText?: string;
}

export enum NotificationType {
  // Achievement notifications
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  BADGE_EARNED = 'badge_earned',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  
  // Event notifications
  EVENT_REMINDER = 'event_reminder',
  EVENT_STARTED = 'event_started',
  EVENT_ENDING_SOON = 'event_ending_soon',
  EVENT_INVITATION = 'event_invitation',
  EVENT_UPDATE = 'event_update',
  
  // Challenge notifications
  CHALLENGE_INVITATION = 'challenge_invitation',
  CHALLENGE_STARTED = 'challenge_started',
  CHALLENGE_COMPLETED = 'challenge_completed',
  CHALLENGE_WON = 'challenge_won',
  CHALLENGE_RESULTS = 'challenge_results',
  
  // Social notifications
  NEW_FOLLOWER = 'new_follower',
  MENTORSHIP_REQUEST = 'mentorship_request',
  MENTORSHIP_ACCEPTED = 'mentorship_accepted',
  TEAM_INVITATION = 'team_invitation',
  REACTION_RECEIVED = 'reaction_received',
  COMMENT_RECEIVED = 'comment_received',
  
  // Leaderboard notifications
  RANK_CHANGED = 'rank_changed',
  TOP_PERFORMER = 'top_performer',
  LEADERBOARD_FEATURED = 'leaderboard_featured',
  
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  MAINTENANCE_ALERT = 'maintenance_alert',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
  
  // Recommendation notifications
  RECOMMENDED_EVENT = 'recommended_event',
  RECOMMENDED_CHALLENGE = 'recommended_challenge',
  RECOMMENDED_MENTOR = 'recommended_mentor'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  ACHIEVEMENT = 'achievement',
  EVENT = 'event',
  SOCIAL = 'social',
  CHALLENGE = 'challenge',
  SYSTEM = 'system',
  RECOMMENDATION = 'recommendation'
}

export type NotificationData = 
  | AchievementNotificationData
  | EventNotificationData
  | ChallengeNotificationData
  | SocialNotificationData
  | LeaderboardNotificationData
  | SystemNotificationData
  | RecommendationNotificationData;

export interface AchievementNotificationData {
  achievementId: string;
  achievementName: string;
  badgeUrl: string;
  points: number;
  rarity: string;
  level?: number;
  streakCount?: number;
}

export interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  eventDate: Timestamp;
  eventLocation?: string;
  reminderTime?: number; // minutes before event
  invitedBy?: string;
}

export interface ChallengeNotificationData {
  challengeId: string;
  challengeTitle: string;
  eventId?: string;
  rank?: number;
  score?: number;
  prize?: string;
  invitedBy?: string;
}

export interface SocialNotificationData {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  targetType?: 'event' | 'comment' | 'submission';
  targetId?: string;
  reactionType?: string;
  teamId?: string;
  teamName?: string;
}

export interface LeaderboardNotificationData {
  leaderboardType: string;
  currentRank: number;
  previousRank?: number;
  change: 'up' | 'down' | 'new';
  category: string;
  period: string;
}

export interface SystemNotificationData {
  version?: string;
  features?: string[];
  maintenanceStart?: Timestamp;
  maintenanceEnd?: Timestamp;
  affectedFeatures?: string[];
}

export interface RecommendationNotificationData {
  recommendationType: 'event' | 'challenge' | 'mentor' | 'team';
  targetId: string;
  targetTitle: string;
  matchScore: number;
  reasons: string[];
}

// Push Notification Types
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification Preferences
export interface NotificationPreferences {
  userId: string;
  
  // Channel preferences
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  
  // Category preferences
  achievements: boolean;
  events: boolean;
  social: boolean;
  challenges: boolean;
  system: boolean;
  recommendations: boolean;
  
  // Frequency settings
  digestEnabled: boolean;
  digestFrequency: 'daily' | 'weekly';
  digestTime: string; // HH:MM format
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;   // HH:MM format
  
  // Priority filtering
  minimumPriority: NotificationPriority;
  
  updatedAt: Timestamp;
}

// Notification Center Types
export interface NotificationCenter {
  userId: string;
  notifications: Notification[];
  unreadCount: number;
  categories: NotificationCategoryCount[];
  lastChecked: Timestamp;
}

export interface NotificationCategoryCount {
  category: NotificationCategory;
  count: number;
  unreadCount: number;
}

export interface NotificationFilter {
  categories?: NotificationCategory[];
  isRead?: boolean;
  priority?: NotificationPriority;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// Notification Templates
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  variables: string[]; // e.g., ['userName', 'achievementName']
  priority: NotificationPriority;
  category: NotificationCategory;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

import { Timestamp } from 'firebase/firestore';

// Real-time Activity and WebSocket Types
export interface ActivityEvent {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ActivityType;
  data: ActivityData;
  timestamp: Timestamp;
  priority: Priority;
}

export enum ActivityType {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_REACTED = 'user_reacted',
  CHALLENGE_COMPLETED = 'challenge_completed',
  ACHIEVEMENT_EARNED = 'achievement_earned',
  COMMENT_POSTED = 'comment_posted',
  TEAM_FORMED = 'team_formed',
  MENTORSHIP_STARTED = 'mentorship_started',
  LEADERBOARD_UPDATED = 'leaderboard_updated',
  EVENT_STARTED = 'event_started',
  EVENT_ENDED = 'event_ended',
  POLL_CREATED = 'poll_created',
  POLL_VOTED = 'poll_voted'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export type ActivityData = 
  | UserJoinedData
  | UserReactedData
  | ChallengeCompletedData
  | AchievementEarnedData
  | CommentPostedData
  | TeamFormedData
  | MentorshipStartedData
  | LeaderboardUpdatedData
  | PollCreatedData
  | PollVotedData;

export interface UserJoinedData {
  participationType: 'going' | 'interested' | 'maybe';
}

export interface UserReactedData {
  targetType: 'event' | 'comment' | 'submission';
  targetId: string;
  reactionType: string;
}

export interface ChallengeCompletedData {
  challengeId: string;
  challengeName: string;
  score?: number;
  rank?: number;
}

export interface AchievementEarnedData {
  achievementId: string;
  achievementName: string;
  badgeUrl: string;
  rarity: string;
}

export interface CommentPostedData {
  commentId: string;
  content: string;
  targetType: 'event' | 'submission';
  targetId: string;
}

export interface TeamFormedData {
  teamId: string;
  teamName: string;
  memberCount: number;
}

export interface MentorshipStartedData {
  mentorId: string;
  mentorName: string;
  sport: string;
}

export interface LeaderboardUpdatedData {
  leaderboardType: string;
  newRank: number;
  previousRank?: number;
  change: 'up' | 'down' | 'same' | 'new';
}

export interface PollCreatedData {
  pollId: string;
  question: string;
  options: string[];
}

export interface PollVotedData {
  pollId: string;
  optionIndex: number;
  optionText: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: MessageType;
  channel: string;
  data: any;
  timestamp: Timestamp;
  messageId: string;
}

export enum MessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PUBLISH = 'publish',
  ACTIVITY = 'activity',
  NOTIFICATION = 'notification',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

export interface SubscriptionMessage {
  type: MessageType.SUBSCRIBE | MessageType.UNSUBSCRIBE;
  channel: string;
  userId: string;
}

export interface PublishMessage {
  type: MessageType.PUBLISH;
  channel: string;
  data: ActivityEvent;
}

export interface NotificationMessage {
  type: MessageType.NOTIFICATION;
  userId: string;
  notification: Notification;
}

export interface HeartbeatMessage {
  type: MessageType.HEARTBEAT;
  timestamp: Timestamp;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  error: string;
  code: number;
}

// Live Feed Types
export interface LiveFeed {
  eventId: string;
  activities: ActivityEvent[];
  participantCount: number;
  activeUsers: string[];
  lastUpdated: Timestamp;
}

export interface LiveFeedFilter {
  activityTypes?: ActivityType[];
  userId?: string;
  priority?: Priority;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// Connection Management
export interface ConnectionStatus {
  isConnected: boolean;
  connectionId: string;
  userId: string;
  connectedAt: Timestamp;
  lastActivity: Timestamp;
  subscriptions: string[];
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  maxMessageSize: number;
}

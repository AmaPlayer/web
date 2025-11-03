import { Timestamp } from 'firebase/firestore';
import { Achievement, Badge, TeamMembership } from './engagement.types';
import { MentorshipConnection } from './social.types';

// Enhanced User Profile Types
export interface AthleteProfile {
  id: string;
  basicInfo: UserBasicInfo;
  
  // Achievement system
  achievements: Achievement[];
  badges: Badge[];
  engagementScore: number;
  level: number;
  experiencePoints: number;
  nextLevelPoints: number;
  
  // Statistics
  stats: AthleteStats;
  progressHistory: ProgressEntry[];
  streaks: StreakInfo[];
  
  // Social
  mentorships: MentorshipConnection[];
  teamMemberships: TeamMembership[];
  followingIds: string[];
  followerIds: string[];
  
  // Preferences
  preferences: UserPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  
  // Activity tracking
  lastActive: Timestamp;
  joinedAt: Timestamp;
  isOnline: boolean;
}

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  dateOfBirth?: Timestamp;
  primarySports: string[];
  skillLevel: SkillLevel;
  verified: boolean;
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional',
  ELITE = 'elite'
}

export interface AthleteStats {
  // Participation metrics
  eventsJoined: number;
  eventsCompleted: number;
  eventsWon: number;
  participationRate: number;
  
  // Engagement metrics
  totalReactions: number;
  reactionsReceived: number;
  commentsPosted: number;
  commentsReceived: number;
  
  // Achievement metrics
  totalAchievements: number;
  rareAchievements: number;
  achievementPoints: number;
  
  // Challenge metrics
  challengesCompleted: number;
  challengesWon: number;
  challengeWinRate: number;
  
  // Social metrics
  mentorshipsCompleted: number;
  menteesHelped: number;
  teamContributions: number;
  
  // Time-based metrics
  totalActiveTime: number; // in minutes
  averageSessionTime: number;
  longestStreak: number;
  currentStreak: number;
  
  // Rankings
  globalRank?: number;
  sportRanks: { [sport: string]: number };
  localRank?: number;
}

export interface ProgressEntry {
  date: Timestamp;
  metric: ProgressMetric;
  value: number;
  change: number;
  context?: string;
}

export enum ProgressMetric {
  ENGAGEMENT_SCORE = 'engagement_score',
  LEVEL = 'level',
  ACHIEVEMENTS = 'achievements',
  PARTICIPATION_RATE = 'participation_rate',
  SKILL_RATING = 'skill_rating',
  SOCIAL_IMPACT = 'social_impact'
}

export interface StreakInfo {
  type: StreakType;
  current: number;
  longest: number;
  lastUpdated: Timestamp;
  isActive: boolean;
}

export enum StreakType {
  DAILY_LOGIN = 'daily_login',
  EVENT_PARTICIPATION = 'event_participation',
  CHALLENGE_COMPLETION = 'challenge_completion',
  SOCIAL_INTERACTION = 'social_interaction'
}

export interface UserPreferences {
  // Content preferences
  preferredSports: string[];
  skillLevelFilter: SkillLevel[];
  locationRadius: number; // in km
  
  // Engagement preferences
  gamificationEnabled: boolean;
  competitiveMode: boolean;
  mentorshipAvailable: boolean;
  teamParticipation: boolean;
  
  // Display preferences
  showRealTimeUpdates: boolean;
  showAchievementAnimations: boolean;
  showLeaderboards: boolean;
  showProgressTracking: boolean;
  
  // Communication preferences
  allowDirectMessages: boolean;
  allowMentorshipRequests: boolean;
  allowTeamInvitations: boolean;
  
  // Recommendation preferences
  personalizedRecommendations: boolean;
  challengeRecommendations: boolean;
  eventRecommendations: boolean;
  socialRecommendations: boolean;
}

export interface NotificationSettings {
  // Push notifications
  pushEnabled: boolean;
  
  // Event notifications
  eventReminders: boolean;
  eventUpdates: boolean;
  eventInvitations: boolean;
  
  // Achievement notifications
  achievementUnlocked: boolean;
  levelUp: boolean;
  badgeEarned: boolean;
  
  // Social notifications
  newFollower: boolean;
  mentorshipRequest: boolean;
  teamInvitation: boolean;
  reactions: boolean;
  comments: boolean;
  
  // Challenge notifications
  challengeInvitation: boolean;
  challengeResults: boolean;
  leaderboardChanges: boolean;
  
  // System notifications
  systemUpdates: boolean;
  maintenanceAlerts: boolean;
  
  // Frequency settings
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface PrivacySettings {
  // Profile visibility
  profileVisibility: 'public' | 'friends' | 'private';
  showRealName: boolean;
  showLocation: boolean;
  showStats: boolean;
  
  // Activity visibility
  showActivityFeed: boolean;
  showParticipation: boolean;
  showAchievements: boolean;
  
  // Leaderboard participation
  showInLeaderboards: boolean;
  showInGlobalRankings: boolean;
  
  // Social features
  allowMentorshipRequests: boolean;
  allowTeamInvitations: boolean;
  allowDirectMessages: boolean;
  
  // Data sharing
  shareAnalytics: boolean;
  shareRecommendations: boolean;
}

// User Insights and Analytics
export interface UserInsights {
  userId: string;
  generatedAt: Timestamp;
  
  // Performance insights
  performanceTrends: PerformanceTrend[];
  strengthAreas: string[];
  improvementAreas: string[];
  
  // Engagement insights
  engagementPatterns: EngagementPattern[];
  peakActivityTimes: TimeSlot[];
  preferredEventTypes: string[];
  
  // Social insights
  networkGrowth: NetworkMetric[];
  influenceScore: number;
  collaborationStyle: string;
  
  // Recommendations
  suggestedGoals: Goal[];
  recommendedEvents: string[];
  potentialMentors: string[];
  
  // Predictions
  nextAchievements: PredictedAchievement[];
  skillProgression: SkillPrediction[];
}

export interface PerformanceTrend {
  metric: string;
  period: 'week' | 'month' | 'quarter';
  trend: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  insights: string[];
}

export interface EngagementPattern {
  pattern: string;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface TimeSlot {
  hour: number;
  dayOfWeek: number;
  activityLevel: number;
}

export interface NetworkMetric {
  date: Timestamp;
  followers: number;
  following: number;
  connections: number;
  influence: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'participation' | 'achievement' | 'social' | 'skill';
  targetValue: number;
  currentValue: number;
  deadline?: Timestamp;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}

export interface PredictedAchievement {
  achievementId: string;
  name: string;
  probability: number;
  estimatedDate: Timestamp;
  requiredActions: string[];
}

export interface SkillPrediction {
  sport: string;
  currentLevel: SkillLevel;
  predictedLevel: SkillLevel;
  timeframe: string;
  confidence: number;
  factors: string[];
}

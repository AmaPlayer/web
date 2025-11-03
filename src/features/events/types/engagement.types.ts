import { Timestamp } from 'firebase/firestore';

// Achievement and Badge System Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  unlockedAt?: Timestamp;
}

export enum AchievementCategory {
  PARTICIPATION = 'participation',
  SOCIAL = 'social',
  SKILL = 'skill',
  LEADERSHIP = 'leadership',
  CONSISTENCY = 'consistency',
  COMMUNITY = 'community'
}

export interface AchievementRequirement {
  type: RequirementType;
  value: number;
  description: string;
}

export enum RequirementType {
  EVENTS_JOINED = 'events_joined',
  CONSECUTIVE_EVENTS = 'consecutive_events',
  REACTIONS_RECEIVED = 'reactions_received',
  CHALLENGES_COMPLETED = 'challenges_completed',
  MENTORSHIPS_COMPLETED = 'mentorships_completed',
  TEAM_WINS = 'team_wins',
  DAYS_ACTIVE = 'days_active'
}

export interface Badge {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Timestamp;
  displayOrder: number;
}

// Challenge System Types
export interface Challenge {
  id: string;
  eventId: string;
  title: string;
  description: string;
  type: ChallengeType;
  sport: string;
  startDate: Timestamp;
  endDate: Timestamp;
  maxParticipants?: number;
  rewards: Reward[];
  participants: string[];
  submissions: ChallengeSubmission[];
  status: ChallengeStatus;
  createdAt: Timestamp;
}

export enum ChallengeType {
  SKILL_SHOWCASE = 'skill_showcase',
  ENDURANCE = 'endurance',
  CREATIVITY = 'creativity',
  TEAM_COLLABORATION = 'team_collaboration',
  KNOWLEDGE_QUIZ = 'knowledge_quiz',
  PHOTO_CONTEST = 'photo_contest'
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Reward {
  type: RewardType;
  value: number;
  description: string;
  iconUrl?: string;
}

export enum RewardType {
  POINTS = 'points',
  BADGE = 'badge',
  TITLE = 'title',
  FEATURE = 'feature'
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl?: string;
  submittedAt: Timestamp;
  score?: number;
  rank?: number;
  votes: number;
  voterIds: string[];
}

// Leaderboard Types
export interface Leaderboard {
  id: string;
  eventId?: string;
  challengeId?: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  lastUpdated: Timestamp;
}

export enum LeaderboardType {
  ENGAGEMENT_SCORE = 'engagement_score',
  PARTICIPATION = 'participation',
  ACHIEVEMENTS = 'achievements',
  CHALLENGE_WINS = 'challenge_wins',
  SOCIAL_IMPACT = 'social_impact',
  TEAM_PERFORMANCE = 'team_performance'
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
  EVENT_SPECIFIC = 'event_specific'
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  previousRank?: number;
  change: RankChange;
  badges: Badge[];
  level: number;
}

// Challenge-specific leaderboard entry with additional fields
export interface ChallengeLeaderboardEntry extends LeaderboardEntry {
  // Additional fields for challenge leaderboards
}

export enum RankChange {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
  NEW = 'new'
}

// Team System Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  sport: string;
  captainId: string;
  memberIds: string[];
  maxMembers: number;
  isPublic: boolean;
  achievements: TeamAchievement[];
  stats: TeamStats;
  createdAt: Timestamp;
}

export interface TeamAchievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Timestamp;
  memberIds: string[]; // Members who contributed
}

export interface TeamStats {
  eventsParticipated: number;
  challengesWon: number;
  totalScore: number;
  averageEngagement: number;
  winRate: number;
}

export interface TeamMembership {
  teamId: string;
  teamName: string;
  role: TeamRole;
  joinedAt: Timestamp;
  isActive: boolean;
}

export enum TeamRole {
  CAPTAIN = 'captain',
  MEMBER = 'member',
  PENDING = 'pending'
}

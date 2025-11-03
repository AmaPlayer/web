import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe,
  increment
} from 'firebase/firestore';
import { db } from '@lib/firebase';

// API Error class for typed error responses
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Achievement category enum
export enum AchievementCategory {
  PARTICIPATION = 'participation',
  CONSISTENCY = 'consistency',
  SOCIAL = 'social',
  SKILL = 'skill',
  LEADERSHIP = 'leadership'
}

// Requirement type enum
export enum RequirementType {
  EVENTS_JOINED = 'events_joined',
  CONSECUTIVE_EVENTS = 'consecutive_events',
  REACTIONS_RECEIVED = 'reactions_received',
  CHALLENGES_COMPLETED = 'challenges_completed',
  MENTORSHIPS_COMPLETED = 'mentorships_completed',
  TEAM_WINS = 'team_wins',
  DAYS_ACTIVE = 'days_active'
}

// Achievement requirement interface
export interface AchievementRequirement {
  type: RequirementType;
  value: number;
  description: string;
}

// Achievement interface
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

// Athlete stats interface
export interface AthleteStats {
  eventsJoined: number;
  eventsCompleted: number;
  eventsWon: number;
  participationRate: number;
  totalReactions: number;
  reactionsReceived: number;
  commentsPosted: number;
  commentsReceived: number;
  totalAchievements: number;
  rareAchievements: number;
  achievementPoints: number;
  challengesCompleted: number;
  challengesWon: number;
  challengeWinRate: number;
  mentorshipsCompleted: number;
  menteesHelped: number;
  teamContributions: number;
  totalActiveTime: number;
  averageSessionTime: number;
  longestStreak: number;
  currentStreak: number;
  sportRanks: Record<string, number>;
}

// User action types for achievement checking
export interface UserAction {
  type: UserActionType;
  userId: string;
  eventId?: string;
  challengeId?: string;
  data?: any;
  timestamp: Date;
}

export enum UserActionType {
  EVENT_JOINED = 'event_joined',
  EVENT_COMPLETED = 'event_completed',
  REACTION_RECEIVED = 'reaction_received',
  CHALLENGE_COMPLETED = 'challenge_completed',
  MENTORSHIP_COMPLETED = 'mentorship_completed',
  TEAM_WIN = 'team_win',
  DAILY_LOGIN = 'daily_login',
  COMMENT_POSTED = 'comment_posted',
  PROFILE_UPDATED = 'profile_updated'
}

/**
 * Helper to convert Firestore document to Achievement
 */
function firestoreToAchievement(doc: DocumentSnapshot): Achievement {
  const data = doc.data();
  if (!data) {
    throw new APIError(404, 'Achievement not found');
  }

  return {
    ...data,
    id: doc.id,
    unlockedAt: data.unlockedAt,
  } as Achievement;
}

/**
 * Helper to convert Firestore document to AthleteStats
 */
function firestoreToStats(doc: DocumentSnapshot): AthleteStats {
  const data = doc.data();
  if (!data) {
    return getDefaultStats();
  }

  return data as AthleteStats;
}

/**
 * Get default statistics for new users
 */
function getDefaultStats(): AthleteStats {
  return {
    eventsJoined: 0,
    eventsCompleted: 0,
    eventsWon: 0,
    participationRate: 0,
    totalReactions: 0,
    reactionsReceived: 0,
    commentsPosted: 0,
    commentsReceived: 0,
    totalAchievements: 0,
    rareAchievements: 0,
    achievementPoints: 0,
    challengesCompleted: 0,
    challengesWon: 0,
    challengeWinRate: 0,
    mentorshipsCompleted: 0,
    menteesHelped: 0,
    teamContributions: 0,
    totalActiveTime: 0,
    averageSessionTime: 0,
    longestStreak: 0,
    currentStreak: 0,
    sportRanks: {}
  };
}

class AchievementEngine {
  private readonly ACHIEVEMENTS_COLLECTION = 'achievements';
  private readonly USER_STATS_COLLECTION = 'users';
  private predefinedAchievements: Achievement[] = [];

  constructor() {
    this.initializePredefinedAchievements();
  }

  /**
   * Initialize predefined achievements based on requirements
   */
  private initializePredefinedAchievements(): void {
    this.predefinedAchievements = [
      // Requirement 2.1: First Step achievement
      {
        id: 'first_step',
        name: 'First Step',
        description: 'Join your first event and start your athletic journey',
        iconUrl: '/icons/achievements/first-step.svg',
        rarity: 'common',
        points: 10,
        category: AchievementCategory.PARTICIPATION,
        requirements: [
          {
            type: RequirementType.EVENTS_JOINED,
            value: 1,
            description: 'Join 1 event'
          }
        ]
      },
      // Requirement 2.2: Streak Master achievement
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Participate in 5 consecutive events',
        iconUrl: '/icons/achievements/streak-master.svg',
        rarity: 'rare',
        points: 50,
        category: AchievementCategory.CONSISTENCY,
        requirements: [
          {
            type: RequirementType.CONSECUTIVE_EVENTS,
            value: 5,
            description: 'Participate in 5 consecutive events'
          }
        ]
      },
      // Requirement 2.3: Community Favorite achievement
      {
        id: 'community_favorite',
        name: 'Community Favorite',
        description: 'Receive 50 reactions on your event submissions',
        iconUrl: '/icons/achievements/community-favorite.svg',
        rarity: 'epic',
        points: 100,
        category: AchievementCategory.SOCIAL,
        requirements: [
          {
            type: RequirementType.REACTIONS_RECEIVED,
            value: 50,
            description: 'Receive 50 reactions'
          }
        ]
      },
      // Additional achievements for comprehensive system
      {
        id: 'challenge_champion',
        name: 'Challenge Champion',
        description: 'Complete 10 challenges successfully',
        iconUrl: '/icons/achievements/challenge-champion.svg',
        rarity: 'rare',
        points: 75,
        category: AchievementCategory.SKILL,
        requirements: [
          {
            type: RequirementType.CHALLENGES_COMPLETED,
            value: 10,
            description: 'Complete 10 challenges'
          }
        ]
      },
      {
        id: 'mentor_master',
        name: 'Mentor Master',
        description: 'Successfully complete 3 mentorship relationships',
        iconUrl: '/icons/achievements/mentor-master.svg',
        rarity: 'legendary',
        points: 200,
        category: AchievementCategory.LEADERSHIP,
        requirements: [
          {
            type: RequirementType.MENTORSHIPS_COMPLETED,
            value: 3,
            description: 'Complete 3 mentorships'
          }
        ]
      },
      {
        id: 'team_player',
        name: 'Team Player',
        description: 'Win 5 team-based competitions',
        iconUrl: '/icons/achievements/team-player.svg',
        rarity: 'epic',
        points: 150,
        category: AchievementCategory.LEADERSHIP,
        requirements: [
          {
            type: RequirementType.TEAM_WINS,
            value: 5,
            description: 'Win 5 team competitions'
          }
        ]
      },
      {
        id: 'dedicated_athlete',
        name: 'Dedicated Athlete',
        description: 'Stay active for 30 consecutive days',
        iconUrl: '/icons/achievements/dedicated-athlete.svg',
        rarity: 'rare',
        points: 80,
        category: AchievementCategory.CONSISTENCY,
        requirements: [
          {
            type: RequirementType.DAYS_ACTIVE,
            value: 30,
            description: 'Be active for 30 consecutive days'
          }
        ]
      }
    ];
  }

  /**
   * Get user statistics from Firestore
   */
  private async getUserStats(userId: string): Promise<AthleteStats> {
    try {
      const docRef = doc(db, this.USER_STATS_COLLECTION, userId, 'eventStats', 'stats');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return getDefaultStats();
      }

      return firestoreToStats(docSnap);
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return getDefaultStats();
    }
  }

  /**
   * Save user statistics to Firestore
   */
  private async saveUserStats(userId: string, stats: AthleteStats): Promise<void> {
    try {
      const docRef = doc(db, this.USER_STATS_COLLECTION, userId, 'eventStats', 'stats');
      await setDoc(docRef, stats, { merge: true });
    } catch (error) {
      console.error('Failed to save user stats:', error);
      throw new APIError(500, 'Failed to save user statistics', error);
    }
  }

  /**
   * Get user achievements from Firestore
   */
  private async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const q = query(
        collection(db, this.ACHIEVEMENTS_COLLECTION),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToAchievement(doc));
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }

  /**
   * Save user achievement to Firestore
   */
  private async saveUserAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      const achievementData = {
        ...achievement,
        userId,
        unlockedAt: serverTimestamp()
      };

      await setDoc(
        doc(db, this.ACHIEVEMENTS_COLLECTION, `${userId}_${achievement.id}`),
        achievementData
      );
    } catch (error) {
      console.error('Failed to save user achievement:', error);
      throw new APIError(500, 'Failed to save achievement', error);
    }
  }

  /**
   * Check if user meets achievement requirements
   */
  private checkAchievementRequirements(achievement: Achievement, stats: AthleteStats): boolean {
    return achievement.requirements.every(requirement => {
      switch (requirement.type) {
        case RequirementType.EVENTS_JOINED:
          return stats.eventsJoined >= requirement.value;
        case RequirementType.CONSECUTIVE_EVENTS:
          return stats.currentStreak >= requirement.value;
        case RequirementType.REACTIONS_RECEIVED:
          return stats.reactionsReceived >= requirement.value;
        case RequirementType.CHALLENGES_COMPLETED:
          return stats.challengesCompleted >= requirement.value;
        case RequirementType.MENTORSHIPS_COMPLETED:
          return stats.mentorshipsCompleted >= requirement.value;
        case RequirementType.TEAM_WINS:
          return stats.eventsWon >= requirement.value;
        case RequirementType.DAYS_ACTIVE:
          return stats.longestStreak >= requirement.value;
        default:
          return false;
      }
    });
  }

  /**
   * Update user statistics based on action
   */
  private async updateUserStats(userId: string, action: UserAction): Promise<AthleteStats> {
    const stats = await this.getUserStats(userId);

    switch (action.type) {
      case UserActionType.EVENT_JOINED:
        stats.eventsJoined += 1;
        stats.currentStreak += 1;
        stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
        break;
      case UserActionType.EVENT_COMPLETED:
        stats.eventsCompleted += 1;
        break;
      case UserActionType.REACTION_RECEIVED:
        stats.reactionsReceived += 1;
        break;
      case UserActionType.CHALLENGE_COMPLETED:
        stats.challengesCompleted += 1;
        break;
      case UserActionType.MENTORSHIP_COMPLETED:
        stats.mentorshipsCompleted += 1;
        break;
      case UserActionType.TEAM_WIN:
        stats.eventsWon += 1;
        break;
      case UserActionType.COMMENT_POSTED:
        stats.commentsPosted += 1;
        break;
    }

    // Update participation rate
    if (stats.eventsJoined > 0) {
      stats.participationRate = (stats.eventsCompleted / stats.eventsJoined) * 100;
    }

    // Update challenge win rate
    if (stats.challengesCompleted > 0) {
      stats.challengeWinRate = (stats.challengesWon / stats.challengesCompleted) * 100;
    }

    await this.saveUserStats(userId, stats);
    return stats;
  }

  /**
   * Calculate engagement score based on user statistics and achievements
   * Requirements: 2.5 - Engagement score calculation algorithm
   */
  calculateEngagementScore(stats: AthleteStats, achievements: Achievement[]): number {
    // Base score from participation
    let score = 0;

    // Participation metrics (40% of total score)
    score += stats.eventsJoined * 10;
    score += stats.eventsCompleted * 15;
    score += stats.eventsWon * 25;

    // Social engagement (25% of total score)
    score += stats.reactionsReceived * 2;
    score += stats.commentsPosted * 3;
    score += stats.commentsReceived * 2;

    // Achievement points (20% of total score)
    score += stats.achievementPoints;

    // Challenge performance (10% of total score)
    score += stats.challengesCompleted * 8;
    score += stats.challengesWon * 12;

    // Consistency bonus (5% of total score)
    score += stats.currentStreak * 5;
    score += stats.longestStreak * 2;

    // Rare achievement multiplier
    const rareAchievementMultiplier = 1 + (stats.rareAchievements * 0.1);
    score *= rareAchievementMultiplier;

    return Math.round(score);
  }

  /**
   * Check achievements triggered by user actions
   * Requirements: 2.1, 2.2, 2.3 - Achievement checking system
   */
  async checkAchievements(userId: string, action: UserAction): Promise<Achievement[]> {
    try {
      // Update user statistics based on action
      const updatedStats = await this.updateUserStats(userId, action);

      // Get current user achievements
      const currentAchievements = await this.getUserAchievements(userId);
      const currentAchievementIds = new Set(currentAchievements.map(a => a.id));

      // Check all predefined achievements
      const newAchievements: Achievement[] = [];

      for (const achievement of this.predefinedAchievements) {
        // Skip if user already has this achievement
        if (currentAchievementIds.has(achievement.id)) {
          continue;
        }

        // Check if user meets requirements
        if (this.checkAchievementRequirements(achievement, updatedStats)) {
          await this.saveUserAchievement(userId, achievement);
          newAchievements.push(achievement);
        }
      }

      // Update achievement-related stats
      if (newAchievements.length > 0) {
        const allAchievements = [...currentAchievements, ...newAchievements];
        updatedStats.totalAchievements = allAchievements.length;
        updatedStats.rareAchievements = allAchievements.filter(a => 
          a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary'
        ).length;
        updatedStats.achievementPoints = allAchievements.reduce((total, a) => total + a.points, 0);
        
        await this.saveUserStats(userId, updatedStats);
      }

      return newAchievements;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to check achievements:', error);
      throw new APIError(500, 'Failed to check achievements', error);
    }
  }

  /**
   * Award a specific badge to a user
   * Requirements: 2.5 - Badge awarding system
   */
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    try {
      const achievement = this.predefinedAchievements.find(a => a.id === badgeId);
      if (!achievement) {
        throw new APIError(404, 'Achievement not found');
      }

      const currentAchievements = await this.getUserAchievements(userId);
      const hasAchievement = currentAchievements.some(a => a.id === badgeId);

      if (hasAchievement) {
        throw new APIError(400, 'User already has this achievement');
      }

      await this.saveUserAchievement(userId, achievement);

      // Update user stats
      const stats = await this.getUserStats(userId);
      const allAchievements = [...currentAchievements, achievement];
      stats.totalAchievements = allAchievements.length;
      stats.rareAchievements = allAchievements.filter(a => 
        a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary'
      ).length;
      stats.achievementPoints = allAchievements.reduce((total, a) => total + a.points, 0);
      
      await this.saveUserStats(userId, stats);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to award badge:', error);
      throw new APIError(500, 'Failed to award badge', error);
    }
  }

  /**
   * Get all achievements for a user
   */
  async getUserAchievementsAsync(userId: string): Promise<Achievement[]> {
    try {
      return await this.getUserAchievements(userId);
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      throw new APIError(500, 'Failed to get user achievements', error);
    }
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return this.predefinedAchievements;
  }

  /**
   * Get user statistics
   */
  async getUserStatsAsync(userId: string): Promise<AthleteStats> {
    try {
      return await this.getUserStats(userId);
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      throw new APIError(500, 'Failed to get user statistics', error);
    }
  }

  /**
   * Get user's current engagement score
   */
  async getEngagementScore(userId: string): Promise<number> {
    try {
      const stats = await this.getUserStats(userId);
      const achievements = await this.getUserAchievements(userId);
      return this.calculateEngagementScore(stats, achievements);
    } catch (error) {
      console.error('Failed to calculate engagement score:', error);
      throw new APIError(500, 'Failed to calculate engagement score', error);
    }
  }

  /**
   * Subscribe to real-time user achievements updates
   */
  subscribeToUserAchievements(
    userId: string,
    callback: (achievements: Achievement[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.ACHIEVEMENTS_COLLECTION),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const achievements = snapshot.docs.map(doc => firestoreToAchievement(doc));
        callback(achievements);
      },
      (error) => {
        console.error('Error in achievements subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to real-time user stats updates
   */
  subscribeToUserStats(
    userId: string,
    callback: (stats: AthleteStats) => void
  ): Unsubscribe {
    const docRef = doc(db, this.USER_STATS_COLLECTION, userId, 'eventStats', 'stats');

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback(firestoreToStats(doc));
        } else {
          callback(getDefaultStats());
        }
      },
      (error) => {
        console.error('Error in stats subscription:', error);
      }
    );

    return unsubscribe;
  }
}

// Export singleton instance
export const achievementEngine = new AchievementEngine();
export default achievementEngine;

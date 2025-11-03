import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@lib/firebase';
import { achievementEngine, AthleteStats, Achievement } from './achievementEngine';
import {
  LeaderboardType,
  LeaderboardPeriod,
  RankChange,
  type LeaderboardEntry,
  type Leaderboard,
  type Badge
} from '../types/engagement.types';

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

// Leaderboard configuration
export interface LeaderboardConfig {
  maxEntries: number;
  updateInterval: number;
  cacheTimeout: number;
  enableRealTimeUpdates: boolean;
}

// User ranking data for calculations
export interface UserRankingData {
  userId: string;
  userName: string;
  userAvatar?: string;
  stats: AthleteStats;
  engagementScore: number;
  level: number;
  badges: Badge[];
}

/**
 * Helper to convert Firestore document to Leaderboard
 */
function firestoreToLeaderboard(doc: DocumentSnapshot): Leaderboard {
  const data = doc.data();
  if (!data) {
    throw new APIError(404, 'Leaderboard not found');
  }

  return {
    ...data,
    id: doc.id,
    lastUpdated: data.lastUpdated,
  } as Leaderboard;
}

class LeaderboardService {
  private readonly LEADERBOARDS_COLLECTION = 'leaderboards';
  private readonly USER_RANKINGS_COLLECTION = 'userRankings';
  private readonly RANKING_HISTORY_COLLECTION = 'rankingHistory';
  private readonly CONFIG_COLLECTION = 'leaderboardConfig';
  
  private config: LeaderboardConfig;
  private subscribers: Map<string, Set<(leaderboard: Leaderboard) => void>> = new Map();

  constructor() {
    this.config = {
      maxEntries: 100,
      updateInterval: 5 * 60 * 1000, // 5 minutes
      cacheTimeout: 10 * 60 * 1000, // 10 minutes
      enableRealTimeUpdates: true
    };
  }

  /**
   * Get leaderboard from Firestore
   */
  private async getStoredLeaderboard(key: string): Promise<Leaderboard | null> {
    try {
      const docRef = doc(db, this.LEADERBOARDS_COLLECTION, key);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const leaderboard = firestoreToLeaderboard(docSnap);

      // Check if cache is still valid
      const lastUpdated = leaderboard.lastUpdated.toDate();
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdated.getTime();

      if (timeDiff > this.config.cacheTimeout) {
        return null; // Cache expired
      }

      return leaderboard;
    } catch (error) {
      console.error('Failed to get stored leaderboard:', error);
      return null;
    }
  }

  /**
   * Save leaderboard to Firestore
   */
  private async saveLeaderboard(key: string, leaderboard: Leaderboard): Promise<void> {
    try {
      const docRef = doc(db, this.LEADERBOARDS_COLLECTION, key);

      // Filter out undefined values to prevent Firestore errors
      const dataToSave: any = {
        id: leaderboard.id,
        type: leaderboard.type,
        period: leaderboard.period,
        entries: leaderboard.entries,
        lastUpdated: serverTimestamp()
      };

      // Only include eventId and challengeId if they are defined
      if (leaderboard.eventId !== undefined) {
        dataToSave.eventId = leaderboard.eventId;
      }
      if (leaderboard.challengeId !== undefined) {
        dataToSave.challengeId = leaderboard.challengeId;
      }

      await setDoc(docRef, dataToSave);
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
      throw new APIError(500, 'Failed to save leaderboard', error);
    }
  }

  /**
   * Get user ranking data from Firestore
   */
  private async getUserRankingData(): Promise<Map<string, UserRankingData>> {
    try {
      const snapshot = await getDocs(collection(db, this.USER_RANKINGS_COLLECTION));
      
      const rankingMap = new Map<string, UserRankingData>();
      snapshot.docs.forEach(doc => {
        const data = doc.data() as UserRankingData;
        rankingMap.set(doc.id, data);
      });

      return rankingMap;
    } catch (error) {
      console.error('Failed to get user ranking data:', error);
      return new Map();
    }
  }

  /**
   * Save user ranking data to Firestore
   */
  private async saveUserRankingData(userId: string, data: UserRankingData): Promise<void> {
    try {
      const docRef = doc(db, this.USER_RANKINGS_COLLECTION, userId);
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Failed to save user ranking data:', error);
      throw new APIError(500, 'Failed to save user ranking data', error);
    }
  }

  /**
   * Get ranking history for change detection
   */
  private async getRankingHistory(leaderboardKey: string): Promise<Map<string, number>> {
    try {
      const docRef = doc(db, this.RANKING_HISTORY_COLLECTION, leaderboardKey);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return new Map();
      }

      const history = docSnap.data().rankings || {};
      const historyMap = new Map<string, number>();
      Object.entries(history).forEach(([userId, rank]) => {
        historyMap.set(userId, rank as number);
      });

      return historyMap;
    } catch (error) {
      console.error('Failed to get ranking history:', error);
      return new Map();
    }
  }

  /**
   * Save ranking history
   */
  private async saveRankingHistory(leaderboardKey: string, rankings: Map<string, number>): Promise<void> {
    try {
      const obj: Record<string, number> = {};
      rankings.forEach((rank, userId) => {
        obj[userId] = rank;
      });
      
      const docRef = doc(db, this.RANKING_HISTORY_COLLECTION, leaderboardKey);
      await setDoc(docRef, { rankings: obj });
    } catch (error) {
      console.error('Failed to save ranking history:', error);
    }
  }

  /**
   * Calculate score based on leaderboard type
   * Requirements: 4.1 - Multi-category leaderboard calculations
   */
  private calculateScore(type: LeaderboardType, userData: UserRankingData): number {
    const { stats, engagementScore } = userData;

    switch (type) {
      case LeaderboardType.ENGAGEMENT_SCORE:
        return engagementScore;

      case LeaderboardType.PARTICIPATION:
        return (stats.eventsCompleted * 2) + stats.eventsJoined + (stats.participationRate / 10);

      case LeaderboardType.ACHIEVEMENTS:
        return stats.achievementPoints + (stats.rareAchievements * 50);

      case LeaderboardType.CHALLENGE_WINS:
        return (stats.challengesWon * 10) + (stats.challengesCompleted * 2) + (stats.challengeWinRate / 5);

      case LeaderboardType.SOCIAL_IMPACT:
        return (
          stats.reactionsReceived * 2 +
          stats.commentsReceived * 3 +
          stats.mentorshipsCompleted * 15 +
          stats.menteesHelped * 10 +
          stats.teamContributions * 5
        );

      case LeaderboardType.TEAM_PERFORMANCE:
        return (stats.eventsWon * 15) + (stats.teamContributions * 8) + (stats.challengesWon * 5);

      default:
        return engagementScore;
    }
  }

  /**
   * Filter user data based on time period
   * Requirements: 4.3 - Weekly, monthly, and all-time leaderboard support
   */
  private filterByPeriod(userData: Map<string, UserRankingData>, period: LeaderboardPeriod): Map<string, UserRankingData> {
    // For this implementation, we return all data
    // In a real implementation, this would filter based on activity within the time period
    const filteredData = new Map<string, UserRankingData>();

    userData.forEach((data, userId) => {
      filteredData.set(userId, data);
    });

    return filteredData;
  }

  /**
   * Calculate rank changes compared to previous rankings
   */
  private calculateRankChanges(
    currentRankings: LeaderboardEntry[], 
    previousRankings: Map<string, number>
  ): LeaderboardEntry[] {
    return currentRankings.map(entry => {
      const previousRank = previousRankings.get(entry.userId);
      
      if (previousRank === undefined) {
        entry.change = RankChange.NEW;
      } else if (previousRank > entry.rank) {
        entry.change = RankChange.UP;
        entry.previousRank = previousRank;
      } else if (previousRank < entry.rank) {
        entry.change = RankChange.DOWN;
        entry.previousRank = previousRank;
      } else {
        entry.change = RankChange.SAME;
        entry.previousRank = previousRank;
      }

      return entry;
    });
  }

  /**
   * Generate leaderboard key for storage
   */
  private generateLeaderboardKey(
    type: LeaderboardType, 
    period: LeaderboardPeriod, 
    eventId?: string, 
    challengeId?: string
  ): string {
    const parts = [type.toString(), period.toString()];
    if (eventId) parts.push(`event_${eventId}`);
    if (challengeId) parts.push(`challenge_${challengeId}`);
    return parts.join('_');
  }

  /**
   * Generate leaderboard
   */
  private async generateLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    eventId?: string,
    challengeId?: string
  ): Promise<Leaderboard> {
    const key = this.generateLeaderboardKey(type, period, eventId, challengeId);

    // Get user data
    const userData = await this.getUserRankingData();
    const filteredData = this.filterByPeriod(userData, period);

    // Calculate scores and create entries
    const entries: LeaderboardEntry[] = [];
    filteredData.forEach((data, userId) => {
      const score = this.calculateScore(type, data);
      entries.push({
        userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        score,
        rank: 0, // Will be set after sorting
        change: RankChange.SAME,
        badges: data.badges,
        level: data.level
      });
    });

    // Sort by score (descending) and assign ranks
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Limit to max entries
    const limitedEntries = entries.slice(0, this.config.maxEntries);

    // Get previous rankings for change detection
    const previousRankings = await this.getRankingHistory(key);
    const entriesWithChanges = this.calculateRankChanges(limitedEntries, previousRankings);

    // Save current rankings for next comparison
    const currentRankings = new Map<string, number>();
    entriesWithChanges.forEach(entry => {
      currentRankings.set(entry.userId, entry.rank);
    });
    await this.saveRankingHistory(key, currentRankings);

    return {
      id: key,
      eventId,
      challengeId,
      type,
      period,
      entries: entriesWithChanges,
      lastUpdated: Timestamp.now()
    };
  }

  /**
   * Notify subscribers of leaderboard updates
   * Requirements: 4.3 - Real-time ranking updates
   */
  private notifySubscribers(leaderboardKey: string, leaderboard: Leaderboard): void {
    const subscribers = this.subscribers.get(leaderboardKey);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(leaderboard);
        } catch (error) {
          console.error('Error notifying leaderboard subscriber:', error);
        }
      });
    }
  }

  /**
   * Update user ranking data
   * Requirements: 4.3 - Real-time ranking updates
   */
  async updateUserRankingData(userId: string, userName: string, userAvatar?: string): Promise<void> {
    try {
      const stats = await achievementEngine.getUserStatsAsync(userId);
      const engagementScore = await achievementEngine.getEngagementScore(userId);
      const achievements = await achievementEngine.getUserAchievementsAsync(userId);

      // Calculate user level based on engagement score
      const level = Math.floor(engagementScore / 100) + 1;

      // Convert achievements to badges
      const badges: Badge[] = achievements.map((achievement, index) => ({
        id: achievement.id,
        achievementId: achievement.id,
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        rarity: achievement.rarity,
        earnedAt: achievement.unlockedAt || Timestamp.now(),
        displayOrder: index
      }));

      const userRankingData: UserRankingData = {
        userId,
        userName,
        userAvatar,
        stats,
        engagementScore,
        level,
        badges
      };

      await this.saveUserRankingData(userId, userRankingData);

      // Trigger leaderboard updates if real-time updates are enabled
      if (this.config.enableRealTimeUpdates) {
        await this.refreshCommonLeaderboards();
      }
    } catch (error) {
      console.error('Failed to update user ranking data:', error);
      throw new APIError(500, 'Failed to update user ranking data', error);
    }
  }

  /**
   * Get leaderboard for specific type and period
   * Requirements: 4.1, 4.3 - Multi-category leaderboard calculations with time periods
   */
  async getLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    eventId?: string,
    challengeId?: string
  ): Promise<Leaderboard> {
    try {
      const leaderboardKey = this.generateLeaderboardKey(type, period, eventId, challengeId);
      
      // Check cache first
      const cached = await this.getStoredLeaderboard(leaderboardKey);
      if (cached) {
        return cached;
      }

      // Generate new leaderboard
      const leaderboard = await this.generateLeaderboard(type, period, eventId, challengeId);

      // Cache the leaderboard
      await this.saveLeaderboard(leaderboardKey, leaderboard);

      // Notify subscribers
      this.notifySubscribers(leaderboardKey, leaderboard);

      return leaderboard;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to get leaderboard:', error);
      throw new APIError(500, 'Failed to get leaderboard', error);
    }
  }

  /**
   * Get multiple leaderboards at once
   */
  async getMultipleLeaderboards(requests: Array<{
    type: LeaderboardType;
    period: LeaderboardPeriod;
    eventId?: string;
    challengeId?: string;
  }>): Promise<Leaderboard[]> {
    try {
      const leaderboards = await Promise.all(
        requests.map(req => this.getLeaderboard(req.type, req.period, req.eventId, req.challengeId))
      );
      return leaderboards;
    } catch (error) {
      console.error('Failed to get multiple leaderboards:', error);
      throw new APIError(500, 'Failed to get multiple leaderboards', error);
    }
  }

  /**
   * Get user's position in specific leaderboard
   */
  async getUserPosition(
    userId: string,
    type: LeaderboardType,
    period: LeaderboardPeriod,
    eventId?: string,
    challengeId?: string
  ): Promise<LeaderboardEntry | null> {
    try {
      const leaderboard = await this.getLeaderboard(type, period, eventId, challengeId);
      return leaderboard.entries.find(entry => entry.userId === userId) || null;
    } catch (error) {
      console.error('Failed to get user position:', error);
      throw new APIError(500, 'Failed to get user position', error);
    }
  }

  /**
   * Get user's positions across all leaderboard types
   */
  async getUserPositions(userId: string, period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME): Promise<{
    type: LeaderboardType;
    position: LeaderboardEntry | null;
  }[]> {
    try {
      const types = Object.values(LeaderboardType);
      const positions = await Promise.all(
        types.map(async type => ({
          type,
          position: await this.getUserPosition(userId, type, period)
        }))
      );
      return positions;
    } catch (error) {
      console.error('Failed to get user positions:', error);
      throw new APIError(500, 'Failed to get user positions', error);
    }
  }

  /**
   * Subscribe to leaderboard updates
   * Requirements: 4.3 - Real-time ranking updates
   */
  subscribeToLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    callback: (leaderboard: Leaderboard) => void,
    eventId?: string,
    challengeId?: string
  ): Unsubscribe {
    const leaderboardKey = this.generateLeaderboardKey(type, period, eventId, challengeId);
    
    if (!this.subscribers.has(leaderboardKey)) {
      this.subscribers.set(leaderboardKey, new Set());
    }
    
    this.subscribers.get(leaderboardKey)!.add(callback);

    // Set up Firestore real-time listener
    const docRef = doc(db, this.LEADERBOARDS_COLLECTION, leaderboardKey);
    const firestoreUnsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const leaderboard = firestoreToLeaderboard(doc);
          callback(leaderboard);
        }
      },
      (error) => {
        console.error('Error in leaderboard subscription:', error);
      }
    );

    // Return combined unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(leaderboardKey);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(leaderboardKey);
        }
      }
      firestoreUnsubscribe();
    };
  }

  /**
   * Refresh common leaderboards
   */
  private async refreshCommonLeaderboards(): Promise<void> {
    try {
      const commonLeaderboards = [
        { type: LeaderboardType.ENGAGEMENT_SCORE, period: LeaderboardPeriod.ALL_TIME },
        { type: LeaderboardType.ENGAGEMENT_SCORE, period: LeaderboardPeriod.WEEKLY },
        { type: LeaderboardType.PARTICIPATION, period: LeaderboardPeriod.ALL_TIME },
        { type: LeaderboardType.ACHIEVEMENTS, period: LeaderboardPeriod.ALL_TIME }
      ];

      await Promise.all(
        commonLeaderboards.map(async lb => {
          const leaderboard = await this.generateLeaderboard(lb.type, lb.period);
          const key = this.generateLeaderboardKey(lb.type, lb.period);
          await this.saveLeaderboard(key, leaderboard);
          this.notifySubscribers(key, leaderboard);
        })
      );
    } catch (error) {
      console.error('Failed to refresh common leaderboards:', error);
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(
    type: LeaderboardType,
    period: LeaderboardPeriod
  ): Promise<{
    totalParticipants: number;
    averageScore: number;
    topScore: number;
    scoreDistribution: { range: string; count: number }[];
  }> {
    try {
      const leaderboard = await this.getLeaderboard(type, period);
      const entries = leaderboard.entries;

      if (entries.length === 0) {
        return {
          totalParticipants: 0,
          averageScore: 0,
          topScore: 0,
          scoreDistribution: []
        };
      }

      const scores = entries.map(e => e.score);
      const totalParticipants = entries.length;
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalParticipants;
      const topScore = Math.max(...scores);

      // Create score distribution
      const maxScore = topScore;
      const ranges = 5;
      const rangeSize = Math.ceil(maxScore / ranges);
      const scoreDistribution = [];

      for (let i = 0; i < ranges; i++) {
        const min = i * rangeSize;
        const max = (i + 1) * rangeSize;
        const count = scores.filter(score => score >= min && score < max).length;
        
        scoreDistribution.push({
          range: `${min}-${max - 1}`,
          count
        });
      }

      return {
        totalParticipants,
        averageScore: Math.round(averageScore),
        topScore,
        scoreDistribution
      };
    } catch (error) {
      console.error('Failed to get leaderboard statistics:', error);
      throw new APIError(500, 'Failed to get leaderboard statistics', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LeaderboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();
export default leaderboardService;

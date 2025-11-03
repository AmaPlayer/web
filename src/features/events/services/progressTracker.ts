import { Timestamp } from 'firebase/firestore';
import { 
  AthleteStats, 
  ProgressEntry, 
  ProgressMetric, 
  StreakInfo, 
  StreakType 
} from '@features/events/types/user.types';
import { UserAction, UserActionType } from '@features/events/services/achievementEngine';

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

// Milestone definitions
export interface Milestone {
  id: string;
  name: string;
  description: string;
  metric: ProgressMetric;
  threshold: number;
  category: MilestoneCategory;
  reward?: {
    points: number;
    badge?: string;
  };
}

export enum MilestoneCategory {
  PARTICIPATION = 'participation',
  ENGAGEMENT = 'engagement',
  ACHIEVEMENT = 'achievement',
  SOCIAL = 'social',
  CONSISTENCY = 'consistency'
}

// Progress tracking configuration
export interface ProgressConfig {
  trackingEnabled: boolean;
  retentionDays: number;
  milestoneCheckInterval: number;
  streakResetHours: number;
}

// LocalStorage keys
const PROGRESS_STORAGE_KEY = 'user_progress_data';
const STREAKS_STORAGE_KEY = 'user_streaks_data';
const MILESTONES_STORAGE_KEY = 'user_milestones_data';
const PROGRESS_CONFIG_KEY = 'progress_config';

class ProgressTracker {
  private config: ProgressConfig;
  private predefinedMilestones: Milestone[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.initializeStorage();
    this.initializePredefinedMilestones();
  }

  /**
   * Load configuration from storage or use defaults
   */
  private loadConfig(): ProgressConfig {
    const stored = localStorage.getItem(PROGRESS_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const defaultConfig: ProgressConfig = {
      trackingEnabled: true,
      retentionDays: 365,
      milestoneCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
      streakResetHours: 48 // 48 hours to maintain streak
    };

    localStorage.setItem(PROGRESS_CONFIG_KEY, JSON.stringify(defaultConfig));
    return defaultConfig;
  }

  /**
   * Initialize localStorage with default data
   */
  private initializeStorage(): void {
    if (!localStorage.getItem(PROGRESS_STORAGE_KEY)) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(STREAKS_STORAGE_KEY)) {
      localStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(MILESTONES_STORAGE_KEY)) {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify({}));
    }
  }

  /**
   * Initialize predefined milestones
   * Requirements: 8.1, 8.2, 8.3 - Progress tracking and milestone detection
   */
  private initializePredefinedMilestones(): void {
    this.predefinedMilestones = [
      // Participation milestones
      {
        id: 'first_event',
        name: 'First Event',
        description: 'Join your first event',
        metric: ProgressMetric.PARTICIPATION_RATE,
        threshold: 1,
        category: MilestoneCategory.PARTICIPATION,
        reward: { points: 10, badge: 'first_step' }
      },
      {
        id: 'event_veteran',
        name: 'Event Veteran',
        description: 'Join 10 events',
        metric: ProgressMetric.PARTICIPATION_RATE,
        threshold: 10,
        category: MilestoneCategory.PARTICIPATION,
        reward: { points: 50 }
      },
      {
        id: 'event_master',
        name: 'Event Master',
        description: 'Join 50 events',
        metric: ProgressMetric.PARTICIPATION_RATE,
        threshold: 50,
        category: MilestoneCategory.PARTICIPATION,
        reward: { points: 200 }
      },

      // Engagement milestones
      {
        id: 'engagement_rookie',
        name: 'Engagement Rookie',
        description: 'Reach 100 engagement score',
        metric: ProgressMetric.ENGAGEMENT_SCORE,
        threshold: 100,
        category: MilestoneCategory.ENGAGEMENT,
        reward: { points: 25 }
      },
      {
        id: 'engagement_pro',
        name: 'Engagement Pro',
        description: 'Reach 500 engagement score',
        metric: ProgressMetric.ENGAGEMENT_SCORE,
        threshold: 500,
        category: MilestoneCategory.ENGAGEMENT,
        reward: { points: 75 }
      },
      {
        id: 'engagement_legend',
        name: 'Engagement Legend',
        description: 'Reach 1000 engagement score',
        metric: ProgressMetric.ENGAGEMENT_SCORE,
        threshold: 1000,
        category: MilestoneCategory.ENGAGEMENT,
        reward: { points: 150 }
      },

      // Achievement milestones
      {
        id: 'achievement_collector',
        name: 'Achievement Collector',
        description: 'Earn 5 achievements',
        metric: ProgressMetric.ACHIEVEMENTS,
        threshold: 5,
        category: MilestoneCategory.ACHIEVEMENT,
        reward: { points: 40 }
      },
      {
        id: 'achievement_hunter',
        name: 'Achievement Hunter',
        description: 'Earn 15 achievements',
        metric: ProgressMetric.ACHIEVEMENTS,
        threshold: 15,
        category: MilestoneCategory.ACHIEVEMENT,
        reward: { points: 100 }
      },

      // Social milestones
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Reach 100 social impact score',
        metric: ProgressMetric.SOCIAL_IMPACT,
        threshold: 100,
        category: MilestoneCategory.SOCIAL,
        reward: { points: 60 }
      },

      // Consistency milestones
      {
        id: 'consistent_performer',
        name: 'Consistent Performer',
        description: 'Maintain a 7-day streak',
        metric: ProgressMetric.PARTICIPATION_RATE,
        threshold: 7,
        category: MilestoneCategory.CONSISTENCY,
        reward: { points: 35, badge: 'streak_master' }
      }
    ];
  }

  /**
   * Get user progress entries from storage
   */
  private getUserProgress(userId: string): ProgressEntry[] {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
    return allProgress[userId] || [];
  }

  /**
   * Save user progress entries to storage
   */
  private saveUserProgress(userId: string, progress: ProgressEntry[]): void {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
    allProgress[userId] = progress;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
  }

  /**
   * Get user streaks from storage
   */
  private getUserStreaks(userId: string): StreakInfo[] {
    const allStreaks = JSON.parse(localStorage.getItem(STREAKS_STORAGE_KEY) || '{}');
    return allStreaks[userId] || this.getDefaultStreaks();
  }

  /**
   * Save user streaks to storage
   */
  private saveUserStreaks(userId: string, streaks: StreakInfo[]): void {
    const allStreaks = JSON.parse(localStorage.getItem(STREAKS_STORAGE_KEY) || '{}');
    allStreaks[userId] = streaks;
    localStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify(allStreaks));
  }

  /**
   * Get default streak information for new users
   */
  private getDefaultStreaks(): StreakInfo[] {
    return [
      {
        type: StreakType.DAILY_LOGIN,
        current: 0,
        longest: 0,
        lastUpdated: Timestamp.now(),
        isActive: false
      },
      {
        type: StreakType.EVENT_PARTICIPATION,
        current: 0,
        longest: 0,
        lastUpdated: Timestamp.now(),
        isActive: false
      },
      {
        type: StreakType.CHALLENGE_COMPLETION,
        current: 0,
        longest: 0,
        lastUpdated: Timestamp.now(),
        isActive: false
      },
      {
        type: StreakType.SOCIAL_INTERACTION,
        current: 0,
        longest: 0,
        lastUpdated: Timestamp.now(),
        isActive: false
      }
    ];
  }

  /**
   * Get user milestones from storage
   */
  private getUserMilestones(userId: string): string[] {
    const allMilestones = JSON.parse(localStorage.getItem(MILESTONES_STORAGE_KEY) || '{}');
    return allMilestones[userId] || [];
  }

  /**
   * Save user milestones to storage
   */
  private saveUserMilestones(userId: string, milestones: string[]): void {
    const allMilestones = JSON.parse(localStorage.getItem(MILESTONES_STORAGE_KEY) || '{}');
    allMilestones[userId] = milestones;
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(allMilestones));
  }

  /**
   * Calculate social impact score based on user activities
   */
  private calculateSocialImpact(stats: AthleteStats): number {
    return (
      stats.reactionsReceived * 2 +
      stats.commentsReceived * 3 +
      stats.mentorshipsCompleted * 10 +
      stats.menteesHelped * 8 +
      stats.teamContributions * 5
    );
  }

  /**
   * Update streak information based on user action
   * Requirements: 2.2 - Streak counting implementation
   */
  private updateStreaks(userId: string, action: UserAction): StreakInfo[] {
    const streaks = this.getUserStreaks(userId);
    const now = Timestamp.now();

    streaks.forEach(streak => {
      const hoursSinceLastUpdate = (now.toMillis() - streak.lastUpdated.toMillis()) / (1000 * 60 * 60);
      
      // Check if streak should be reset
      if (hoursSinceLastUpdate > this.config.streakResetHours) {
        if (streak.isActive) {
          streak.current = 0;
          streak.isActive = false;
        }
      }

      // Update streak based on action type
      let shouldIncrement = false;

      switch (streak.type) {
        case StreakType.DAILY_LOGIN:
          shouldIncrement = action.type === UserActionType.DAILY_LOGIN;
          break;
        case StreakType.EVENT_PARTICIPATION:
          shouldIncrement = action.type === UserActionType.EVENT_JOINED || 
                           action.type === UserActionType.EVENT_COMPLETED;
          break;
        case StreakType.CHALLENGE_COMPLETION:
          shouldIncrement = action.type === UserActionType.CHALLENGE_COMPLETED;
          break;
        case StreakType.SOCIAL_INTERACTION:
          shouldIncrement = action.type === UserActionType.REACTION_RECEIVED ||
                           action.type === UserActionType.COMMENT_POSTED;
          break;
      }

      if (shouldIncrement) {
        // Only increment if it's been at least 20 hours since last update (to prevent gaming)
        if (hoursSinceLastUpdate >= 20 || !streak.isActive) {
          streak.current += 1;
          streak.longest = Math.max(streak.longest, streak.current);
          streak.isActive = true;
          streak.lastUpdated = now;
        }
      }
    });

    this.saveUserStreaks(userId, streaks);
    return streaks;
  }

  /**
   * Record progress entry for user
   * Requirements: 8.1, 8.2 - Progress monitoring and tracking
   */
  async recordProgress(
    userId: string, 
    metric: ProgressMetric, 
    value: number, 
    context?: string
  ): Promise<void> {
    try {
      if (!this.config.trackingEnabled) return;

      const progress = this.getUserProgress(userId);
      const now = Timestamp.now();

      // Get previous value for change calculation
      const previousEntry = progress
        .filter(p => p.metric === metric)
        .sort((a, b) => b.date.toMillis() - a.date.toMillis())[0];

      const previousValue = previousEntry ? previousEntry.value : 0;
      const change = value - previousValue;

      const newEntry: ProgressEntry = {
        date: now,
        metric,
        value,
        change,
        context
      };

      progress.push(newEntry);

      // Clean up old entries based on retention policy
      const cutoffDate = Timestamp.fromMillis(now.toMillis() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
      const filteredProgress = progress.filter(p => p.date.toMillis() >= cutoffDate.toMillis());

      this.saveUserProgress(userId, filteredProgress);
    } catch (error) {
      throw new APIError(500, 'Failed to record progress', error);
    }
  }

  /**
   * Track user activity and update all relevant metrics
   * Requirements: 8.1 - User activity monitoring
   */
  async trackActivity(userId: string, action: UserAction, stats: AthleteStats): Promise<{
    streaksUpdated: StreakInfo[];
    milestonesReached: Milestone[];
  }> {
    try {
      // Update streaks
      const updatedStreaks = this.updateStreaks(userId, action);

      // Record progress for relevant metrics
      await this.recordProgress(userId, ProgressMetric.ENGAGEMENT_SCORE, stats.achievementPoints, 'Activity tracking');
      await this.recordProgress(userId, ProgressMetric.PARTICIPATION_RATE, stats.eventsJoined, 'Activity tracking');
      await this.recordProgress(userId, ProgressMetric.ACHIEVEMENTS, stats.totalAchievements, 'Activity tracking');
      await this.recordProgress(userId, ProgressMetric.SOCIAL_IMPACT, this.calculateSocialImpact(stats), 'Activity tracking');

      // Check for new milestones
      const milestonesReached = await this.checkMilestones(userId, stats);

      return {
        streaksUpdated: updatedStreaks,
        milestonesReached
      };
    } catch (error) {
      throw new APIError(500, 'Failed to track activity', error);
    }
  }

  /**
   * Check for milestone achievements
   * Requirements: 8.3 - Milestone detection
   */
  async checkMilestones(userId: string, stats: AthleteStats): Promise<Milestone[]> {
    try {
      const achievedMilestones = this.getUserMilestones(userId);
      const newMilestones: Milestone[] = [];

      for (const milestone of this.predefinedMilestones) {
        // Skip if already achieved
        if (achievedMilestones.includes(milestone.id)) {
          continue;
        }

        let currentValue = 0;

        // Get current value based on metric
        switch (milestone.metric) {
          case ProgressMetric.ENGAGEMENT_SCORE:
            currentValue = stats.achievementPoints;
            break;
          case ProgressMetric.PARTICIPATION_RATE:
            currentValue = stats.eventsJoined;
            break;
          case ProgressMetric.ACHIEVEMENTS:
            currentValue = stats.totalAchievements;
            break;
          case ProgressMetric.SOCIAL_IMPACT:
            currentValue = this.calculateSocialImpact(stats);
            break;
          case ProgressMetric.LEVEL:
            // For consistency milestones, check streak length
            if (milestone.category === MilestoneCategory.CONSISTENCY) {
              const streaks = this.getUserStreaks(userId);
              const eventStreak = streaks.find(s => s.type === StreakType.EVENT_PARTICIPATION);
              currentValue = eventStreak ? eventStreak.current : 0;
            }
            break;
        }

        // Check if milestone threshold is reached
        if (currentValue >= milestone.threshold) {
          newMilestones.push(milestone);
          achievedMilestones.push(milestone.id);
        }
      }

      // Save updated milestones
      if (newMilestones.length > 0) {
        this.saveUserMilestones(userId, achievedMilestones);
      }

      return newMilestones;
    } catch (error) {
      throw new APIError(500, 'Failed to check milestones', error);
    }
  }

  /**
   * Get user progress history for a specific metric
   */
  async getProgressHistory(
    userId: string, 
    metric: ProgressMetric, 
    days: number = 30
  ): Promise<ProgressEntry[]> {
    try {
      const progress = this.getUserProgress(userId);
      const cutoffDate = Timestamp.fromMillis(Date.now() - (days * 24 * 60 * 60 * 1000));

      return progress
        .filter(p => p.metric === metric && p.date.toMillis() >= cutoffDate.toMillis())
        .sort((a, b) => a.date.toMillis() - b.date.toMillis());
    } catch (error) {
      throw new APIError(500, 'Failed to get progress history', error);
    }
  }

  /**
   * Get user streak information
   */
  async getUserStreaksAsync(userId: string): Promise<StreakInfo[]> {
    try {
      return this.getUserStreaks(userId);
    } catch (error) {
      throw new APIError(500, 'Failed to get user streaks', error);
    }
  }

  /**
   * Get achieved milestones for user
   */
  async getAchievedMilestones(userId: string): Promise<Milestone[]> {
    try {
      const achievedIds = this.getUserMilestones(userId);
      return this.predefinedMilestones.filter(m => achievedIds.includes(m.id));
    } catch (error) {
      throw new APIError(500, 'Failed to get achieved milestones', error);
    }
  }

  /**
   * Get all available milestones
   */
  async getAllMilestones(): Promise<Milestone[]> {
    try {
      return this.predefinedMilestones;
    } catch (error) {
      throw new APIError(500, 'Failed to get all milestones', error);
    }
  }

  /**
   * Get progress summary for user
   */
  async getProgressSummary(userId: string): Promise<{
    streaks: StreakInfo[];
    recentProgress: ProgressEntry[];
    achievedMilestones: Milestone[];
    nextMilestones: Milestone[];
  }> {
    try {
      const streaks = await this.getUserStreaksAsync(userId);
      const recentProgress = await this.getProgressHistory(userId, ProgressMetric.ENGAGEMENT_SCORE, 7);
      const achievedMilestones = await this.getAchievedMilestones(userId);
      
      // Get next milestones (not yet achieved)
      const achievedIds = this.getUserMilestones(userId);
      const nextMilestones = this.predefinedMilestones
        .filter(m => !achievedIds.includes(m.id))
        .slice(0, 5); // Show next 5 milestones

      return {
        streaks,
        recentProgress,
        achievedMilestones,
        nextMilestones
      };
    } catch (error) {
      throw new APIError(500, 'Failed to get progress summary', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ProgressConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(PROGRESS_CONFIG_KEY, JSON.stringify(this.config));
  }

  /**
   * Utility method to clear all progress data (for testing)
   */
  clearAllProgressData(): void {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(STREAKS_STORAGE_KEY);
    localStorage.removeItem(MILESTONES_STORAGE_KEY);
    this.initializeStorage();
  }

  /**
   * Utility method to seed sample progress data (for testing)
   */
  async seedSampleProgressData(userId: string = 'test-user'): Promise<void> {
    // Create sample progress entries
    const now = Timestamp.now();
    const sampleProgress: ProgressEntry[] = [];

    // Generate 30 days of sample data
    for (let i = 29; i >= 0; i--) {
      const date = Timestamp.fromMillis(now.toMillis() - (i * 24 * 60 * 60 * 1000));
      
      sampleProgress.push({
        date,
        metric: ProgressMetric.ENGAGEMENT_SCORE,
        value: 50 + (i * 5) + Math.floor(Math.random() * 20),
        change: Math.floor(Math.random() * 10) - 5,
        context: 'Daily activity'
      });

      sampleProgress.push({
        date,
        metric: ProgressMetric.PARTICIPATION_RATE,
        value: Math.floor(i / 3) + Math.floor(Math.random() * 2),
        change: Math.floor(Math.random() * 2),
        context: 'Event participation'
      });
    }

    this.saveUserProgress(userId, sampleProgress);

    // Create sample streaks
    const sampleStreaks: StreakInfo[] = [
      {
        type: StreakType.DAILY_LOGIN,
        current: 7,
        longest: 15,
        lastUpdated: Timestamp.now(),
        isActive: true
      },
      {
        type: StreakType.EVENT_PARTICIPATION,
        current: 3,
        longest: 8,
        lastUpdated: Timestamp.now(),
        isActive: true
      },
      {
        type: StreakType.CHALLENGE_COMPLETION,
        current: 2,
        longest: 5,
        lastUpdated: Timestamp.now(),
        isActive: true
      },
      {
        type: StreakType.SOCIAL_INTERACTION,
        current: 5,
        longest: 12,
        lastUpdated: Timestamp.now(),
        isActive: true
      }
    ];

    this.saveUserStreaks(userId, sampleStreaks);

    // Award some sample milestones
    const sampleMilestones = ['first_event', 'engagement_rookie', 'achievement_collector'];
    this.saveUserMilestones(userId, sampleMilestones);
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker();
export default progressTracker;
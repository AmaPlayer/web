import { Timestamp } from 'firebase/firestore';
import { 
  AthleteStats, 
  ProgressEntry, 
  ProgressMetric, 
  StreakInfo, 
  Goal, 
  UserInsights,
  PerformanceTrend,
  EngagementPattern,
  TimeSlot,
  NetworkMetric
} from '@features/events/types/user.types';
import { achievementEngine } from '@features/events/services/achievementEngine';
import { progressTracker } from '@features/events/services/progressTracker';
import { leaderboardService } from '@features/events/services/leaderboardService';

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

// Statistics configuration
export interface StatisticsConfig {
  trackingEnabled: boolean;
  retentionDays: number;
  insightGenerationInterval: number; // in milliseconds
  trendAnalysisPeriod: number; // in days
}

// Chart data structures
export interface ChartDataPoint {
  date: Date;
  value: number;
  label?: string;
  category?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

// Goal tracking
export interface GoalProgress {
  goal: Goal;
  progress: number; // percentage
  currentValue: number;
  targetValue: number;
  daysRemaining?: number;
  onTrack: boolean;
  projectedCompletion?: Timestamp;
}

// LocalStorage keys
const STATISTICS_STORAGE_KEY = 'user_statistics_data';
const GOALS_STORAGE_KEY = 'user_goals_data';
const INSIGHTS_STORAGE_KEY = 'user_insights_data';
const STATISTICS_CONFIG_KEY = 'statistics_config';

class StatisticsService {
  private config: StatisticsConfig;

  constructor() {
    this.config = this.loadConfig();
    this.initializeStorage();
  }

  /**
   * Load configuration from storage or use defaults
   */
  private loadConfig(): StatisticsConfig {
    const stored = localStorage.getItem(STATISTICS_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const defaultConfig: StatisticsConfig = {
      trackingEnabled: true,
      retentionDays: 365,
      insightGenerationInterval: 24 * 60 * 60 * 1000, // 24 hours
      trendAnalysisPeriod: 30 // 30 days
    };

    localStorage.setItem(STATISTICS_CONFIG_KEY, JSON.stringify(defaultConfig));
    return defaultConfig;
  }

  /**
   * Initialize localStorage with default data
   */
  private initializeStorage(): void {
    if (!localStorage.getItem(STATISTICS_STORAGE_KEY)) {
      localStorage.setItem(STATISTICS_STORAGE_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(GOALS_STORAGE_KEY)) {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(INSIGHTS_STORAGE_KEY)) {
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify({}));
    }
  }

  /**
   * Get comprehensive user statistics
   * Requirements: 8.1 - Comprehensive user statistics tracking
   */
  async getUserStatistics(userId: string): Promise<AthleteStats> {
    try {
      return await achievementEngine.getUserStatsAsync(userId);
    } catch (error) {
      throw new APIError(500, 'Failed to get user statistics', error);
    }
  }

  /**
   * Get progress chart data for specific metrics
   * Requirements: 8.2 - Progress charts and trend visualization
   */
  async getProgressChartData(
    userId: string, 
    metrics: ProgressMetric[], 
    days: number = 30
  ): Promise<{ [key in ProgressMetric]?: ChartSeries }> {
    try {
      const chartData: { [key in ProgressMetric]?: ChartSeries } = {};

      for (const metric of metrics) {
        const progressHistory = await progressTracker.getProgressHistory(userId, metric, days);
        
        const data: ChartDataPoint[] = progressHistory.map(entry => ({
          date: entry.date.toDate(),
          value: entry.value,
          label: entry.context
        }));

        // Fill in missing days with interpolated values
        const filledData = this.fillMissingDays(data, days);

        chartData[metric] = {
          name: this.getMetricDisplayName(metric),
          data: filledData,
          color: this.getMetricColor(metric),
          type: 'line'
        };
      }

      return chartData;
    } catch (error) {
      throw new APIError(500, 'Failed to get progress chart data', error);
    }
  }

  /**
   * Fill missing days in chart data with interpolated values
   */
  private fillMissingDays(data: ChartDataPoint[], days: number): ChartDataPoint[] {
    if (data.length === 0) return [];

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const filledData: ChartDataPoint[] = [];

    // Create a map of existing data points
    const dataMap = new Map<string, ChartDataPoint>();
    data.forEach(point => {
      const dateKey = point.date.toISOString().split('T')[0];
      dataMap.set(dateKey, point);
    });

    // Fill in all days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const existingPoint = dataMap.get(dateKey);

      if (existingPoint) {
        filledData.push(existingPoint);
      } else {
        // Interpolate value from nearest points
        const interpolatedValue = this.interpolateValue(filledData, new Date(d));
        filledData.push({
          date: new Date(d),
          value: interpolatedValue
        });
      }
    }

    return filledData;
  }

  /**
   * Interpolate missing values
   */
  private interpolateValue(existingData: ChartDataPoint[], targetDate: Date): number {
    if (existingData.length === 0) return 0;
    
    const lastPoint = existingData[existingData.length - 1];
    return lastPoint ? lastPoint.value : 0;
  }

  /**
   * Get display name for progress metrics
   */
  private getMetricDisplayName(metric: ProgressMetric): string {
    const names = {
      [ProgressMetric.ENGAGEMENT_SCORE]: 'Engagement Score',
      [ProgressMetric.LEVEL]: 'Level',
      [ProgressMetric.ACHIEVEMENTS]: 'Achievements',
      [ProgressMetric.PARTICIPATION_RATE]: 'Participation Rate',
      [ProgressMetric.SKILL_RATING]: 'Skill Rating',
      [ProgressMetric.SOCIAL_IMPACT]: 'Social Impact'
    };
    return names[metric] || metric;
  }

  /**
   * Get color for progress metrics
   */
  private getMetricColor(metric: ProgressMetric): string {
    const colors = {
      [ProgressMetric.ENGAGEMENT_SCORE]: '#3b82f6',
      [ProgressMetric.LEVEL]: '#10b981',
      [ProgressMetric.ACHIEVEMENTS]: '#f59e0b',
      [ProgressMetric.PARTICIPATION_RATE]: '#8b5cf6',
      [ProgressMetric.SKILL_RATING]: '#ef4444',
      [ProgressMetric.SOCIAL_IMPACT]: '#06b6d4'
    };
    return colors[metric] || '#6b7280';
  }

  /**
   * Get user goals and their progress
   * Requirements: 8.3 - Goal setting and progress monitoring
   */
  async getUserGoals(userId: string): Promise<GoalProgress[]> {
    try {
      const allGoals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) || '{}');
      const userGoals: Goal[] = allGoals[userId] || [];
      const stats = await this.getUserStatistics(userId);

      const goalProgress: GoalProgress[] = userGoals.map(goal => {
        const currentValue = this.getCurrentValueForGoal(goal, stats);
        const progress = Math.min((currentValue / goal.targetValue) * 100, 100);
        
        let daysRemaining: number | undefined;
        let projectedCompletion: Timestamp | undefined;
        
        if (goal.deadline) {
          const now = Timestamp.now();
          daysRemaining = Math.max(0, Math.ceil((goal.deadline.toMillis() - now.toMillis()) / (1000 * 60 * 60 * 24)));
          
          // Simple projection based on current progress rate
          if (progress > 0 && progress < 100) {
            const daysElapsed = 30; // Assume 30 days since goal creation
            const progressRate = progress / daysElapsed;
            const daysToComplete = (100 - progress) / progressRate;
            projectedCompletion = Timestamp.fromMillis(now.toMillis() + (daysToComplete * 24 * 60 * 60 * 1000));
          }
        }

        const onTrack = !goal.deadline || !projectedCompletion || projectedCompletion.toMillis() <= goal.deadline.toMillis();

        return {
          goal,
          progress,
          currentValue,
          targetValue: goal.targetValue,
          daysRemaining,
          onTrack,
          projectedCompletion
        };
      });

      return goalProgress;
    } catch (error) {
      throw new APIError(500, 'Failed to get user goals', error);
    }
  }

  /**
   * Get current value for a specific goal
   */
  private getCurrentValueForGoal(goal: Goal, stats: AthleteStats): number {
    switch (goal.category) {
      case 'participation':
        return stats.eventsJoined;
      case 'achievement':
        return stats.totalAchievements;
      case 'social':
        return stats.reactionsReceived + stats.commentsReceived;
      case 'skill':
        return stats.challengesWon;
      default:
        return 0;
    }
  }

  /**
   * Create a new goal for user
   * Requirements: 8.3 - Goal setting implementation
   */
  async createGoal(userId: string, goal: Omit<Goal, 'id'>): Promise<Goal> {
    try {
      const newGoal: Goal = {
        ...goal,
        id: `goal_${userId}_${Date.now()}`
      };

      const allGoals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) || '{}');
      const userGoals = allGoals[userId] || [];
      userGoals.push(newGoal);
      allGoals[userId] = userGoals;
      
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(allGoals));
      return newGoal;
    } catch (error) {
      throw new APIError(500, 'Failed to create goal', error);
    }
  }

  /**
   * Update an existing goal
   */
  async updateGoal(userId: string, goalId: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const allGoals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) || '{}');
      const userGoals = allGoals[userId] || [];
      
      const goalIndex = userGoals.findIndex((g: Goal) => g.id === goalId);
      if (goalIndex === -1) {
        throw new APIError(404, 'Goal not found');
      }

      userGoals[goalIndex] = { ...userGoals[goalIndex], ...updates };
      allGoals[userId] = userGoals;
      
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(allGoals));
      return userGoals[goalIndex];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Failed to update goal', error);
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    try {
      const allGoals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) || '{}');
      const userGoals = allGoals[userId] || [];
      
      const filteredGoals = userGoals.filter((g: Goal) => g.id !== goalId);
      allGoals[userId] = filteredGoals;
      
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(allGoals));
    } catch (error) {
      throw new APIError(500, 'Failed to delete goal', error);
    }
  }

  /**
   * Generate user insights and analytics
   * Requirements: 8.4, 8.5 - User insights and analytics
   */
  async generateUserInsights(userId: string): Promise<UserInsights> {
    try {
      const stats = await this.getUserStatistics(userId);
      const streaks = await progressTracker.getUserStreaksAsync(userId);
      const progressHistory = await progressTracker.getProgressHistory(
        userId, 
        ProgressMetric.ENGAGEMENT_SCORE, 
        this.config.trendAnalysisPeriod
      );

      // Generate performance trends
      const performanceTrends = this.analyzePerformanceTrends(progressHistory);

      // Generate engagement patterns
      const engagementPatterns = this.analyzeEngagementPatterns(stats, streaks);

      // Generate peak activity times (mock data for demo)
      const peakActivityTimes = this.generatePeakActivityTimes();

      // Generate network metrics (mock data for demo)
      const networkGrowth = this.generateNetworkGrowth();

      // Calculate influence score
      const influenceScore = this.calculateInfluenceScore(stats);

      // Generate suggested goals
      const suggestedGoals = this.generateSuggestedGoals(stats);

      const insights: UserInsights = {
        userId,
        generatedAt: Timestamp.now(),
        performanceTrends,
        strengthAreas: this.identifyStrengthAreas(stats),
        improvementAreas: this.identifyImprovementAreas(stats),
        engagementPatterns,
        peakActivityTimes,
        preferredEventTypes: ['Basketball', 'Soccer'], // Mock data
        networkGrowth,
        influenceScore,
        collaborationStyle: this.determineCollaborationStyle(stats),
        suggestedGoals,
        recommendedEvents: [], // Would be populated by recommendation service
        potentialMentors: [], // Would be populated by mentorship service
        nextAchievements: [], // Would be populated by achievement service
        skillProgression: [] // Would be populated by skill tracking service
      };

      // Cache insights
      const allInsights = JSON.parse(localStorage.getItem(INSIGHTS_STORAGE_KEY) || '{}');
      allInsights[userId] = insights;
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(allInsights));

      return insights;
    } catch (error) {
      throw new APIError(500, 'Failed to generate user insights', error);
    }
  }

  /**
   * Analyze performance trends from progress history
   */
  private analyzePerformanceTrends(progressHistory: ProgressEntry[]): PerformanceTrend[] {
    if (progressHistory.length < 7) {
      return [];
    }

    const trends: PerformanceTrend[] = [];
    const recentData = progressHistory.slice(-7); // Last 7 days
    const olderData = progressHistory.slice(-14, -7); // Previous 7 days

    if (recentData.length > 0 && olderData.length > 0) {
      const recentAvg = recentData.reduce((sum, entry) => sum + entry.value, 0) / recentData.length;
      const olderAvg = olderData.reduce((sum, entry) => sum + entry.value, 0) / olderData.length;
      
      const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      let trend: 'improving' | 'stable' | 'declining';
      if (changePercentage > 5) {
        trend = 'improving';
      } else if (changePercentage < -5) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }

      trends.push({
        metric: 'Engagement Score',
        period: 'week',
        trend,
        changePercentage: Math.round(changePercentage),
        insights: [
          trend === 'improving' ? 'Your engagement is trending upward!' :
          trend === 'declining' ? 'Consider increasing your activity level.' :
          'Your engagement is steady.'
        ]
      });
    }

    return trends;
  }

  /**
   * Analyze engagement patterns
   */
  private analyzeEngagementPatterns(stats: AthleteStats, streaks: StreakInfo[]): EngagementPattern[] {
    const patterns: EngagementPattern[] = [];

    // Analyze participation pattern
    if (stats.participationRate > 80) {
      patterns.push({
        pattern: 'High Participation',
        frequency: stats.eventsJoined,
        impact: 'high',
        recommendation: 'Keep up the excellent participation rate!'
      });
    }

    // Analyze social engagement
    const socialRatio = stats.reactionsReceived / Math.max(stats.eventsJoined, 1);
    if (socialRatio > 5) {
      patterns.push({
        pattern: 'Strong Social Engagement',
        frequency: stats.reactionsReceived,
        impact: 'high',
        recommendation: 'Your content resonates well with the community!'
      });
    }

    // Analyze consistency
    const activeStreaks = streaks.filter(s => s.isActive && s.current > 3);
    if (activeStreaks.length > 0) {
      patterns.push({
        pattern: 'Consistent Activity',
        frequency: Math.max(...activeStreaks.map(s => s.current)),
        impact: 'medium',
        recommendation: 'Your consistency is paying off!'
      });
    }

    return patterns;
  }

  /**
   * Generate mock peak activity times
   */
  private generatePeakActivityTimes(): TimeSlot[] {
    return [
      { hour: 18, dayOfWeek: 1, activityLevel: 85 }, // Monday 6 PM
      { hour: 19, dayOfWeek: 3, activityLevel: 92 }, // Wednesday 7 PM
      { hour: 20, dayOfWeek: 5, activityLevel: 78 }, // Friday 8 PM
      { hour: 14, dayOfWeek: 6, activityLevel: 88 }, // Saturday 2 PM
      { hour: 16, dayOfWeek: 0, activityLevel: 82 }  // Sunday 4 PM
    ];
  }

  /**
   * Generate mock network growth data
   */
  private generateNetworkGrowth(): NetworkMetric[] {
    const metrics: NetworkMetric[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = Timestamp.fromMillis(now.getTime() - (i * 24 * 60 * 60 * 1000));
      metrics.push({
        date,
        followers: 50 + Math.floor(Math.random() * 20) + (29 - i),
        following: 30 + Math.floor(Math.random() * 10) + Math.floor((29 - i) / 2),
        connections: 80 + Math.floor(Math.random() * 30) + (29 - i) * 2,
        influence: 100 + Math.floor(Math.random() * 50) + (29 - i) * 3
      });
    }

    return metrics;
  }

  /**
   * Calculate influence score
   */
  private calculateInfluenceScore(stats: AthleteStats): number {
    return (
      stats.reactionsReceived * 2 +
      stats.commentsReceived * 3 +
      stats.mentorshipsCompleted * 20 +
      stats.menteesHelped * 15 +
      stats.achievementPoints * 0.1
    );
  }

  /**
   * Identify strength areas
   */
  private identifyStrengthAreas(stats: AthleteStats): string[] {
    const strengths: string[] = [];

    if (stats.participationRate > 80) strengths.push('Event Participation');
    if (stats.challengeWinRate > 60) strengths.push('Challenge Performance');
    if (stats.reactionsReceived > 50) strengths.push('Community Engagement');
    if (stats.mentorshipsCompleted > 2) strengths.push('Leadership & Mentoring');
    if (stats.currentStreak > 7) strengths.push('Consistency');

    return strengths;
  }

  /**
   * Identify improvement areas
   */
  private identifyImprovementAreas(stats: AthleteStats): string[] {
    const improvements: string[] = [];

    if (stats.participationRate < 50) improvements.push('Event Participation');
    if (stats.challengesCompleted < 5) improvements.push('Challenge Engagement');
    if (stats.commentsPosted < 10) improvements.push('Community Interaction');
    if (stats.mentorshipsCompleted === 0) improvements.push('Mentorship Opportunities');
    if (stats.currentStreak < 3) improvements.push('Activity Consistency');

    return improvements;
  }

  /**
   * Determine collaboration style
   */
  private determineCollaborationStyle(stats: AthleteStats): string {
    const teamRatio = stats.teamContributions / Math.max(stats.eventsJoined, 1);
    const socialRatio = (stats.commentsPosted + stats.reactionsReceived) / Math.max(stats.eventsJoined, 1);

    if (teamRatio > 0.7 && socialRatio > 5) return 'Team Leader';
    if (teamRatio > 0.5) return 'Team Player';
    if (socialRatio > 8) return 'Community Connector';
    if (stats.mentorshipsCompleted > 1) return 'Mentor';
    return 'Independent Contributor';
  }

  /**
   * Generate suggested goals based on user stats
   */
  private generateSuggestedGoals(stats: AthleteStats): Goal[] {
    const suggestions: Goal[] = [];

    // Participation goal
    if (stats.eventsJoined < 20) {
      suggestions.push({
        id: 'suggested_participation',
        title: 'Event Explorer',
        description: 'Join 20 events to expand your athletic horizons',
        category: 'participation',
        targetValue: 20,
        currentValue: stats.eventsJoined,
        difficulty: 'medium',
        estimatedTime: '2 months'
      });
    }

    // Achievement goal
    if (stats.totalAchievements < 10) {
      suggestions.push({
        id: 'suggested_achievements',
        title: 'Achievement Hunter',
        description: 'Earn 10 achievements to showcase your progress',
        category: 'achievement',
        targetValue: 10,
        currentValue: stats.totalAchievements,
        difficulty: 'medium',
        estimatedTime: '6 weeks'
      });
    }

    // Social goal
    const socialScore = stats.reactionsReceived + stats.commentsReceived;
    if (socialScore < 100) {
      suggestions.push({
        id: 'suggested_social',
        title: 'Community Connector',
        description: 'Reach 100 total social interactions',
        category: 'social',
        targetValue: 100,
        currentValue: socialScore,
        difficulty: 'easy',
        estimatedTime: '1 month'
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Get cached user insights
   */
  async getCachedUserInsights(userId: string): Promise<UserInsights | null> {
    try {
      const allInsights = JSON.parse(localStorage.getItem(INSIGHTS_STORAGE_KEY) || '{}');
      const insights = allInsights[userId];
      
      if (!insights) return null;

      // Check if insights are still fresh (within 24 hours)
      const generatedAt = new Date(insights.generatedAt);
      const now = new Date();
      const hoursSinceGenerated = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceGenerated > 24) {
        return null; // Insights are stale
      }

      return insights;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StatisticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STATISTICS_CONFIG_KEY, JSON.stringify(this.config));
  }

  /**
   * Utility method to clear all statistics data (for testing)
   */
  clearAllStatisticsData(): void {
    localStorage.removeItem(STATISTICS_STORAGE_KEY);
    localStorage.removeItem(GOALS_STORAGE_KEY);
    localStorage.removeItem(INSIGHTS_STORAGE_KEY);
    this.initializeStorage();
  }


}

// Export singleton instance
export const statisticsService = new StatisticsService();
export default statisticsService;
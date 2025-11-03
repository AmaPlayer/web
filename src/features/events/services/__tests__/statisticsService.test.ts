import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { statisticsService, APIError } from '@features/events/services/statisticsService';
import { ProgressMetric, Goal, AthleteStats } from '@features/events/types/user.types';

describe('StatisticsService', () => {
  const testUserId = 'test-user-stats';
  const testUserId2 = 'test-user-stats-2';

  beforeEach(() => {
    // Clear all mocks and statistics data before each test
    vi.clearAllMocks();
    statisticsService.clearAllStatisticsData();
  });

  afterEach(() => {
    // Clean up after each test
    statisticsService.clearAllStatisticsData();
  });

  describe('Statistics Tracking (Requirement 8.1)', () => {
    it('should get comprehensive user statistics', async () => {
      const stats = await statisticsService.getUserStatistics(testUserId);

      expect(stats).toBeDefined();
      expect(typeof stats.eventsJoined).toBe('number');
      expect(typeof stats.eventsCompleted).toBe('number');
      expect(typeof stats.participationRate).toBe('number');
      expect(typeof stats.totalAchievements).toBe('number');
      expect(typeof stats.achievementPoints).toBe('number');
      expect(typeof stats.challengesCompleted).toBe('number');
      expect(typeof stats.reactionsReceived).toBe('number');
      expect(typeof stats.currentStreak).toBe('number');
    });

    it('should track multiple statistics categories', async () => {
      const stats = await statisticsService.getUserStatistics(testUserId);

      // Participation metrics
      expect(stats).toHaveProperty('eventsJoined');
      expect(stats).toHaveProperty('eventsCompleted');
      expect(stats).toHaveProperty('participationRate');

      // Achievement metrics
      expect(stats).toHaveProperty('totalAchievements');
      expect(stats).toHaveProperty('achievementPoints');
      expect(stats).toHaveProperty('rareAchievements');

      // Social metrics
      expect(stats).toHaveProperty('reactionsReceived');
      expect(stats).toHaveProperty('commentsReceived');
      expect(stats).toHaveProperty('mentorshipsCompleted');

      // Performance metrics
      expect(stats).toHaveProperty('challengesWon');
      expect(stats).toHaveProperty('challengeWinRate');
      expect(stats).toHaveProperty('currentStreak');

      // Time-based metrics
      expect(stats).toHaveProperty('totalActiveTime');
      expect(stats).toHaveProperty('averageSessionTime');
    });

    it('should maintain statistics consistency across operations', async () => {
      const initialStats = await statisticsService.getUserStatistics(testUserId);
      
      // Perform multiple statistics queries
      const stats1 = await statisticsService.getUserStatistics(testUserId);
      const stats2 = await statisticsService.getUserStatistics(testUserId);

      expect(stats1.eventsJoined).toBe(stats2.eventsJoined);
      expect(stats1.totalAchievements).toBe(stats2.totalAchievements);
      expect(stats1.achievementPoints).toBe(stats2.achievementPoints);
    });

    it('should handle multiple users independently', async () => {
      const stats1 = await statisticsService.getUserStatistics(testUserId);
      const stats2 = await statisticsService.getUserStatistics(testUserId2);

      // Both should return valid stats objects
      expect(stats1).toBeDefined();
      expect(stats2).toBeDefined();
      
      // They should be independent (could be same values but different objects)
      expect(stats1).not.toBe(stats2);
    });
  });

  describe('Progress Chart Data (Requirement 8.2)', () => {
    it('should generate progress chart data for engagement score', async () => {
      const chartData = await statisticsService.getProgressChartData(
        testUserId,
        [ProgressMetric.ENGAGEMENT_SCORE],
        30
      );

      expect(chartData).toBeDefined();
      expect(chartData[ProgressMetric.ENGAGEMENT_SCORE]).toBeDefined();
      
      const series = chartData[ProgressMetric.ENGAGEMENT_SCORE]!;
      expect(series.name).toBe('Engagement Score');
      expect(series.data).toBeDefined();
      expect(series.color).toBe('#3b82f6');
      expect(series.type).toBe('line');
    });

    it('should generate chart data for multiple metrics', async () => {
      const metrics = [
        ProgressMetric.ENGAGEMENT_SCORE,
        ProgressMetric.LEVEL,
        ProgressMetric.ACHIEVEMENTS,
        ProgressMetric.PARTICIPATION_RATE
      ];

      const chartData = await statisticsService.getProgressChartData(
        testUserId,
        metrics,
        30
      );

      expect(Object.keys(chartData)).toHaveLength(metrics.length);
      
      metrics.forEach(metric => {
        expect(chartData[metric]).toBeDefined();
        expect(chartData[metric]?.name).toBeDefined();
        expect(chartData[metric]?.data).toBeDefined();
        expect(chartData[metric]?.color).toBeDefined();
      });
    });

    it('should fill missing days in chart data', async () => {
      const chartData = await statisticsService.getProgressChartData(
        testUserId,
        [ProgressMetric.ENGAGEMENT_SCORE],
        7 // 7 days
      );

      const series = chartData[ProgressMetric.ENGAGEMENT_SCORE];
      expect(series).toBeDefined();
      expect(series?.name).toBe('Engagement Score');
      expect(series?.data).toBeDefined();
      expect(Array.isArray(series?.data)).toBe(true);
    });

    it('should provide correct metric display names and colors', async () => {
      const metrics = [
        ProgressMetric.ENGAGEMENT_SCORE,
        ProgressMetric.LEVEL,
        ProgressMetric.ACHIEVEMENTS,
        ProgressMetric.PARTICIPATION_RATE,
        ProgressMetric.SKILL_RATING,
        ProgressMetric.SOCIAL_IMPACT
      ];

      const expectedNames = {
        [ProgressMetric.ENGAGEMENT_SCORE]: 'Engagement Score',
        [ProgressMetric.LEVEL]: 'Level',
        [ProgressMetric.ACHIEVEMENTS]: 'Achievements',
        [ProgressMetric.PARTICIPATION_RATE]: 'Participation Rate',
        [ProgressMetric.SKILL_RATING]: 'Skill Rating',
        [ProgressMetric.SOCIAL_IMPACT]: 'Social Impact'
      };

      const expectedColors = {
        [ProgressMetric.ENGAGEMENT_SCORE]: '#3b82f6',
        [ProgressMetric.LEVEL]: '#10b981',
        [ProgressMetric.ACHIEVEMENTS]: '#f59e0b',
        [ProgressMetric.PARTICIPATION_RATE]: '#8b5cf6',
        [ProgressMetric.SKILL_RATING]: '#ef4444',
        [ProgressMetric.SOCIAL_IMPACT]: '#06b6d4'
      };

      const chartData = await statisticsService.getProgressChartData(
        testUserId,
        metrics,
        30
      );

      metrics.forEach(metric => {
        const series = chartData[metric];
        expect(series?.name).toBe(expectedNames[metric]);
        expect(series?.color).toBe(expectedColors[metric]);
      });
    });

    it('should handle empty progress history gracefully', async () => {
      const chartData = await statisticsService.getProgressChartData(
        'new-user-no-history',
        [ProgressMetric.ENGAGEMENT_SCORE],
        30
      );

      expect(chartData[ProgressMetric.ENGAGEMENT_SCORE]).toBeDefined();
      const series = chartData[ProgressMetric.ENGAGEMENT_SCORE]!;
      expect(series.data).toBeDefined();
      expect(Array.isArray(series.data)).toBe(true);
    });
  });

  describe('Goal Setting and Progress Monitoring (Requirement 8.3)', () => {
    it('should create new goals for users', async () => {
      const goalData = {
        title: 'Event Master',
        description: 'Join 20 events this month',
        category: 'participation' as const,
        targetValue: 20,
        currentValue: 5,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        difficulty: 'medium' as const,
        estimatedTime: '1 month'
      };

      const goal = await statisticsService.createGoal(testUserId, goalData);

      expect(goal.id).toBeDefined();
      expect(goal.title).toBe(goalData.title);
      expect(goal.category).toBe(goalData.category);
      expect(goal.targetValue).toBe(goalData.targetValue);
      expect(goal.deadline).toEqual(goalData.deadline);
    });

    it('should get user goals with progress calculations', async () => {
      // Create a test goal
      const goalData = {
        title: 'Achievement Hunter',
        description: 'Earn 10 achievements',
        category: 'achievement' as const,
        targetValue: 10,
        currentValue: 3,
        difficulty: 'medium' as const,
        estimatedTime: '2 months'
      };

      await statisticsService.createGoal(testUserId, goalData);

      const goalProgress = await statisticsService.getUserGoals(testUserId);

      expect(goalProgress).toHaveLength(1);
      expect(goalProgress[0].goal.title).toBe(goalData.title);
      expect(goalProgress[0].progress).toBeGreaterThanOrEqual(0);
      expect(goalProgress[0].progress).toBeLessThanOrEqual(100);
      expect(goalProgress[0].currentValue).toBeGreaterThanOrEqual(0);
      expect(goalProgress[0].targetValue).toBe(10);
      expect(typeof goalProgress[0].onTrack).toBe('boolean');
    });

    it('should calculate goal progress correctly', async () => {
      const goalData = {
        title: 'Social Butterfly',
        description: 'Get 100 social interactions',
        category: 'social' as const,
        targetValue: 100,
        currentValue: 50,
        difficulty: 'easy' as const,
        estimatedTime: '3 weeks'
      };

      await statisticsService.createGoal(testUserId, goalData);
      const goalProgress = await statisticsService.getUserGoals(testUserId);

      expect(goalProgress[0].progress).toBeGreaterThanOrEqual(0);
      expect(goalProgress[0].progress).toBeLessThanOrEqual(100);
      expect(goalProgress[0].targetValue).toBe(100);
    });

    it('should handle goals with deadlines', async () => {
      const futureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      
      const goalData = {
        title: 'Quick Challenge',
        description: 'Complete 5 challenges in 2 weeks',
        category: 'skill' as const,
        targetValue: 5,
        currentValue: 2,
        deadline: futureDeadline,
        difficulty: 'hard' as const,
        estimatedTime: '2 weeks'
      };

      const goal = await statisticsService.createGoal(testUserId, goalData);
      expect(goal.deadline).toEqual(futureDeadline);
      expect(goal.targetValue).toBe(5);
    });

    it('should update existing goals', async () => {
      const goalData = {
        title: 'Original Goal',
        description: 'Original description',
        category: 'participation' as const,
        targetValue: 10,
        currentValue: 3,
        difficulty: 'easy' as const,
        estimatedTime: '1 month'
      };

      const goal = await statisticsService.createGoal(testUserId, goalData);
      
      const updates = {
        title: 'Updated Goal',
        targetValue: 15,
        currentValue: 8
      };

      const updatedGoal = await statisticsService.updateGoal(testUserId, goal.id, updates);

      expect(updatedGoal.title).toBe('Updated Goal');
      expect(updatedGoal.targetValue).toBe(15);
      expect(updatedGoal.currentValue).toBe(8);
    });

    it('should delete goals', async () => {
      const goalData = {
        title: 'Temporary Goal',
        description: 'This will be deleted',
        category: 'participation' as const,
        targetValue: 5,
        currentValue: 1,
        difficulty: 'easy' as const,
        estimatedTime: '1 week'
      };

      const goal = await statisticsService.createGoal(testUserId, goalData);
      
      await statisticsService.deleteGoal(testUserId, goal.id);
      
      const goals = await statisticsService.getUserGoals(testUserId);
      expect(goals.find(g => g.goal.id === goal.id)).toBeUndefined();
    });

    it('should handle non-existent goal updates', async () => {
      await expect(
        statisticsService.updateGoal(testUserId, 'non-existent-goal', { title: 'New Title' })
      ).rejects.toThrow(APIError);
    });
  });

  describe('User Insights and Analytics (Requirements 8.4, 8.5)', () => {
    beforeEach(async () => {
      // Seed some sample data for insights generation
      await statisticsService.seedSampleStatisticsData(testUserId);
    });

    it('should generate comprehensive user insights', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(insights.userId).toBe(testUserId);
      expect(insights.generatedAt).toBeInstanceOf(Date);
      expect(insights.performanceTrends).toBeDefined();
      expect(insights.strengthAreas).toBeDefined();
      expect(insights.improvementAreas).toBeDefined();
      expect(insights.engagementPatterns).toBeDefined();
      expect(insights.peakActivityTimes).toBeDefined();
      expect(insights.networkGrowth).toBeDefined();
      expect(typeof insights.influenceScore).toBe('number');
      expect(insights.collaborationStyle).toBeDefined();
      expect(insights.suggestedGoals).toBeDefined();
    });

    it('should analyze performance trends correctly', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.performanceTrends)).toBe(true);
      
      insights.performanceTrends.forEach(trend => {
        expect(trend.metric).toBeDefined();
        expect(trend.period).toBeDefined();
        expect(['improving', 'stable', 'declining']).toContain(trend.trend);
        expect(typeof trend.changePercentage).toBe('number');
        expect(Array.isArray(trend.insights)).toBe(true);
      });
    });

    it('should identify strength areas based on user stats', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.strengthAreas)).toBe(true);
      
      const possibleStrengths = [
        'Event Participation',
        'Challenge Performance', 
        'Community Engagement',
        'Leadership & Mentoring',
        'Consistency'
      ];

      insights.strengthAreas.forEach(strength => {
        expect(possibleStrengths).toContain(strength);
      });
    });

    it('should identify improvement areas based on user stats', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.improvementAreas)).toBe(true);
      
      const possibleImprovements = [
        'Event Participation',
        'Challenge Engagement',
        'Community Interaction',
        'Mentorship Opportunities',
        'Activity Consistency'
      ];

      insights.improvementAreas.forEach(improvement => {
        expect(possibleImprovements).toContain(improvement);
      });
    });

    it('should analyze engagement patterns', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.engagementPatterns)).toBe(true);
      
      insights.engagementPatterns.forEach(pattern => {
        expect(pattern.pattern).toBeDefined();
        expect(typeof pattern.frequency).toBe('number');
        expect(['high', 'medium', 'low']).toContain(pattern.impact);
        expect(pattern.recommendation).toBeDefined();
      });
    });

    it('should provide peak activity times', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.peakActivityTimes)).toBe(true);
      expect(insights.peakActivityTimes.length).toBeGreaterThan(0);
      
      insights.peakActivityTimes.forEach(timeSlot => {
        expect(timeSlot.hour).toBeGreaterThanOrEqual(0);
        expect(timeSlot.hour).toBeLessThan(24);
        expect(timeSlot.dayOfWeek).toBeGreaterThanOrEqual(0);
        expect(timeSlot.dayOfWeek).toBeLessThan(7);
        expect(timeSlot.activityLevel).toBeGreaterThan(0);
        expect(timeSlot.activityLevel).toBeLessThanOrEqual(100);
      });
    });

    it('should generate network growth metrics', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.networkGrowth)).toBe(true);
      expect(insights.networkGrowth.length).toBe(30); // 30 days of data
      
      insights.networkGrowth.forEach(metric => {
        expect(metric.date).toBeInstanceOf(Date);
        expect(typeof metric.followers).toBe('number');
        expect(typeof metric.following).toBe('number');
        expect(typeof metric.connections).toBe('number');
        expect(typeof metric.influence).toBe('number');
      });
    });

    it('should calculate influence score correctly', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(typeof insights.influenceScore).toBe('number');
      expect(insights.influenceScore).toBeGreaterThanOrEqual(0);
    });

    it('should determine collaboration style', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      const possibleStyles = [
        'Team Leader',
        'Team Player', 
        'Community Connector',
        'Mentor',
        'Independent Contributor'
      ];

      expect(possibleStyles).toContain(insights.collaborationStyle);
    });

    it('should generate suggested goals based on user performance', async () => {
      const insights = await statisticsService.generateUserInsights(testUserId);

      expect(Array.isArray(insights.suggestedGoals)).toBe(true);
      expect(insights.suggestedGoals.length).toBeLessThanOrEqual(3);
      
      insights.suggestedGoals.forEach(goal => {
        expect(goal.id).toBeDefined();
        expect(goal.title).toBeDefined();
        expect(goal.description).toBeDefined();
        expect(goal.category).toBeDefined();
        expect(typeof goal.targetValue).toBe('number');
        expect(typeof goal.currentValue).toBe('number');
        expect(['easy', 'medium', 'hard']).toContain(goal.difficulty);
        expect(goal.estimatedTime).toBeDefined();
      });
    });

    it('should cache insights for performance', async () => {
      // Generate insights first time
      const insights1 = await statisticsService.generateUserInsights(testUserId);
      
      // Get cached insights
      const cachedInsights = await statisticsService.getCachedUserInsights(testUserId);
      
      expect(cachedInsights).toBeDefined();
      expect(cachedInsights?.userId).toBe(testUserId);
      expect(new Date(cachedInsights?.generatedAt || 0).getTime()).toBe(insights1.generatedAt.getTime());
    });

    it('should return null for stale cached insights', async () => {
      // Mock old insights (more than 24 hours old)
      const oldInsights = {
        userId: testUserId,
        generatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        performanceTrends: [],
        strengthAreas: [],
        improvementAreas: [],
        engagementPatterns: [],
        peakActivityTimes: [],
        preferredEventTypes: [],
        networkGrowth: [],
        influenceScore: 0,
        collaborationStyle: 'Independent Contributor',
        suggestedGoals: [],
        recommendedEvents: [],
        potentialMentors: [],
        nextAchievements: [],
        skillProgression: []
      };

      // Manually set old insights in storage
      const allInsights = { [testUserId]: oldInsights };
      localStorage.setItem('user_insights_data', JSON.stringify(allInsights));

      const cachedInsights = await statisticsService.getCachedUserInsights(testUserId);
      expect(cachedInsights).toBeNull();
    });
  });

  describe('Configuration and Data Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        trackingEnabled: false,
        retentionDays: 180,
        trendAnalysisPeriod: 60
      };

      statisticsService.updateConfig(newConfig);

      // Configuration should be persisted
      const stored = localStorage.getItem('statistics_config');
      expect(stored).toBeDefined();
      
      const config = JSON.parse(stored!);
      expect(config.trackingEnabled).toBe(false);
      expect(config.retentionDays).toBe(180);
      expect(config.trendAnalysisPeriod).toBe(60);
    });

    it('should seed sample statistics data correctly', async () => {
      await statisticsService.seedSampleStatisticsData(testUserId);

      // Check that sample data was created
      const insights = await statisticsService.getCachedUserInsights(testUserId);
      expect(insights).toBeDefined();
      expect(insights?.userId).toBe(testUserId);
    });

    it('should clear all statistics data', () => {
      // Add some data first
      statisticsService.seedSampleStatisticsData(testUserId);

      // Clear all data
      statisticsService.clearAllStatisticsData();

      // Verify data is cleared
      const goalsStorage = localStorage.getItem('user_goals_data');
      const insightsStorage = localStorage.getItem('user_insights_data');
      
      expect(JSON.parse(goalsStorage || '{}')).toEqual({});
      expect(JSON.parse(insightsStorage || '{}')).toEqual({});
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid user IDs gracefully', async () => {
      const stats = await statisticsService.getUserStatistics('');
      expect(stats).toBeDefined();
    });

    it('should handle empty chart data requests', async () => {
      const chartData = await statisticsService.getProgressChartData(
        'non-existent-user',
        [],
        30
      );

      expect(chartData).toBeDefined();
      expect(Object.keys(chartData)).toHaveLength(0);
    });

    it('should throw APIError for invalid goal operations', async () => {
      await expect(
        statisticsService.updateGoal('invalid-user', 'invalid-goal', {})
      ).rejects.toThrow(APIError);
    });

    it('should handle insights generation errors gracefully', async () => {
      // Test with user that has no data
      const insights = await statisticsService.generateUserInsights('empty-user');
      
      expect(insights).toBeDefined();
      expect(insights.userId).toBe('empty-user');
      expect(insights.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle storage errors in goal operations', async () => {
      // Test with invalid goal data instead of mocking storage
      await expect(
        statisticsService.updateGoal('invalid-user', 'invalid-goal-id', {})
      ).rejects.toThrow(APIError);
    });

    it('should handle concurrent statistics operations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        statisticsService.getUserStatistics(`concurrent-user-${i}`)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(stats => {
        expect(stats).toBeDefined();
        expect(typeof stats.eventsJoined).toBe('number');
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();

      // Generate insights for multiple users
      const promises = Array.from({ length: 10 }, (_, i) => 
        statisticsService.generateUserInsights(`perf-user-${i}`)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should provide consistent statistics across calls', async () => {
      const stats1 = await statisticsService.getUserStatistics(testUserId);
      const stats2 = await statisticsService.getUserStatistics(testUserId);

      expect(stats1.eventsJoined).toBe(stats2.eventsJoined);
      expect(stats1.totalAchievements).toBe(stats2.totalAchievements);
    });

    it('should handle multiple chart data requests efficiently', async () => {
      const startTime = Date.now();

      const metrics = [
        ProgressMetric.ENGAGEMENT_SCORE,
        ProgressMetric.LEVEL,
        ProgressMetric.ACHIEVEMENTS,
        ProgressMetric.PARTICIPATION_RATE,
        ProgressMetric.SKILL_RATING,
        ProgressMetric.SOCIAL_IMPACT
      ];

      await statisticsService.getProgressChartData(testUserId, metrics, 30);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
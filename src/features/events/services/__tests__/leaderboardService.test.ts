import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { leaderboardService, APIError } from '@features/events/services/leaderboardService';
import { LeaderboardType, LeaderboardPeriod, RankChange } from '@features/events/types/engagement.types';
import { AthleteStats } from '@features/events/types/user.types';

describe('LeaderboardService', () => {
  const testUserId1 = 'test-user-1';
  const testUserId2 = 'test-user-2';
  const testUserId3 = 'test-user-3';
  const testEventId = 'test-event-123';
  const testChallengeId = 'test-challenge-456';

  beforeEach(() => {
    // Clear all mocks and leaderboard data before each test
    vi.clearAllMocks();
    leaderboardService.clearAllLeaderboardData();
    // Disable real-time updates for most tests to avoid interference
    leaderboardService.updateConfig({ enableRealTimeUpdates: false });
  });

  afterEach(() => {
    // Clean up after each test
    leaderboardService.clearAllLeaderboardData();
  });

  describe('Ranking Calculations for Different Metrics (Requirement 4.1)', () => {
    beforeEach(async () => {
      // Clear data first, then set up test users with different stats for ranking tests
      leaderboardService.clearAllLeaderboardData();
      
      const stats1: AthleteStats = {
        eventsJoined: 20,
        eventsCompleted: 18,
        eventsWon: 5,
        participationRate: 90,
        totalReactions: 30,
        reactionsReceived: 80,
        commentsPosted: 25,
        commentsReceived: 60,
        totalAchievements: 12,
        rareAchievements: 3,
        achievementPoints: 500,
        challengesCompleted: 15,
        challengesWon: 8,
        challengeWinRate: 53,
        mentorshipsCompleted: 2,
        menteesHelped: 4,
        teamContributions: 12,
        totalActiveTime: 1800,
        averageSessionTime: 45,
        longestStreak: 15,
        currentStreak: 8,
        sportRanks: { 'Basketball': 10, 'Soccer': 15 }
      };

      const stats2: AthleteStats = {
        eventsJoined: 15,
        eventsCompleted: 14,
        eventsWon: 3,
        participationRate: 93,
        totalReactions: 20,
        reactionsReceived: 120,
        commentsPosted: 35,
        commentsReceived: 90,
        totalAchievements: 8,
        rareAchievements: 1,
        achievementPoints: 300,
        challengesCompleted: 20,
        challengesWon: 12,
        challengeWinRate: 60,
        mentorshipsCompleted: 1,
        menteesHelped: 2,
        teamContributions: 8,
        totalActiveTime: 1200,
        averageSessionTime: 40,
        longestStreak: 12,
        currentStreak: 5,
        sportRanks: { 'Basketball': 8, 'Soccer': 20 }
      };

      const stats3: AthleteStats = {
        eventsJoined: 25,
        eventsCompleted: 20,
        eventsWon: 2,
        participationRate: 80,
        totalReactions: 40,
        reactionsReceived: 50,
        commentsPosted: 15,
        commentsReceived: 30,
        totalAchievements: 15,
        rareAchievements: 5,
        achievementPoints: 750,
        challengesCompleted: 10,
        challengesWon: 4,
        challengeWinRate: 40,
        mentorshipsCompleted: 3,
        menteesHelped: 6,
        teamContributions: 15,
        totalActiveTime: 2000,
        averageSessionTime: 50,
        longestStreak: 20,
        currentStreak: 12,
        sportRanks: { 'Basketball': 5, 'Soccer': 12 }
      };

      await leaderboardService.updateUserRankingData(testUserId1, stats1);
      await leaderboardService.updateUserRankingData(testUserId2, stats2);
      await leaderboardService.updateUserRankingData(testUserId3, stats3);
      
      // Wait a bit for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should calculate engagement score rankings correctly', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(3);
      expect(leaderboard.type).toBe(LeaderboardType.ENGAGEMENT_SCORE);
      
      // Verify rankings are in descending order by engagement score
      for (let i = 0; i < leaderboard.entries.length - 1; i++) {
        expect(leaderboard.entries[i].score).toBeGreaterThanOrEqual(
          leaderboard.entries[i + 1].score
        );
        expect(leaderboard.entries[i].rank).toBe(i + 1);
      }
    });

    it('should calculate participation rankings correctly', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.PARTICIPATION,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(3);
      expect(leaderboard.type).toBe(LeaderboardType.PARTICIPATION);

      // User 3 should rank highest (25 events joined, 20 completed)
      // User 1 should be second (20 events joined, 18 completed)
      // User 2 should be third (15 events joined, 14 completed)
      const topUser = leaderboard.entries[0];
      expect(topUser.userId).toBe(testUserId3);
      expect(topUser.rank).toBe(1);
    });

    it('should calculate achievement rankings correctly', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ACHIEVEMENTS,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(3);
      expect(leaderboard.type).toBe(LeaderboardType.ACHIEVEMENTS);

      // User 3 should rank highest (750 points + 5*50 rare achievements = 1000)
      const topUser = leaderboard.entries[0];
      expect(topUser.userId).toBe(testUserId3);
      expect(topUser.rank).toBe(1);
      expect(topUser.score).toBe(1000); // 750 + (5 * 50)
    });

    it('should calculate challenge win rankings correctly', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.CHALLENGE_WINS,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(3);
      expect(leaderboard.type).toBe(LeaderboardType.CHALLENGE_WINS);

      // User 2 should rank highest (12 wins * 10 + 20 completed * 2 + 60/5 win rate = 172)
      const topUser = leaderboard.entries[0];
      expect(topUser.userId).toBe(testUserId2);
      expect(topUser.rank).toBe(1);
    });

    it('should calculate social impact rankings correctly', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.SOCIAL_IMPACT,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(3);
      expect(leaderboard.type).toBe(LeaderboardType.SOCIAL_IMPACT);

      // Verify social impact calculation includes reactions, comments, mentorships, etc.
      leaderboard.entries.forEach(entry => {
        expect(entry.score).toBeGreaterThan(0);
      });
    });

    it('should calculate team performance rankings correctly', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.TEAM_PERFORMANCE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(3);
      expect(leaderboard.type).toBe(LeaderboardType.TEAM_PERFORMANCE);

      // User 1 should rank highest (5 wins * 15 + 12 contributions * 8 + 8 challenge wins * 5 = 211)
      const topUser = leaderboard.entries[0];
      expect(topUser.userId).toBe(testUserId1);
      expect(topUser.rank).toBe(1);
    });

    it('should handle ties in rankings appropriately', async () => {
      // Create users with identical stats
      const identicalStats: AthleteStats = {
        eventsJoined: 10,
        eventsCompleted: 10,
        eventsWon: 1,
        participationRate: 100,
        totalReactions: 10,
        reactionsReceived: 20,
        commentsPosted: 5,
        commentsReceived: 10,
        totalAchievements: 5,
        rareAchievements: 1,
        achievementPoints: 100,
        challengesCompleted: 5,
        challengesWon: 2,
        challengeWinRate: 40,
        mentorshipsCompleted: 0,
        menteesHelped: 0,
        teamContributions: 3,
        totalActiveTime: 600,
        averageSessionTime: 30,
        longestStreak: 5,
        currentStreak: 2,
        sportRanks: { 'Basketball': 25 }
      };

      await leaderboardService.updateUserRankingData('tie-user-1', identicalStats);
      await leaderboardService.updateUserRankingData('tie-user-2', identicalStats);

      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      // Find the tied users
      const tiedUsers = leaderboard.entries.filter(entry => 
        entry.userId === 'tie-user-1' || entry.userId === 'tie-user-2'
      );

      expect(tiedUsers).toHaveLength(2);
      expect(tiedUsers[0].score).toBe(tiedUsers[1].score);
    });
  });

  describe('Time Period Filtering (Requirement 4.3)', () => {
    it('should support weekly leaderboards', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.WEEKLY
      );

      expect(leaderboard.period).toBe(LeaderboardPeriod.WEEKLY);
      expect(leaderboard.entries).toBeDefined();
    });

    it('should support monthly leaderboards', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.PARTICIPATION,
        LeaderboardPeriod.MONTHLY
      );

      expect(leaderboard.period).toBe(LeaderboardPeriod.MONTHLY);
      expect(leaderboard.entries).toBeDefined();
    });

    it('should support all-time leaderboards', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ACHIEVEMENTS,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.period).toBe(LeaderboardPeriod.ALL_TIME);
      expect(leaderboard.entries).toBeDefined();
    });

    it('should support event-specific leaderboards', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.PARTICIPATION,
        LeaderboardPeriod.EVENT_SPECIFIC,
        testEventId
      );

      expect(leaderboard.period).toBe(LeaderboardPeriod.EVENT_SPECIFIC);
      expect(leaderboard.eventId).toBe(testEventId);
    });
  });

  describe('Real-time Leaderboard Updates (Requirement 4.3)', () => {
    it('should notify subscribers when leaderboard updates', async () => {
      // Enable real-time updates for this test
      leaderboardService.updateConfig({ enableRealTimeUpdates: true });
      
      const mockCallback = vi.fn();
      
      // Subscribe to leaderboard updates
      const unsubscribe = leaderboardService.subscribeToLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME,
        mockCallback
      );

      // Trigger an update by adding user data
      const stats: AthleteStats = {
        eventsJoined: 5,
        eventsCompleted: 5,
        eventsWon: 1,
        participationRate: 100,
        totalReactions: 10,
        reactionsReceived: 15,
        commentsPosted: 3,
        commentsReceived: 8,
        totalAchievements: 3,
        rareAchievements: 0,
        achievementPoints: 50,
        challengesCompleted: 2,
        challengesWon: 1,
        challengeWinRate: 50,
        mentorshipsCompleted: 0,
        menteesHelped: 0,
        teamContributions: 2,
        totalActiveTime: 300,
        averageSessionTime: 25,
        longestStreak: 3,
        currentStreak: 1,
        sportRanks: {}
      };

      await leaderboardService.updateUserRankingData('new-user', stats);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockCallback).toHaveBeenCalled();
      
      // Clean up subscription
      unsubscribe();
    });

    it('should track rank changes between updates', async () => {
      // Set up initial leaderboard
      await leaderboardService.seedSampleLeaderboardData();
      
      const initialLeaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      // Update a user's stats to change their ranking
      const improvedStats: AthleteStats = {
        eventsJoined: 50,
        eventsCompleted: 45,
        eventsWon: 15,
        participationRate: 90,
        totalReactions: 100,
        reactionsReceived: 200,
        commentsPosted: 80,
        commentsReceived: 150,
        totalAchievements: 25,
        rareAchievements: 8,
        achievementPoints: 2000,
        challengesCompleted: 30,
        challengesWon: 20,
        challengeWinRate: 67,
        mentorshipsCompleted: 5,
        menteesHelped: 10,
        teamContributions: 25,
        totalActiveTime: 5000,
        averageSessionTime: 60,
        longestStreak: 30,
        currentStreak: 15,
        sportRanks: { 'Basketball': 1, 'Soccer': 2 }
      };

      await leaderboardService.updateUserRankingData('user1', improvedStats);

      const updatedLeaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      // Find user1 in both leaderboards
      const initialEntry = initialLeaderboard.entries.find(e => e.userId === 'user1');
      const updatedEntry = updatedLeaderboard.entries.find(e => e.userId === 'user1');

      expect(initialEntry).toBeDefined();
      expect(updatedEntry).toBeDefined();
      
      if (initialEntry && updatedEntry) {
        // User should have improved ranking
        expect(updatedEntry.rank).toBeLessThanOrEqual(initialEntry.rank);
        expect(updatedEntry.score).toBeGreaterThan(initialEntry.score);
        
        // Check for rank change indication
        if (updatedEntry.rank < initialEntry.rank) {
          expect(updatedEntry.change).toBe(RankChange.UP);
          expect(updatedEntry.previousRank).toBe(initialEntry.rank);
        }
      }
    });

    it('should handle multiple concurrent updates correctly', async () => {
      const stats: AthleteStats = {
        eventsJoined: 10,
        eventsCompleted: 8,
        eventsWon: 2,
        participationRate: 80,
        totalReactions: 20,
        reactionsReceived: 30,
        commentsPosted: 10,
        commentsReceived: 15,
        totalAchievements: 5,
        rareAchievements: 1,
        achievementPoints: 100,
        challengesCompleted: 8,
        challengesWon: 3,
        challengeWinRate: 38,
        mentorshipsCompleted: 1,
        menteesHelped: 2,
        teamContributions: 5,
        totalActiveTime: 800,
        averageSessionTime: 35,
        longestStreak: 8,
        currentStreak: 4,
        sportRanks: {}
      };

      // Update multiple users concurrently
      const updatePromises = Array.from({ length: 5 }, (_, i) => 
        leaderboardService.updateUserRankingData(`concurrent-user-${i}`, {
          ...stats,
          eventsJoined: stats.eventsJoined + i,
          achievementPoints: stats.achievementPoints + (i * 10)
        })
      );

      await Promise.all(updatePromises);

      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      // All users should be present in leaderboard
      const concurrentUsers = leaderboard.entries.filter(entry => 
        entry.userId.startsWith('concurrent-user-')
      );

      expect(concurrentUsers).toHaveLength(5);
    });

    it('should unsubscribe from leaderboard updates correctly', () => {
      const mockCallback = vi.fn();
      
      const unsubscribe = leaderboardService.subscribeToLeaderboard(
        LeaderboardType.PARTICIPATION,
        LeaderboardPeriod.WEEKLY,
        mockCallback
      );

      // Unsubscribe immediately
      unsubscribe();

      // Verify callback is not called after unsubscribe
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('User Position Queries (Requirement 4.2)', () => {
    beforeEach(async () => {
      await leaderboardService.seedSampleLeaderboardData();
    });

    it('should get user position in specific leaderboard', async () => {
      const position = await leaderboardService.getUserPosition(
        'user1',
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(position).toBeDefined();
      expect(position?.userId).toBe('user1');
      expect(position?.rank).toBeGreaterThan(0);
      expect(position?.score).toBeGreaterThan(0);
    });

    it('should return null for user not in leaderboard', async () => {
      const position = await leaderboardService.getUserPosition(
        'non-existent-user',
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(position).toBeNull();
    });

    it('should get user positions across all leaderboard types', async () => {
      const positions = await leaderboardService.getUserPositions('user1');

      expect(positions).toHaveLength(Object.keys(LeaderboardType).length);
      
      positions.forEach(({ type, position }) => {
        expect(Object.values(LeaderboardType)).toContain(type);
        if (position) {
          expect(position.userId).toBe('user1');
          expect(position.rank).toBeGreaterThan(0);
        }
      });
    });

    it('should highlight user position in leaderboard (Requirement 4.4)', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      const userEntry = leaderboard.entries.find(entry => entry.userId === 'user1');
      
      expect(userEntry).toBeDefined();
      expect(userEntry?.rank).toBeGreaterThan(0);
      expect(userEntry?.rank).toBeLessThanOrEqual(leaderboard.entries.length);
    });
  });

  describe('Multiple Leaderboards (Requirement 4.1)', () => {
    it('should get multiple leaderboards at once', async () => {
      const requests = [
        { type: LeaderboardType.ENGAGEMENT_SCORE, period: LeaderboardPeriod.ALL_TIME },
        { type: LeaderboardType.PARTICIPATION, period: LeaderboardPeriod.WEEKLY },
        { type: LeaderboardType.ACHIEVEMENTS, period: LeaderboardPeriod.MONTHLY }
      ];

      const leaderboards = await leaderboardService.getMultipleLeaderboards(requests);

      expect(leaderboards).toHaveLength(3);
      expect(leaderboards[0].type).toBe(LeaderboardType.ENGAGEMENT_SCORE);
      expect(leaderboards[1].type).toBe(LeaderboardType.PARTICIPATION);
      expect(leaderboards[2].type).toBe(LeaderboardType.ACHIEVEMENTS);
    });

    it('should provide leaderboard statistics', async () => {
      await leaderboardService.seedSampleLeaderboardData();

      const stats = await leaderboardService.getLeaderboardStats(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(stats.totalParticipants).toBeGreaterThan(0);
      expect(stats.averageScore).toBeGreaterThan(0);
      expect(stats.topScore).toBeGreaterThan(0);
      expect(stats.scoreDistribution).toHaveLength(5);
      
      stats.scoreDistribution.forEach(range => {
        expect(range.range).toMatch(/^\d+-\d+$/);
        expect(range.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty leaderboards gracefully', async () => {
      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries).toHaveLength(0);
      expect(leaderboard.type).toBe(LeaderboardType.ENGAGEMENT_SCORE);
      expect(leaderboard.lastUpdated).toBeInstanceOf(Date);
    });

    it('should throw APIError for invalid operations', async () => {
      // Test with invalid user data update
      await expect(
        leaderboardService.updateUserRankingData('', {} as AthleteStats)
      ).rejects.toThrow(APIError);
    });

    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        leaderboardService.updateConfig({ maxEntries: 50 });
      }).toThrow();

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });

    it('should refresh all leaderboards correctly', async () => {
      await leaderboardService.seedSampleLeaderboardData();
      
      // Get initial leaderboard
      const initial = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      // Refresh all leaderboards
      await leaderboardService.refreshAllLeaderboards();

      // Get refreshed leaderboard
      const refreshed = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(refreshed.entries.length).toBe(initial.entries.length);
      expect(new Date(refreshed.lastUpdated).getTime()).toBeGreaterThanOrEqual(new Date(initial.lastUpdated).getTime());
    });
  });

  describe('Configuration and Performance', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        maxEntries: 50,
        updateInterval: 2 * 60 * 1000,
        enableRealTimeUpdates: false
      };

      leaderboardService.updateConfig(newConfig);

      // Configuration should be persisted
      const stored = localStorage.getItem('leaderboard_config');
      expect(stored).toBeDefined();
      
      const config = JSON.parse(stored!);
      expect(config.maxEntries).toBe(50);
      expect(config.enableRealTimeUpdates).toBe(false);
    });

    it('should limit leaderboard entries to configured maximum', async () => {
      // Set max entries to 3
      leaderboardService.updateConfig({ maxEntries: 3 });

      // Seed more than 3 users
      await leaderboardService.seedSampleLeaderboardData();

      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      expect(leaderboard.entries.length).toBeLessThanOrEqual(3);
    });

    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();

      // Create many users
      const promises = Array.from({ length: 20 }, async (_, i) => {
        const stats: AthleteStats = {
          eventsJoined: Math.floor(Math.random() * 50),
          eventsCompleted: Math.floor(Math.random() * 40),
          eventsWon: Math.floor(Math.random() * 10),
          participationRate: Math.floor(Math.random() * 100),
          totalReactions: Math.floor(Math.random() * 100),
          reactionsReceived: Math.floor(Math.random() * 200),
          commentsPosted: Math.floor(Math.random() * 50),
          commentsReceived: Math.floor(Math.random() * 100),
          totalAchievements: Math.floor(Math.random() * 20),
          rareAchievements: Math.floor(Math.random() * 5),
          achievementPoints: Math.floor(Math.random() * 1000),
          challengesCompleted: Math.floor(Math.random() * 30),
          challengesWon: Math.floor(Math.random() * 15),
          challengeWinRate: Math.floor(Math.random() * 100),
          mentorshipsCompleted: Math.floor(Math.random() * 5),
          menteesHelped: Math.floor(Math.random() * 10),
          teamContributions: Math.floor(Math.random() * 20),
          totalActiveTime: Math.floor(Math.random() * 3000),
          averageSessionTime: Math.floor(Math.random() * 60),
          longestStreak: Math.floor(Math.random() * 25),
          currentStreak: Math.floor(Math.random() * 15),
          sportRanks: {}
        };

        return leaderboardService.updateUserRankingData(`perf-user-${i}`, stats);
      });

      await Promise.all(promises);

      const leaderboard = await leaderboardService.getLeaderboard(
        LeaderboardType.ENGAGEMENT_SCORE,
        LeaderboardPeriod.ALL_TIME
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(leaderboard.entries.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
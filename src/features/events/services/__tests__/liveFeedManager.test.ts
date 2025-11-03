import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { liveFeedManager, LiveFeedError } from '@features/events/services/liveFeedManager';
import { webSocketService } from '@features/events/services/webSocketService';
import { ActivityType, Priority } from '@features/events/types/realtime.types';

// Mock the webSocketService
vi.mock('../webSocketService', () => ({
  webSocketService: {
    publish: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    isConnected: vi.fn(() => true)
  }
}));

describe('LiveFeedManager', () => {
  const testEventId = 'test-event-123';
  const testUserId = 'test-user-456';
  const testUserName = 'Test User';

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Clear any existing feeds
    liveFeedManager.clearFeed(testEventId);
  });

  afterEach(() => {
    liveFeedManager.clearFeed(testEventId);
  });

  describe('Feed Initialization', () => {
    it('should initialize a new feed', () => {
      const feed = liveFeedManager.initializeFeed(testEventId);

      expect(feed).toMatchObject({
        eventId: testEventId,
        activities: [],
        participantCount: 0,
        activeUsers: []
      });
    });

    it('should return existing feed if already initialized', () => {
      const feed1 = liveFeedManager.initializeFeed(testEventId);
      const feed2 = liveFeedManager.initializeFeed(testEventId);

      expect(feed1).toBe(feed2);
    });

    it('should track active feeds', () => {
      liveFeedManager.initializeFeed(testEventId);
      const activeFeeds = liveFeedManager.getActiveFeeds();

      expect(activeFeeds).toContain(testEventId);
    });
  });

  describe('Activity Publishing', () => {
    beforeEach(() => {
      liveFeedManager.initializeFeed(testEventId);
    });

    it('should publish activity successfully', async () => {
      const activity = liveFeedManager.createUserJoinedActivity(
        testEventId,
        testUserId,
        testUserName,
        'going'
      );

      await liveFeedManager.publishActivity(activity);

      const recentActivities = liveFeedManager.getRecentActivities(testEventId, 10);
      expect(recentActivities).toHaveLength(1);
      expect(recentActivities[0]).toMatchObject({
        eventId: testEventId,
        userId: testUserId,
        userName: testUserName,
        type: ActivityType.USER_JOINED
      });
    });

    it('should broadcast activity via WebSocket', async () => {
      const activity = liveFeedManager.createUserJoinedActivity(
        testEventId,
        testUserId,
        testUserName,
        'going'
      );

      await liveFeedManager.publishActivity(activity);

      expect(webSocketService.publish).toHaveBeenCalledWith(
        `event:${testEventId}:feed`,
        activity
      );
      expect(webSocketService.publish).toHaveBeenCalledWith(
        'activities:all',
        activity
      );
    });

    it('should validate activity before publishing', async () => {
      const invalidActivity = {
        id: '',
        eventId: testEventId,
        userId: '',
        type: 'INVALID_TYPE' as ActivityType,
        data: {},
        timestamp: new Date(),
        priority: Priority.MEDIUM
      } as any;

      await expect(liveFeedManager.publishActivity(invalidActivity))
        .rejects.toThrow(LiveFeedError);
    });

    it('should maintain activity limit per feed', async () => {
      // Create more activities than the limit (100)
      for (let i = 0; i < 105; i++) {
        const activity = liveFeedManager.createUserJoinedActivity(
          testEventId,
          `user-${i}`,
          `User ${i}`,
          'going'
        );
        await liveFeedManager.publishActivity(activity);
      }

      const recentActivities = liveFeedManager.getRecentActivities(testEventId, 200);
      expect(recentActivities.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Activity Creation Methods', () => {
    it('should create user joined activity', () => {
      const activity = liveFeedManager.createUserJoinedActivity(
        testEventId,
        testUserId,
        testUserName,
        'going'
      );

      expect(activity).toMatchObject({
        eventId: testEventId,
        userId: testUserId,
        userName: testUserName,
        type: ActivityType.USER_JOINED,
        data: { participationType: 'going' },
        priority: Priority.MEDIUM
      });
    });

    it('should create user reaction activity', () => {
      const activity = liveFeedManager.createUserReactionActivity(
        testEventId,
        testUserId,
        testUserName,
        'event',
        'event-123',
        '❤️'
      );

      expect(activity).toMatchObject({
        eventId: testEventId,
        userId: testUserId,
        userName: testUserName,
        type: ActivityType.USER_REACTED,
        data: {
          targetType: 'event',
          targetId: 'event-123',
          reactionType: '❤️'
        },
        priority: Priority.LOW
      });
    });

    it('should create challenge completed activity', () => {
      const activity = liveFeedManager.createChallengeCompletedActivity(
        testEventId,
        testUserId,
        testUserName,
        'challenge-123',
        'Speed Challenge',
        95,
        1
      );

      expect(activity).toMatchObject({
        eventId: testEventId,
        userId: testUserId,
        userName: testUserName,
        type: ActivityType.CHALLENGE_COMPLETED,
        data: {
          challengeId: 'challenge-123',
          challengeName: 'Speed Challenge',
          score: 95,
          rank: 1
        },
        priority: Priority.HIGH
      });
    });

    it('should create achievement earned activity', () => {
      const activity = liveFeedManager.createAchievementEarnedActivity(
        testEventId,
        testUserId,
        testUserName,
        'achievement-123',
        'First Place',
        '/badges/first-place.png',
        'legendary'
      );

      expect(activity).toMatchObject({
        eventId: testEventId,
        userId: testUserId,
        userName: testUserName,
        type: ActivityType.ACHIEVEMENT_EARNED,
        data: {
          achievementId: 'achievement-123',
          achievementName: 'First Place',
          badgeUrl: '/badges/first-place.png',
          rarity: 'legendary'
        },
        priority: Priority.HIGH
      });
    });

    it('should create comment posted activity', () => {
      const longComment = 'This is a very long comment that exceeds 100 characters and should be truncated to show only the first 100 characters with ellipsis at the end';
      
      const activity = liveFeedManager.createCommentPostedActivity(
        testEventId,
        testUserId,
        testUserName,
        'comment-123',
        longComment,
        'event',
        'event-123'
      );

      expect(activity).toMatchObject({
        eventId: testEventId,
        userId: testUserId,
        userName: testUserName,
        type: ActivityType.COMMENT_POSTED,
        priority: Priority.MEDIUM
      });

      // Check that long content is truncated
      expect(activity.data.content).toHaveLength(103); // 100 chars + '...'
      expect(activity.data.content).toEndWith('...');
    });
  });

  describe('Activity Retrieval and Filtering', () => {
    beforeEach(async () => {
      liveFeedManager.initializeFeed(testEventId);

      // Create various activities for testing
      const activities = [
        liveFeedManager.createUserJoinedActivity(testEventId, 'user1', 'User 1', 'going'),
        liveFeedManager.createUserReactionActivity(testEventId, 'user2', 'User 2', 'event', 'event-123', '❤️'),
        liveFeedManager.createChallengeCompletedActivity(testEventId, 'user3', 'User 3', 'challenge-1', 'Challenge 1'),
        liveFeedManager.createAchievementEarnedActivity(testEventId, 'user4', 'User 4', 'achievement-1', 'Achievement 1', '/badge.png', 'rare')
      ];

      for (const activity of activities) {
        await liveFeedManager.publishActivity(activity);
      }
    });

    it('should retrieve recent activities with limit', () => {
      const activities = liveFeedManager.getRecentActivities(testEventId, 2);
      expect(activities).toHaveLength(2);
    });

    it('should filter activities by type', () => {
      const filter = {
        activityTypes: [ActivityType.USER_JOINED, ActivityType.CHALLENGE_COMPLETED]
      };

      const activities = liveFeedManager.getRecentActivities(testEventId, 10, filter);
      
      expect(activities).toHaveLength(2);
      expect(activities.every(a => 
        a.type === ActivityType.USER_JOINED || a.type === ActivityType.CHALLENGE_COMPLETED
      )).toBe(true);
    });

    it('should filter activities by user', () => {
      const filter = { userId: 'user2' };
      const activities = liveFeedManager.getRecentActivities(testEventId, 10, filter);
      
      expect(activities).toHaveLength(1);
      expect(activities[0].userId).toBe('user2');
    });

    it('should filter activities by priority', () => {
      const filter = { priority: Priority.HIGH };
      const activities = liveFeedManager.getRecentActivities(testEventId, 10, filter);
      
      expect(activities.every(a => a.priority === Priority.HIGH)).toBe(true);
    });

    it('should filter activities by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const filter = {
        timeRange: {
          start: oneHourAgo,
          end: now
        }
      };

      const activities = liveFeedManager.getRecentActivities(testEventId, 10, filter);
      expect(activities.length).toBeGreaterThan(0);
    });
  });

  describe('Participant and User Management', () => {
    beforeEach(() => {
      liveFeedManager.initializeFeed(testEventId);
    });

    it('should update participant count', () => {
      liveFeedManager.updateParticipantCount(testEventId, 25);
      
      const count = liveFeedManager.getParticipantCount(testEventId);
      expect(count).toBe(25);

      const feed = liveFeedManager.getLiveFeed(testEventId);
      expect(feed?.participantCount).toBe(25);
    });

    it('should manage active users', () => {
      liveFeedManager.addActiveUser(testEventId, 'user1');
      liveFeedManager.addActiveUser(testEventId, 'user2');
      
      let activeUsers = liveFeedManager.getActiveUsers(testEventId);
      expect(activeUsers).toEqual(['user1', 'user2']);

      liveFeedManager.removeActiveUser(testEventId, 'user1');
      activeUsers = liveFeedManager.getActiveUsers(testEventId);
      expect(activeUsers).toEqual(['user2']);
    });

    it('should broadcast participant count updates', () => {
      liveFeedManager.updateParticipantCount(testEventId, 30);

      expect(webSocketService.publish).toHaveBeenCalledWith(
        `event:${testEventId}:participants`,
        expect.objectContaining({
          type: ActivityType.LEADERBOARD_UPDATED,
          data: expect.objectContaining({
            newRank: 30
          })
        })
      );
    });
  });

  describe('WebSocket Integration', () => {
    beforeEach(() => {
      liveFeedManager.initializeFeed(testEventId);
    });

    it('should subscribe to feed updates', () => {
      const callback = vi.fn();
      liveFeedManager.subscribeToFeed(testEventId, callback);

      expect(webSocketService.subscribe).toHaveBeenCalledWith(
        `event:${testEventId}:feed`,
        callback
      );
    });

    it('should unsubscribe from feed updates', () => {
      const callback = vi.fn();
      liveFeedManager.unsubscribeFromFeed(testEventId, callback);

      expect(webSocketService.unsubscribe).toHaveBeenCalledWith(
        `event:${testEventId}:feed`,
        callback
      );
    });
  });

  describe('Feed Statistics', () => {
    beforeEach(async () => {
      liveFeedManager.initializeFeed(testEventId);
      
      // Add some test data
      const activity = liveFeedManager.createUserJoinedActivity(
        testEventId,
        testUserId,
        testUserName,
        'going'
      );
      await liveFeedManager.publishActivity(activity);
      
      liveFeedManager.updateParticipantCount(testEventId, 10);
      liveFeedManager.addActiveUser(testEventId, 'user1');
      liveFeedManager.addActiveUser(testEventId, 'user2');
    });

    it('should provide feed statistics', () => {
      const stats = liveFeedManager.getFeedStats(testEventId);

      expect(stats).toMatchObject({
        activityCount: 1,
        participantCount: 10,
        activeUserCount: 2
      });
    });

    it('should return null for non-existent feed', () => {
      const stats = liveFeedManager.getFeedStats('non-existent-event');
      expect(stats).toBeNull();
    });
  });

  describe('Feed Cleanup', () => {
    beforeEach(() => {
      liveFeedManager.initializeFeed(testEventId);
    });

    it('should clear feed data', () => {
      liveFeedManager.clearFeed(testEventId);

      const feed = liveFeedManager.getLiveFeed(testEventId);
      expect(feed).toBeNull();

      const activeFeeds = liveFeedManager.getActiveFeeds();
      expect(activeFeeds).not.toContain(testEventId);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid activity validation', async () => {
      liveFeedManager.initializeFeed(testEventId);

      const invalidActivity = {
        id: '',
        eventId: '',
        userId: '',
        type: 'INVALID' as ActivityType,
        data: {},
        timestamp: new Date(),
        priority: 'INVALID' as Priority
      } as any;

      await expect(liveFeedManager.publishActivity(invalidActivity))
        .rejects.toThrow(LiveFeedError);
    });

    it('should handle missing required fields', async () => {
      liveFeedManager.initializeFeed(testEventId);

      const incompleteActivity = {
        eventId: testEventId,
        type: ActivityType.USER_JOINED
        // Missing required fields
      } as any;

      await expect(liveFeedManager.publishActivity(incompleteActivity))
        .rejects.toThrow('Invalid activity: missing required fields');
    });
  });
});
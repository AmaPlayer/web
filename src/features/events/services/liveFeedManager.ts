import { Timestamp } from 'firebase/firestore';
import {
  ActivityEvent,
  ActivityType,
  Priority,
  LiveFeed,
  LiveFeedFilter,
  UserJoinedData,
  UserReactedData,
  ChallengeCompletedData,
  AchievementEarnedData,
  CommentPostedData
} from '@features/events/types/realtime.types';
import { webSocketService } from '@features/events/services/webSocketService';

// LiveFeed Error class for typed error responses
export class LiveFeedError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LiveFeedError';
  }
}

class LiveFeedManager {
  private feeds: Map<string, LiveFeed> = new Map();
  private activityStorage: Map<string, ActivityEvent[]> = new Map();
  private participantCounts: Map<string, number> = new Map();
  private activeUsers: Map<string, Set<string>> = new Map();
  
  // Configuration
  private readonly MAX_ACTIVITIES_PER_FEED = 100;
  private readonly ACTIVITY_RETENTION_HOURS = 24;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  private cleanupInterval: number | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Initialize live feed for an event
   */
  initializeFeed(eventId: string): LiveFeed {
    if (this.feeds.has(eventId)) {
      return this.feeds.get(eventId)!;
    }

    const feed: LiveFeed = {
      eventId,
      activities: [],
      participantCount: 0,
      activeUsers: [],
      lastUpdated: Timestamp.now()
    };

    this.feeds.set(eventId, feed);
    this.activityStorage.set(eventId, []);
    this.participantCounts.set(eventId, 0);
    this.activeUsers.set(eventId, new Set());

    return feed;
  }

  /**
   * Publish activity to event feed
   */
  async publishActivity(activity: ActivityEvent): Promise<void> {
    try {
      // Validate activity
      this.validateActivity(activity);

      // Ensure feed exists
      if (!this.feeds.has(activity.eventId)) {
        this.initializeFeed(activity.eventId);
      }

      // Add activity to storage
      const activities = this.activityStorage.get(activity.eventId)!;
      activities.push(activity);

      // Maintain activity limit
      if (activities.length > this.MAX_ACTIVITIES_PER_FEED) {
        activities.splice(0, activities.length - this.MAX_ACTIVITIES_PER_FEED);
      }

      // Update feed
      const feed = this.feeds.get(activity.eventId)!;
      feed.activities = [...activities];
      feed.lastUpdated = Timestamp.now();

      // Update participant count and active users based on activity type
      this.updateFeedMetrics(activity);

      // Broadcast activity via WebSocket
      const channel = `event:${activity.eventId}:feed`;
      webSocketService.publish(channel, activity);

      // Also broadcast to general activity channel
      webSocketService.publish('activities:all', activity);

    } catch (error) {
      throw new LiveFeedError(500, 'Failed to publish activity', error);
    }
  }

  /**
   * Get recent activities for an event
   */
  getRecentActivities(eventId: string, limit: number = 50, filter?: LiveFeedFilter): ActivityEvent[] {
    const activities = this.activityStorage.get(eventId) || [];
    
    let filteredActivities = [...activities];

    // Apply filters
    if (filter) {
      filteredActivities = this.applyFilters(filteredActivities, filter);
    }

    // Sort by timestamp (newest first) and limit
    return filteredActivities
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
      .slice(0, limit);
  }

  /**
   * Get live feed for an event
   */
  getLiveFeed(eventId: string): LiveFeed | null {
    return this.feeds.get(eventId) || null;
  }

  /**
   * Subscribe to live feed updates
   */
  subscribeToFeed(eventId: string, callback: (activity: ActivityEvent) => void): void {
    const channel = `event:${eventId}:feed`;
    webSocketService.subscribe(channel, callback);
  }

  /**
   * Unsubscribe from live feed updates
   */
  unsubscribeFromFeed(eventId: string, callback?: (activity: ActivityEvent) => void): void {
    const channel = `event:${eventId}:feed`;
    webSocketService.unsubscribe(channel, callback);
  }

  /**
   * Update participant count for an event
   */
  updateParticipantCount(eventId: string, count: number): void {
    this.participantCounts.set(eventId, count);
    
    const feed = this.feeds.get(eventId);
    if (feed) {
      feed.participantCount = count;
      feed.lastUpdated = Timestamp.now();

      // Broadcast participant count update
      const countUpdateActivity: ActivityEvent = {
        id: this.generateActivityId(),
        eventId,
        userId: 'system',
        userName: 'System',
        type: ActivityType.LEADERBOARD_UPDATED,
        data: {
          leaderboardType: 'participant_count',
          newRank: count,
          change: 'same'
        },
        timestamp: Timestamp.now(),
        priority: Priority.LOW
      };

      const channel = `event:${eventId}:participants`;
      webSocketService.publish(channel, countUpdateActivity);
    }
  }

  /**
   * Add user to active users list
   */
  addActiveUser(eventId: string, userId: string): void {
    if (!this.activeUsers.has(eventId)) {
      this.activeUsers.set(eventId, new Set());
    }

    const users = this.activeUsers.get(eventId)!;
    users.add(userId);

    const feed = this.feeds.get(eventId);
    if (feed) {
      feed.activeUsers = Array.from(users);
      feed.lastUpdated = Timestamp.now();
    }
  }

  /**
   * Remove user from active users list
   */
  removeActiveUser(eventId: string, userId: string): void {
    const users = this.activeUsers.get(eventId);
    if (users) {
      users.delete(userId);

      const feed = this.feeds.get(eventId);
      if (feed) {
        feed.activeUsers = Array.from(users);
        feed.lastUpdated = Timestamp.now();
      }
    }
  }

  /**
   * Get participant count for an event
   */
  getParticipantCount(eventId: string): number {
    return this.participantCounts.get(eventId) || 0;
  }

  /**
   * Get active users for an event
   */
  getActiveUsers(eventId: string): string[] {
    const users = this.activeUsers.get(eventId);
    return users ? Array.from(users) : [];
  }

  /**
   * Create activity for user joining event
   */
  createUserJoinedActivity(eventId: string, userId: string, userName: string, participationType: 'going' | 'interested' | 'maybe'): ActivityEvent {
    const data: UserJoinedData = { participationType };
    
    return {
      id: this.generateActivityId(),
      eventId,
      userId,
      userName,
      type: ActivityType.USER_JOINED,
      data,
      timestamp: Timestamp.now(),
      priority: Priority.MEDIUM
    };
  }

  /**
   * Create activity for user reaction
   */
  createUserReactionActivity(eventId: string, userId: string, userName: string, targetType: 'event' | 'comment' | 'submission', targetId: string, reactionType: string): ActivityEvent {
    const data: UserReactedData = {
      targetType,
      targetId,
      reactionType
    };

    return {
      id: this.generateActivityId(),
      eventId,
      userId,
      userName,
      type: ActivityType.USER_REACTED,
      data,
      timestamp: Timestamp.now(),
      priority: Priority.LOW
    };
  }

  /**
   * Create activity for challenge completion
   */
  createChallengeCompletedActivity(eventId: string, userId: string, userName: string, challengeId: string, challengeName: string, score?: number, rank?: number): ActivityEvent {
    const data: ChallengeCompletedData = {
      challengeId,
      challengeName,
      score,
      rank
    };

    return {
      id: this.generateActivityId(),
      eventId,
      userId,
      userName,
      type: ActivityType.CHALLENGE_COMPLETED,
      data,
      timestamp: Timestamp.now(),
      priority: Priority.HIGH
    };
  }

  /**
   * Create activity for achievement earned
   */
  createAchievementEarnedActivity(eventId: string, userId: string, userName: string, achievementId: string, achievementName: string, badgeUrl: string, rarity: string): ActivityEvent {
    const data: AchievementEarnedData = {
      achievementId,
      achievementName,
      badgeUrl,
      rarity
    };

    return {
      id: this.generateActivityId(),
      eventId,
      userId,
      userName,
      type: ActivityType.ACHIEVEMENT_EARNED,
      data,
      timestamp: Timestamp.now(),
      priority: Priority.HIGH
    };
  }

  /**
   * Create activity for comment posted
   */
  createCommentPostedActivity(eventId: string, userId: string, userName: string, commentId: string, content: string, targetType: 'event' | 'submission', targetId: string): ActivityEvent {
    const data: CommentPostedData = {
      commentId,
      content: content.length > 100 ? content.substring(0, 100) + '...' : content,
      targetType,
      targetId
    };

    return {
      id: this.generateActivityId(),
      eventId,
      userId,
      userName,
      type: ActivityType.COMMENT_POSTED,
      data,
      timestamp: Timestamp.now(),
      priority: Priority.MEDIUM
    };
  }

  /**
   * Clear feed for an event
   */
  clearFeed(eventId: string): void {
    this.feeds.delete(eventId);
    this.activityStorage.delete(eventId);
    this.participantCounts.delete(eventId);
    this.activeUsers.delete(eventId);
  }

  /**
   * Get all active feeds
   */
  getActiveFeeds(): string[] {
    return Array.from(this.feeds.keys());
  }

  /**
   * Get feed statistics
   */
  getFeedStats(eventId: string): { activityCount: number; participantCount: number; activeUserCount: number } | null {
    const activities = this.activityStorage.get(eventId);
    const participantCount = this.participantCounts.get(eventId) || 0;
    const activeUsers = this.activeUsers.get(eventId);

    if (!activities) {
      return null;
    }

    return {
      activityCount: activities.length,
      participantCount,
      activeUserCount: activeUsers ? activeUsers.size : 0
    };
  }

  /**
   * Validate activity data
   */
  private validateActivity(activity: ActivityEvent): void {
    if (!activity.id || !activity.eventId || !activity.userId || !activity.type) {
      throw new LiveFeedError(400, 'Invalid activity: missing required fields');
    }

    if (!Object.values(ActivityType).includes(activity.type)) {
      throw new LiveFeedError(400, 'Invalid activity type');
    }

    if (!Object.values(Priority).includes(activity.priority)) {
      throw new LiveFeedError(400, 'Invalid activity priority');
    }
  }

  /**
   * Apply filters to activities
   */
  private applyFilters(activities: ActivityEvent[], filter: LiveFeedFilter): ActivityEvent[] {
    let filtered = activities;

    if (filter.activityTypes && filter.activityTypes.length > 0) {
      filtered = filtered.filter(activity => filter.activityTypes!.includes(activity.type));
    }

    if (filter.userId) {
      filtered = filtered.filter(activity => activity.userId === filter.userId);
    }

    if (filter.priority) {
      filtered = filtered.filter(activity => activity.priority === filter.priority);
    }

    if (filter.timeRange) {
      const start = new Date(filter.timeRange.start);
      const end = new Date(filter.timeRange.end);
      filtered = filtered.filter(activity => {
        const activityTime = activity.timestamp.toMillis();
        return activityTime >= start.getTime() && activityTime <= end.getTime();
      });
    }

    return filtered;
  }

  /**
   * Update feed metrics based on activity
   */
  private updateFeedMetrics(activity: ActivityEvent): void {
    const feed = this.feeds.get(activity.eventId);
    if (!feed) return;

    // Update active users
    this.addActiveUser(activity.eventId, activity.userId);

    // Update participant count for join activities
    if (activity.type === ActivityType.USER_JOINED) {
      const currentCount = this.getParticipantCount(activity.eventId);
      this.updateParticipantCount(activity.eventId, currentCount + 1);
    }
  }

  /**
   * Generate unique activity ID
   */
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup interval to remove old activities
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupOldActivities();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Clean up old activities
   */
  private cleanupOldActivities(): void {
    const cutoffTime = new Date(Date.now() - (this.ACTIVITY_RETENTION_HOURS * 60 * 60 * 1000));

    for (const [eventId, activities] of this.activityStorage.entries()) {
      const filteredActivities = activities.filter(activity => 
        activity.timestamp.toMillis() > cutoffTime.getTime()
      );

      if (filteredActivities.length !== activities.length) {
        this.activityStorage.set(eventId, filteredActivities);
        
        const feed = this.feeds.get(eventId);
        if (feed) {
          feed.activities = [...filteredActivities];
          feed.lastUpdated = Timestamp.now();
        }
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const liveFeedManager = new LiveFeedManager();
export default liveFeedManager;
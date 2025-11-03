import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityEvent, ActivityType, Priority, LiveFeedFilter } from '@features/events/types/realtime.types';
import { liveFeedManager } from '@features/events/services/liveFeedManager';
import { webSocketService } from '@features/events/services/webSocketService';
import { mobileOptimization, MobileOptimizationService } from '@features/events/utils/mobileOptimization';

interface LiveActivityFeedProps {
  eventId: string;
  maxItems?: number;
  autoScroll?: boolean;
  showFilters?: boolean;
  className?: string;
  onActivityClick?: (activity: ActivityEvent) => void;
  enablePagination?: boolean;
  pageSize?: number;
  enableVirtualization?: boolean;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  eventId,
  maxItems = 50,
  autoScroll = true,
  showFilters = false,
  className = '',
  onActivityClick,
  enablePagination = true,
  pageSize = 20,
  enableVirtualization = false
}) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<LiveFeedFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Virtualization state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize });
  const [itemHeight] = useState(80); // Estimated height per activity item
  
  const feedRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const loadMoreTrigger = useRef<HTMLDivElement>(null);
  
  // Mobile optimization state
  const [deviceCapabilities] = useState(() => MobileOptimizationService.detectDeviceCapabilities());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const swipeCleanup = useRef<(() => void) | null>(null);
  const pullToRefreshCleanup = useRef<(() => void) | null>(null);

  // Initialize feed and load existing activities
  useEffect(() => {
    const initializeFeed = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the feed
        liveFeedManager.initializeFeed(eventId);
        
        // Load initial page of activities
        const initialLimit = enablePagination ? pageSize : maxItems;
        const existingActivities = liveFeedManager.getRecentActivities(eventId, initialLimit, filter);
        setActivities(existingActivities);
        
        // Check if there are more activities
        const totalActivities = liveFeedManager.getRecentActivities(eventId, maxItems * 2, filter);
        setHasMoreActivities(totalActivities.length > existingActivities.length);
        
        // Get current metrics
        const stats = liveFeedManager.getFeedStats(eventId);
        if (stats) {
          setParticipantCount(stats.participantCount);
          setActiveUsers(liveFeedManager.getActiveUsers(eventId));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize live feed:', error);
        setIsLoading(false);
      }
    };

    initializeFeed();
  }, [eventId, maxItems, pageSize, enablePagination]);

  // Load more activities
  const loadMoreActivities = useCallback(async () => {
    if (isLoadingMore || !hasMoreActivities || !enablePagination) return;

    setIsLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * pageSize;
      const limit = pageSize;
      
      // Get more activities from the manager
      const allActivities = liveFeedManager.getRecentActivities(eventId, offset + limit, filter);
      const newActivities = allActivities.slice(offset, offset + limit);
      
      if (newActivities.length > 0) {
        setActivities(prev => [...prev, ...newActivities]);
        setCurrentPage(nextPage);
        
        // Check if there are more activities
        const totalActivities = liveFeedManager.getRecentActivities(eventId, (nextPage + 2) * pageSize, filter);
        setHasMoreActivities(totalActivities.length > (nextPage + 1) * pageSize);
      } else {
        setHasMoreActivities(false);
      }
    } catch (error) {
      console.error('Failed to load more activities:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, pageSize, eventId, filter, isLoadingMore, hasMoreActivities, enablePagination]);

  // Handle virtualization scroll
  const handleVirtualScroll = useCallback(() => {
    if (!enableVirtualization || !feedRef.current) return;

    const scrollTop = feedRef.current.scrollTop;
    const containerHeight = feedRef.current.clientHeight;
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 5, // Buffer
      activities.length
    );

    setVisibleRange({ start: Math.max(0, startIndex - 5), end: endIndex });
  }, [enableVirtualization, itemHeight, activities.length]);

  // Handle new activities from WebSocket
  const handleNewActivity = useCallback((activity: ActivityEvent) => {
    setActivities(prev => {
      const newActivities = [activity, ...prev];
      const limit = enablePagination ? (currentPage + 1) * pageSize + 1 : maxItems;
      return newActivities.slice(0, limit);
    });

    // Update metrics if needed
    if (activity.type === ActivityType.USER_JOINED) {
      setParticipantCount(prev => prev + 1);
    }
  }, [maxItems, enablePagination, currentPage, pageSize]);

  // Handle participant count updates
  const handleParticipantUpdate = useCallback((activity: ActivityEvent) => {
    if (activity.data && 'newRank' in activity.data) {
      setParticipantCount(activity.data.newRank as number);
    }
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        if (!webSocketService.isConnected()) {
          await webSocketService.connect('current-user'); // In real app, use actual user ID
        }
        
        setIsConnected(true);
        
        // Subscribe to activity feed
        liveFeedManager.subscribeToFeed(eventId, handleNewActivity);
        
        // Subscribe to participant updates
        const participantChannel = `event:${eventId}:participants`;
        webSocketService.subscribe(participantChannel, handleParticipantUpdate);
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      // Cleanup subscriptions
      liveFeedManager.unsubscribeFromFeed(eventId, handleNewActivity);
      const participantChannel = `event:${eventId}:participants`;
      webSocketService.unsubscribe(participantChannel, handleParticipantUpdate);
    };
  }, [eventId, handleNewActivity, handleParticipantUpdate]);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (autoScroll && !isUserScrolling.current && lastActivityRef.current) {
      lastActivityRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities, autoScroll]);

  // Handle scroll detection
  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    
    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = window.setTimeout(() => {
      isUserScrolling.current = false;
    }, 1000);

    // Handle virtualization
    if (enableVirtualization) {
      handleVirtualScroll();
    }
  }, [enableVirtualization, handleVirtualScroll]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!enablePagination || !loadMoreTrigger.current) return;

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreActivities && !isLoadingMore) {
          loadMoreActivities();
        }
      },
      {
        root: feedRef.current,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    intersectionObserver.current.observe(loadMoreTrigger.current);

    return () => {
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect();
      }
    };
  }, [enablePagination, hasMoreActivities, isLoadingMore, loadMoreActivities]);

  // Setup mobile gestures
  useEffect(() => {
    if (!feedRef.current || !deviceCapabilities.hasTouch) return;

    // Setup swipe gestures for navigation
    swipeCleanup.current = mobileOptimization.setupSwipeGestures(
      feedRef.current,
      (swipe) => {
        if (swipe.direction === 'left' && swipe.velocity > 0.5) {
          // Swipe left - could trigger filter or navigation
          console.log('Swipe left detected');
        } else if (swipe.direction === 'right' && swipe.velocity > 0.5) {
          // Swipe right - could trigger back navigation
          console.log('Swipe right detected');
        }
      }
    );

    // Setup pull-to-refresh
    pullToRefreshCleanup.current = mobileOptimization.setupPullToRefresh(
      feedRef.current,
      async () => {
        setIsRefreshing(true);
        try {
          // Refresh the feed
          const refreshedActivities = liveFeedManager.getRecentActivities(
            eventId, 
            enablePagination ? pageSize : maxItems, 
            filter
          );
          setActivities(refreshedActivities);
          setCurrentPage(0);
          
          // Provide haptic feedback
          mobileOptimization.provideTactileFeedback([100, 50, 100]);
        } finally {
          setIsRefreshing(false);
        }
      }
    );

    return () => {
      swipeCleanup.current?.();
      pullToRefreshCleanup.current?.();
    };
  }, [eventId, enablePagination, pageSize, maxItems, filter, deviceCapabilities.hasTouch]);

  // Apply filters
  const handleFilterChange = useCallback((newFilter: Partial<LiveFeedFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    
    // Reset pagination
    setCurrentPage(0);
    setHasMoreActivities(true);
    
    // Reload activities with new filter
    const initialLimit = enablePagination ? pageSize : maxItems;
    const filteredActivities = liveFeedManager.getRecentActivities(eventId, initialLimit, updatedFilter);
    setActivities(filteredActivities);
    
    // Check if there are more activities
    const totalActivities = liveFeedManager.getRecentActivities(eventId, maxItems * 2, updatedFilter);
    setHasMoreActivities(totalActivities.length > filteredActivities.length);
  }, [eventId, filter, maxItems, enablePagination, pageSize]);

  // Format activity timestamp
  const formatTimestamp = (timestamp: any) => {
    const now = new Date();
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Get activity icon
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.USER_JOINED: return '👋';
      case ActivityType.USER_REACTED: return '❤️';
      case ActivityType.CHALLENGE_COMPLETED: return '🏆';
      case ActivityType.ACHIEVEMENT_EARNED: return '🏅';
      case ActivityType.COMMENT_POSTED: return '💬';
      case ActivityType.TEAM_FORMED: return '👥';
      case ActivityType.MENTORSHIP_STARTED: return '🤝';
      case ActivityType.LEADERBOARD_UPDATED: return '📊';
      case ActivityType.POLL_CREATED: return '📊';
      case ActivityType.POLL_VOTED: return '🗳️';
      default: return '📢';
    }
  };

  // Get activity message
  const getActivityMessage = (activity: ActivityEvent) => {
    const data = activity.data as any; // Type assertion for accessing dynamic properties
    
    switch (activity.type) {
      case ActivityType.USER_JOINED:
        return `joined the event`;
      case ActivityType.USER_REACTED:
        return `reacted to ${data.targetType || 'content'}`;
      case ActivityType.CHALLENGE_COMPLETED:
        return `completed challenge "${data.challengeName || 'Unknown Challenge'}"`;
      case ActivityType.ACHIEVEMENT_EARNED:
        return `earned "${data.achievementName || 'Achievement'}" badge`;
      case ActivityType.COMMENT_POSTED:
        return `commented on ${data.targetType || 'content'}`;
      case ActivityType.TEAM_FORMED:
        return `formed team "${data.teamName || 'Team'}"`;
      case ActivityType.MENTORSHIP_STARTED:
        return `started mentorship with ${data.mentorName || 'mentor'}`;
      case ActivityType.LEADERBOARD_UPDATED:
        return `moved to rank #${data.newRank || 'N/A'}`;
      case ActivityType.POLL_CREATED:
        return `created a poll: "${data.question || 'Poll'}"`;
      case ActivityType.POLL_VOTED:
        return `voted on poll`;
      default:
        return 'performed an action';
    }
  };

  // Get priority class
  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'activity-urgent';
      case Priority.HIGH: return 'activity-high';
      case Priority.MEDIUM: return 'activity-medium';
      case Priority.LOW: return 'activity-low';
      default: return 'activity-medium';
    }
  };

  if (isLoading) {
    return (
      <div className={`live-activity-feed loading ${className}`}>
        <div className="feed-header">
          <h3>Live Activity</h3>
          <div className="connection-status connecting">Connecting...</div>
        </div>
        <div className="feed-loading">
          <div className="loading-spinner"></div>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`live-activity-feed ${className}`}>
      {/* Feed Header */}
      <div className="feed-header">
        <div className="feed-title">
          <h3>Live Activity</h3>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isRefreshing ? 'Refreshing...' : isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        
        <div className="feed-metrics">
          <div className="metric">
            <span className="metric-icon">👥</span>
            <span className="metric-value">{participantCount}</span>
          </div>
          <div className="metric">
            <span className="metric-icon">🟢</span>
            <span className="metric-value">{activeUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="feed-filters">
          <select
            value={filter.priority || ''}
            onChange={(e) => handleFilterChange({ priority: e.target.value as Priority || undefined })}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value={Priority.URGENT}>Urgent</option>
            <option value={Priority.HIGH}>High</option>
            <option value={Priority.MEDIUM}>Medium</option>
            <option value={Priority.LOW}>Low</option>
          </select>
          
          <select
            value={filter.activityTypes?.[0] || ''}
            onChange={(e) => handleFilterChange({ 
              activityTypes: e.target.value ? [e.target.value as ActivityType] : undefined 
            })}
            className="filter-select"
          >
            <option value="">All Activities</option>
            <option value={ActivityType.USER_JOINED}>Joins</option>
            <option value={ActivityType.USER_REACTED}>Reactions</option>
            <option value={ActivityType.CHALLENGE_COMPLETED}>Challenges</option>
            <option value={ActivityType.ACHIEVEMENT_EARNED}>Achievements</option>
            <option value={ActivityType.COMMENT_POSTED}>Comments</option>
          </select>
        </div>
      )}

      {/* Activity Feed */}
      <div 
        className="feed-content" 
        ref={feedRef}
        onScroll={handleScroll}
      >
        {activities.length === 0 ? (
          <div className="feed-empty">
            <div className="empty-icon">📢</div>
            <p>No activities yet. Be the first to engage!</p>
          </div>
        ) : (
          <div className="activity-list">
            {enableVirtualization ? (
              // Virtualized rendering
              <>
                {/* Spacer for items before visible range */}
                <div style={{ height: visibleRange.start * itemHeight }} />
                
                {activities.slice(visibleRange.start, visibleRange.end).map((activity, index) => {
                  const actualIndex = visibleRange.start + index;
                  return (
                    <div
                      key={activity.id}
                      className={`activity-item ${getPriorityClass(activity.priority)} animate-in`}
                      onClick={() => onActivityClick?.(activity)}
                      role={onActivityClick ? 'button' : undefined}
                      tabIndex={onActivityClick ? 0 : undefined}
                      style={{ height: itemHeight }}
                      ref={actualIndex === activities.length - 1 ? lastActivityRef : undefined}
                    >
                      <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="activity-content">
                        <div className="activity-main">
                          <span className="activity-user">{activity.userName}</span>
                          <span className="activity-message">{getActivityMessage(activity)}</span>
                        </div>
                        
                        <div className="activity-meta">
                          <span className="activity-time">{formatTimestamp(activity.timestamp)}</span>
                          {activity.priority === Priority.HIGH && (
                            <span className="priority-badge">High</span>
                          )}
                          {activity.priority === Priority.URGENT && (
                            <span className="priority-badge urgent">Urgent</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Spacer for items after visible range */}
                <div style={{ height: (activities.length - visibleRange.end) * itemHeight }} />
              </>
            ) : (
              // Regular rendering
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`activity-item ${getPriorityClass(activity.priority)} animate-in`}
                  onClick={() => onActivityClick?.(activity)}
                  role={onActivityClick ? 'button' : undefined}
                  tabIndex={onActivityClick ? 0 : undefined}
                  ref={index === activities.length - 1 ? lastActivityRef : undefined}
                >
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="activity-content">
                    <div className="activity-main">
                      <span className="activity-user">{activity.userName}</span>
                      <span className="activity-message">{getActivityMessage(activity)}</span>
                    </div>
                    
                    <div className="activity-meta">
                      <span className="activity-time">{formatTimestamp(activity.timestamp)}</span>
                      {activity.priority === Priority.HIGH && (
                        <span className="priority-badge">High</span>
                      )}
                      {activity.priority === Priority.URGENT && (
                        <span className="priority-badge urgent">Urgent</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Load more trigger for infinite scroll */}
            {enablePagination && hasMoreActivities && (
              <div 
                ref={loadMoreTrigger}
                className="load-more-trigger"
                style={{ height: '20px', margin: '10px 0' }}
              >
                {isLoadingMore && (
                  <div className="loading-more">
                    <div className="loading-spinner small"></div>
                    <span>Loading more activities...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="feed-footer">
        <button 
          className="scroll-to-bottom"
          onClick={() => lastActivityRef.current?.scrollIntoView({ behavior: 'smooth' })}
          disabled={activities.length === 0}
        >
          Scroll to Latest
        </button>
      </div>
    </div>
  );
};
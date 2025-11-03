import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveActivityFeed } from '@features/events/components/common/LiveActivityFeed';
import { liveFeedManager } from '../../../services/liveFeedManager';
import { webSocketService } from '../../../services/webSocketService';
import { ActivityType, Priority } from '../../../types/realtime.types';

// Mock the services
vi.mock('../../../services/liveFeedManager', () => ({
  liveFeedManager: {
    initializeFeed: vi.fn(),
    getRecentActivities: vi.fn(() => []),
    getFeedStats: vi.fn(() => ({ activityCount: 0, participantCount: 0, activeUserCount: 0 })),
    getActiveUsers: vi.fn(() => []),
    subscribeToFeed: vi.fn(),
    unsubscribeFromFeed: vi.fn()
  }
}));

vi.mock('../../../services/webSocketService', () => ({
  webSocketService: {
    isConnected: vi.fn(() => false),
    connect: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  }
}));

vi.mock('../../../utils/mobileOptimization', () => ({
  mobileOptimization: {
    setupSwipeGestures: vi.fn(() => vi.fn()),
    setupPullToRefresh: vi.fn(() => vi.fn()),
    provideTactileFeedback: vi.fn()
  },
  MobileOptimizationService: {
    detectDeviceCapabilities: vi.fn(() => ({ hasTouch: false }))
  }
}));

describe('LiveActivityFeed', () => {
  const defaultProps = {
    eventId: 'test-event-123'
  };

  const mockActivity = {
    id: 'activity-1',
    eventId: 'test-event-123',
    userId: 'user-1',
    userName: 'Test User',
    type: ActivityType.USER_JOINED,
    data: { participationType: 'going' },
    timestamp: new Date(),
    priority: Priority.MEDIUM
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns
    (liveFeedManager.getRecentActivities as any).mockReturnValue([]);
    (liveFeedManager.getFeedStats as any).mockReturnValue({
      activityCount: 0,
      participantCount: 5,
      activeUserCount: 2
    });
    (webSocketService.isConnected as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component with title', () => {
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });

    it('should render empty state when no activities', () => {
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('No activities yet. Be the first to engage!')).toBeInTheDocument();
    });

    it('should render activities when available', () => {
      (liveFeedManager.getRecentActivities as any).mockReturnValue([mockActivity]);
      
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('joined the event')).toBeInTheDocument();
    });

    it('should display connection status', () => {
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should display participant metrics', () => {
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('5')).toBeInTheDocument(); // participant count
      expect(screen.getByText('2')).toBeInTheDocument(); // active users
    });
  });

  describe('Activity Display', () => {
    it('should display different activity types correctly', () => {
      const activities = [
        {
          ...mockActivity,
          type: ActivityType.USER_JOINED,
          data: { participationType: 'going' }
        },
        {
          ...mockActivity,
          id: 'activity-2',
          type: ActivityType.CHALLENGE_COMPLETED,
          data: { challengeName: 'Speed Challenge' }
        },
        {
          ...mockActivity,
          id: 'activity-3',
          type: ActivityType.ACHIEVEMENT_EARNED,
          data: { achievementName: 'First Place' }
        }
      ];

      (liveFeedManager.getRecentActivities as any).mockReturnValue(activities);
      
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('joined the event')).toBeInTheDocument();
      expect(screen.getByText('completed challenge "Speed Challenge"')).toBeInTheDocument();
      expect(screen.getByText('earned "First Place" badge')).toBeInTheDocument();
    });

    it('should show priority badges for high priority activities', () => {
      const highPriorityActivity = {
        ...mockActivity,
        priority: Priority.HIGH
      };

      (liveFeedManager.getRecentActivities as any).mockReturnValue([highPriorityActivity]);
      
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should show urgent priority badges', () => {
      const urgentActivity = {
        ...mockActivity,
        priority: Priority.URGENT
      };

      (liveFeedManager.getRecentActivities as any).mockReturnValue([urgentActivity]);
      
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      const recentActivity = {
        ...mockActivity,
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      };

      (liveFeedManager.getRecentActivities as any).mockReturnValue([recentActivity]);
      
      render(<LiveActivityFeed {...defaultProps} />);
      
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      (liveFeedManager.getRecentActivities as any).mockReturnValue([mockActivity]);
    });

    it('should show filters when enabled', () => {
      render(<LiveActivityFeed {...defaultProps} showFilters={true} />);
      
      expect(screen.getByDisplayValue('All Priorities')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Activities')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      (liveFeedManager.getRecentActivities as any).mockReturnValue([mockActivity]);
    });

    it('should handle activity clicks when callback provided', () => {
      const onActivityClick = vi.fn();
      
      render(<LiveActivityFeed {...defaultProps} onActivityClick={onActivityClick} />);
      
      const activityItem = screen.getByText('Test User').closest('.activity-item');
      expect(activityItem).toBeInTheDocument();
      
      if (activityItem) {
        fireEvent.click(activityItem);
        expect(onActivityClick).toHaveBeenCalledWith(mockActivity);
      }
    });

    it('should render scroll button', () => {
      render(<LiveActivityFeed {...defaultProps} />);
      
      const scrollButton = screen.getByText('Scroll to Latest');
      expect(scrollButton).toBeInTheDocument();
    });

    it('should disable scroll button when no activities', () => {
      (liveFeedManager.getRecentActivities as any).mockReturnValue([]);
      
      render(<LiveActivityFeed {...defaultProps} />);
      
      const scrollButton = screen.getByText('Scroll to Latest');
      expect(scrollButton).toBeDisabled();
    });
  });
});
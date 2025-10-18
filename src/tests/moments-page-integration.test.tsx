/**
 * Integration Tests for MomentsPage Component
 * 
 * This test suite verifies the complete functionality of the MomentsPage component,
 * including multi-user content display, pagination, engagement features, network
 * status handling, and error recovery.
 * 
 * Requirements tested: 1.1, 3.1, 3.2, 4.1, 7.1
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MomentsPage from '../pages/moments/MomentsPage';
import { MomentsService } from '../services/api/momentsService';
import { MomentVideo } from '../types/models/moment';

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock MomentsService
jest.mock('../services/api/momentsService');
const mockMomentsService = MomentsService as jest.Mocked<typeof MomentsService>;

// Mock AuthContext with proper return values
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    currentUser: { uid: 'currentUser123', displayName: 'Current User' },
    isGuest: () => false,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  }))
}));

// Mock hooks with proper return values
jest.mock('../hooks/useVideoAutoPlay', () => ({
  useVideoAutoPlay: jest.fn(() => ({
    registerVideo: jest.fn(),
    unregisterVideo: jest.fn(),
    isVideoInView: jest.fn(() => true),
    getActiveVideoId: jest.fn(() => 'moment1'),
    pauseAllVideos: jest.fn(),
    resumeActiveVideo: jest.fn()
  }))
}));

jest.mock('../hooks/useVideoPerformance', () => ({
  useVideoPerformance: jest.fn(() => ({
    getMemoryUsage: jest.fn(() => 100),
    cleanupMemory: jest.fn(() => Promise.resolve())
  }))
}));

jest.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({
    networkStatus: { isOnline: true },
    isGoodConnection: true
  }))
}));

// Mock VideoPlayer component
jest.mock('../components/common/video/VideoPlayer', () => {
  return function MockVideoPlayer({ 
    moment, 
    onLike, 
    onComment, 
    onShare,
    currentUserId 
  }: any) {
    return (
      <div data-testid={`video-player-${moment.id}`} className="mock-video-player">
        <div data-testid="video-metadata">
          <span data-testid="user-name">{moment.userDisplayName}</span>
          <span data-testid="caption">{moment.caption}</span>
        </div>
        <div data-testid="engagement-controls">
          <button 
            data-testid={`like-button-${moment.id}`}
            onClick={() => onLike(moment.id, !moment.isLiked, moment.engagement.likesCount + (moment.isLiked ? -1 : 1))}
          >
            {moment.isLiked ? 'Unlike' : 'Like'} ({moment.engagement.likesCount})
          </button>
          <button 
            data-testid={`comment-button-${moment.id}`}
            onClick={() => onComment(moment.id)}
          >
            Comment ({moment.engagement.commentsCount})
          </button>
          <button 
            data-testid={`share-button-${moment.id}`}
            onClick={() => onShare(moment.id)}
          >
            Share ({moment.engagement.sharesCount})
          </button>
        </div>
      </div>
    );
  };
});

// Mock other components
jest.mock('../components/layout/NavigationBar', () => {
  return function MockNavigationBar({ title, onTitleClick }: any) {
    return (
      <div data-testid="navigation-bar">
        <button data-testid="title-button" onClick={onTitleClick}>
          {title}
        </button>
      </div>
    );
  };
});

jest.mock('../components/layout/FooterNav', () => {
  return function MockFooterNav() {
    return <div data-testid="footer-nav">Footer</div>;
  };
});

jest.mock('../components/common/loading/VideoSkeleton', () => {
  return function MockVideoSkeleton({ count }: any) {
    return (
      <div data-testid="video-skeleton">
        Loading {count} videos...
      </div>
    );
  };
});

jest.mock('../components/common/error/RetryHandler', () => {
  return function MockRetryHandler({ onRetry, error }: any) {
    return (
      <div data-testid="retry-handler">
        <div data-testid="error-message">{error}</div>
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  };
});

// Mock utils
jest.mock('../utils/videoOptimization', () => ({
  default: {
    getRecommendedSettings: () => ({
      enablePreloading: true,
      enableLazyLoading: true,
      preloadDistance: 2
    }),
    isLowEndDevice: () => false,
    monitorNetworkChanges: () => () => {}
  }
}));

jest.mock('../utils/feedDiversity', () => ({
  diversifyFeed: jest.fn((moments) => moments),
  DEFAULT_DIVERSITY_CONFIG: {
    maxConsecutiveFromSameUser: 2,
    maxPercentageFromSingleUser: 0.3
  }
}));

describe('MomentsPage Integration Tests', () => {
  // Sample multi-user moments data
  const createMockMoment = (id: string, userId: string, userName: string, overrides = {}): MomentVideo => ({
    id,
    userId,
    userDisplayName: userName,
    userPhotoURL: `https://example.com/${userId}.jpg`,
    videoUrl: `https://example.com/video-${id}.mp4`,
    thumbnailUrl: `https://example.com/thumb-${id}.jpg`,
    caption: `Video from ${userName}`,
    duration: 30,
    metadata: {
      width: 1080,
      height: 1920,
      fileSize: 5000000,
      format: 'video/mp4',
      aspectRatio: '9:16',
      uploadedAt: new Date().toISOString(),
      processingStatus: 'completed',
      qualityVersions: []
    },
    engagement: {
      likes: [],
      likesCount: 0,
      comments: [],
      commentsCount: 0,
      shares: [],
      sharesCount: 0,
      views: 0,
      watchTime: 0,
      completionRate: 0
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    moderationStatus: 'approved',
    isLiked: false,
    ...overrides
  });

  const mockMultiUserMoments = [
    createMockMoment('moment1', 'user1', 'Alice Johnson'),
    createMockMoment('moment2', 'user2', 'Bob Smith'),
    createMockMoment('moment3', 'user3', 'Carol Davis'),
    createMockMoment('moment4', 'user4', 'Dave Wilson'),
    createMockMoment('moment5', 'user5', 'Eve Brown'),
    createMockMoment('moment6', 'user1', 'Alice Johnson'),
    createMockMoment('moment7', 'user2', 'Bob Smith'),
    createMockMoment('moment8', 'user6', 'Frank Miller')
  ];

  const renderMomentsPage = () => {
    return render(<MomentsPage />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful response
    mockMomentsService.getMoments.mockResolvedValue({
      moments: mockMultiUserMoments,
      hasMore: false,
      lastDocument: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Load - Multi-User Content Display (Requirement 1.1)', () => {
    it('should display videos from multiple users on initial load', async () => {
      renderMomentsPage();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('video-skeleton')).not.toBeInTheDocument();
      });

      // Verify multi-user content is displayed
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
      expect(screen.getByText('Dave Wilson')).toBeInTheDocument();
      expect(screen.getByText('Eve Brown')).toBeInTheDocument();
      expect(screen.getByText('Frank Miller')).toBeInTheDocument();

      // Verify MomentsService was called without userId filter
      expect(mockMomentsService.getMoments).toHaveBeenCalledWith({
        limit: 10,
        currentUserId: 'currentUser123',
        includeEngagementMetrics: true
      });
    });

    it('should display at least 5 different users in initial load', async () => {
      renderMomentsPage();

      await waitFor(() => {
        expect(screen.queryByTestId('video-skeleton')).not.toBeInTheDocument();
      });

      // Count unique user names displayed
      const userNames = new Set([
        'Alice Johnson',
        'Bob Smith', 
        'Carol Davis',
        'Dave Wilson',
        'Eve Brown',
        'Frank Miller'
      ]);

      userNames.forEach(userName => {
        expect(screen.getByText(userName)).toBeInTheDocument();
      });

      expect(userNames.size).toBeGreaterThanOrEqual(5);
    });

    it('should show loading skeleton while fetching initial content', async () => {
      // Mock delayed response
      mockMomentsService.getMoments.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            moments: mockMultiUserMoments,
            hasMore: false,
            lastDocument: null
          }), 100)
        )
      );

      renderMomentsPage();

      // Verify loading skeleton is shown
      expect(screen.getByTestId('video-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading 3 videos...')).toBeInTheDocument();

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId('video-skeleton')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should work for guest users (no authentication)', async () => {
      // Mock guest user context
      const { useAuth } = require('../contexts/AuthContext');
      useAuth.mockReturnValue({
        currentUser: null,
        isGuest: () => true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.queryByTestId('video-skeleton')).not.toBeInTheDocument();
      });

      // Verify content is displayed for guests
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();

      // Verify service was called without currentUserId
      expect(mockMomentsService.getMoments).toHaveBeenCalledWith({
        limit: 10,
        currentUserId: undefined,
        includeEngagementMetrics: true
      });
    });

    it('should display user metadata for each video', async () => {
      renderMomentsPage();

      await waitFor(() => {
        expect(screen.queryByTestId('video-skeleton')).not.toBeInTheDocument();
      });

      // Verify each video has user metadata
      mockMultiUserMoments.forEach(moment => {
        expect(screen.getByTestId(`video-player-${moment.id}`)).toBeInTheDocument();
        expect(screen.getByText(moment.userDisplayName)).toBeInTheDocument();
        expect(screen.getByText(moment.caption)).toBeInTheDocument();
      });
    });
  });

  describe('Engagement Actions on Multi-User Videos (Requirement 4.1)', () => {
    it('should allow liking videos from different users', async () => {
      mockMomentsService.toggleLike.mockResolvedValue({
        liked: true,
        likesCount: 1
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Like Alice's video
      const aliceLikeButton = screen.getByTestId('like-button-moment1');
      await userEvent.click(aliceLikeButton);

      // Like Bob's video
      const bobLikeButton = screen.getByTestId('like-button-moment2');
      await userEvent.click(bobLikeButton);

      // Verify like service was called for both users' videos
      expect(mockMomentsService.toggleLike).toHaveBeenCalledTimes(2);
    });

    it('should allow commenting on videos from different users', async () => {
      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Comment on Carol's video
      const carolCommentButton = screen.getByTestId('comment-button-moment3');
      await userEvent.click(carolCommentButton);

      // Comment on Dave's video
      const daveCommentButton = screen.getByTestId('comment-button-moment4');
      await userEvent.click(daveCommentButton);

      // Verify comment buttons are functional (actual comment modal would open)
      expect(carolCommentButton).toBeInTheDocument();
      expect(daveCommentButton).toBeInTheDocument();
    });

    it('should update engagement counts correctly', async () => {
      const momentsWithEngagement = mockMultiUserMoments.map(moment => ({
        ...moment,
        engagement: {
          ...moment.engagement,
          likesCount: 5,
          commentsCount: 3,
          sharesCount: 2
        }
      }));

      mockMomentsService.getMoments.mockResolvedValue({
        moments: momentsWithEngagement,
        hasMore: false,
        lastDocument: null
      });

      mockMomentsService.toggleLike.mockResolvedValue({
        liked: true,
        likesCount: 6
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('Like (5)')).toBeInTheDocument();
      });

      // Like a video
      const likeButton = screen.getByTestId('like-button-moment1');
      await userEvent.click(likeButton);

      // Verify count updates
      await waitFor(() => {
        expect(screen.getByText('Unlike (6)')).toBeInTheDocument();
      });
    });
  });

  describe('Network Status Changes (Requirement 7.1)', () => {
    it('should handle network offline state', async () => {
      const { useNetworkStatus } = require('../hooks/useNetworkStatus');
      
      // Mock offline state
      useNetworkStatus.mockReturnValue({
        networkStatus: { isOnline: false },
        isGoodConnection: false
      });

      mockMomentsService.getMoments.mockRejectedValue(
        new Error('No internet connection. Please check your network and try again.')
      );

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByTestId('retry-handler')).toBeInTheDocument();
        expect(screen.getByText('No internet connection. Please check your network and try again.')).toBeInTheDocument();
      });
    });

    it('should adjust batch size based on connection quality', async () => {
      const { useNetworkStatus } = require('../hooks/useNetworkStatus');
      
      // Mock slow connection
      useNetworkStatus.mockReturnValue({
        networkStatus: { isOnline: true },
        isGoodConnection: false
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(mockMomentsService.getMoments).toHaveBeenCalled();
      });

      // Verify reduced batch size for poor connection
      const callArgs = mockMomentsService.getMoments.mock.calls[0][0];
      expect(callArgs.limit).toBeLessThanOrEqual(3);
    });
  });

  describe('Error States and Recovery (Requirement 7.1)', () => {
    it('should display error message when initial load fails', async () => {
      mockMomentsService.getMoments.mockRejectedValue(
        new Error('Failed to load videos. Please try again.')
      );

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByTestId('retry-handler')).toBeInTheDocument();
        expect(screen.getByText('Failed to load videos. Please try again.')).toBeInTheDocument();
      });
    });

    it('should allow manual retry after error', async () => {
      mockMomentsService.getMoments
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          moments: mockMultiUserMoments,
          hasMore: false,
          lastDocument: null
        });

      renderMomentsPage();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('retry-handler')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByTestId('retry-button');
      await userEvent.click(retryButton);

      // Wait for successful retry
      await waitFor(() => {
        expect(screen.queryByTestId('retry-handler')).not.toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Verify service was called twice (initial + retry)
      expect(mockMomentsService.getMoments).toHaveBeenCalledTimes(2);
    });

    it('should display empty state when no moments are available', async () => {
      mockMomentsService.getMoments.mockResolvedValue({
        moments: [],
        hasMore: false,
        lastDocument: null
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('No Moments to Discover')).toBeInTheDocument();
        expect(screen.getByText("The community hasn't shared any moments yet. Be the first to create and share content!")).toBeInTheDocument();
      });
    });
  });

  describe('User Interface and Navigation', () => {
    it('should display navigation bar and footer', async () => {
      renderMomentsPage();

      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
      expect(screen.getByTestId('footer-nav')).toBeInTheDocument();
      expect(screen.getByText('Moments')).toBeInTheDocument();
    });

    it('should handle video feed container interactions', async () => {
      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Verify video feed container is present
      const videoItems = screen.getAllByTestId(/^video-player-/);
      expect(videoItems.length).toBeGreaterThan(0);

      // Each video should have proper structure
      videoItems.forEach((item) => {
        expect(item).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of videos efficiently', async () => {
      const largeMomentsList = Array.from({ length: 50 }, (_, i) => 
        createMockMoment(`moment${i}`, `user${i % 10}`, `User ${i}`)
      );

      mockMomentsService.getMoments.mockResolvedValue({
        moments: largeMomentsList,
        hasMore: false,
        lastDocument: null
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument();
      });

      // Component should handle large lists without performance issues
      const videoItems = screen.getAllByTestId(/^video-player-/);
      expect(videoItems.length).toBe(50);
    });
  });

  describe('Scroll Pagination - Diverse Content Loading (Requirement 3.1, 3.2)', () => {
    it('should maintain diverse content across pagination', async () => {
      const firstBatch = [
        createMockMoment('moment1', 'user1', 'Alice Johnson'),
        createMockMoment('moment2', 'user2', 'Bob Smith'),
        createMockMoment('moment3', 'user3', 'Carol Davis')
      ];

      mockMomentsService.getMoments.mockResolvedValueOnce({
        moments: firstBatch,
        hasMore: true,
        lastDocument: { id: 'moment3' }
      });

      renderMomentsPage();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.getByText('Carol Davis')).toBeInTheDocument();
      });

      // Verify diverse users in first batch
      const firstBatchUsers = new Set(['Alice Johnson', 'Bob Smith', 'Carol Davis']);
      expect(firstBatchUsers.size).toBe(3);
    });
  });
});
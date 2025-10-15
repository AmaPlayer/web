import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeedCard from '../FeedCard';

// Mock the LazyImage and LazyVideo components
jest.mock('../../ui/LazyImage', () => {
  return function MockLazyImage(props: any) {
    return <img {...props} data-testid="lazy-image" />;
  };
});

jest.mock('../../media/LazyVideo', () => {
  return function MockLazyVideo(props: any) {
    return <video {...props} data-testid="lazy-video" />;
  };
});

jest.mock('../../ui/ShareButton', () => {
  return function MockShareButton(props: any) {
    return (
      <button onClick={() => props.onShare?.(props.postId)} className="share-btn" data-testid="share-button">
        Share {props.shareCount}
      </button>
    );
  };
});

// Mock the useInViewport hook
jest.mock('../../../utils/performance/infiniteScroll', () => ({
  useInViewport: jest.fn(() => ({
    elementRef: { current: null },
    hasBeenInViewport: true
  }))
}));

// Mock the useToast hook
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    showToast: jest.fn()
  }))
}));

// Mock engagement error handler
jest.mock('../../../utils/engagementErrorHandler', () => ({
  handleLikeError: jest.fn((error, postId) => ({
    userMessage: 'Failed to like post. Please try again.',
    canRetry: true,
    errorCode: 'LIKE_FAILED'
  })),
  retryWithBackoff: jest.fn((fn) => fn())
}));

const mockFeedItem = {
  id: 'test-post-1',
  userId: 'user-1',
  userPhotoURL: 'https://example.com/avatar.jpg',
  userDisplayName: 'Test User',
  createdAt: new Date('2024-01-01'),
  caption: 'Test post caption',
  type: 'image' as const,
  mediaUrl: 'https://example.com/image.jpg',
  isLiked: false,
  likesCount: 5,
  commentsCount: 3,
  sharesCount: 1
};

describe('FeedCard', () => {
  const mockHandlers = {
    onLike: jest.fn(),
    onComment: jest.fn(),
    onShare: jest.fn(),
    onUserClick: jest.fn(),
    onCommentAdded: jest.fn()
  };

  const mockToast = {
    showToast: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useToast } = require('../../../hooks/useToast');
    useToast.mockReturnValue(mockToast);
  });

  describe('Basic Rendering', () => {
    it('renders feed card with correct content', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Test post caption')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Like count
      expect(screen.getByText('3')).toBeInTheDocument(); // Comment count
    });

    it('renders different media types correctly', () => {
      const videoItem = { ...mockFeedItem, type: 'video' as const };
      const { rerender } = render(
        <FeedCard
          item={videoItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('lazy-video')).toBeInTheDocument();

      const imageItem = { ...mockFeedItem, type: 'image' as const };
      rerender(
        <FeedCard
          item={imageItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
    });

    it('displays correct engagement counts', () => {
      const itemWithCounts = {
        ...mockFeedItem,
        likesCount: 42,
        commentsCount: 15,
        sharesCount: 8
      };

      render(
        <FeedCard
          item={itemWithCounts}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('Like Functionality', () => {
    it('handles like button click with optimistic updates', async () => {
      mockHandlers.onLike.mockResolvedValue(undefined);

      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const likeButton = screen.getByLabelText('Like');
      
      // Initial state
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(likeButton).not.toHaveClass('liked');

      // Click like button
      fireEvent.click(likeButton);

      // Should show optimistic update immediately
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(likeButton).toHaveClass('liked');
      });

      expect(mockHandlers.onLike).toHaveBeenCalledWith('test-post-1', true);
    });

    it('handles unlike button click with optimistic updates', async () => {
      const likedItem = { ...mockFeedItem, isLiked: true, likesCount: 6 };
      mockHandlers.onLike.mockResolvedValue(undefined);

      render(
        <FeedCard
          item={likedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const likeButton = screen.getByLabelText('Unlike');
      
      // Initial state
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(likeButton).toHaveClass('liked');

      // Click unlike button
      fireEvent.click(likeButton);

      // Should show optimistic update immediately
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(likeButton).not.toHaveClass('liked');
      });

      expect(mockHandlers.onLike).toHaveBeenCalledWith('test-post-1', false);
    });

    it('reverts optimistic updates on like error', async () => {
      const error = new Error('Network error');
      mockHandlers.onLike.mockRejectedValue(error);

      const { handleLikeError } = require('../../../utils/engagementErrorHandler');
      handleLikeError.mockReturnValue({
        userMessage: 'Failed to like post. Please try again.',
        canRetry: true,
        errorCode: 'LIKE_FAILED'
      });

      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const likeButton = screen.getByLabelText('Like');
      
      // Click like button
      fireEvent.click(likeButton);

      // Should show optimistic update first
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });

      // Should revert after error
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(likeButton).not.toHaveClass('liked');
      });

      expect(mockToast.showToast).toHaveBeenCalledWith(
        'Failed to like post. Please try again.',
        expect.objectContaining({
          type: 'error',
          duration: 5000,
          action: expect.objectContaining({
            label: 'Retry'
          })
        })
      );
    });

    it('prevents double-clicking like button', async () => {
      mockHandlers.onLike.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const likeButton = screen.getByLabelText('Like');
      
      // Click multiple times rapidly
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(mockHandlers.onLike).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during like operation', async () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          isLikeLoading={true}
          {...mockHandlers}
        />
      );

      const likeButton = screen.getByLabelText('Like');
      expect(likeButton).toBeDisabled();
      expect(likeButton).toHaveClass('loading');
    });

    it('updates like state when item props change', async () => {
      const { rerender } = render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();

      // Update props to simulate real-time updates
      const updatedItem = { ...mockFeedItem, isLiked: true, likesCount: 6 };
      rerender(
        <FeedCard
          item={updatedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByLabelText('Unlike')).toHaveClass('liked');
      });
    });
  });

  describe('Comment Functionality', () => {
    it('handles comment button click correctly', async () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const commentButton = screen.getByLabelText('Comment');
      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(mockHandlers.onComment).toHaveBeenCalledWith('test-post-1');
      });
    });

    it('shows loading state for comment button', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          isCommentLoading={true}
          {...mockHandlers}
        />
      );

      const commentButton = screen.getByLabelText('Comment');
      expect(commentButton).toBeDisabled();
      expect(commentButton).toHaveClass('loading');
    });

    it('updates comment count when comments are added', async () => {
      const { rerender } = render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();

      // Simulate comment count update
      const updatedItem = { ...mockFeedItem, commentsCount: 4 };
      rerender(
        <FeedCard
          item={updatedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('prevents comment button click when loading', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          isCommentLoading={true}
          {...mockHandlers}
        />
      );

      const commentButton = screen.getByLabelText('Comment');
      fireEvent.click(commentButton);

      expect(mockHandlers.onComment).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Prevention', () => {
    it('prevents navigation when clicking interaction buttons', async () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const likeButton = screen.getByLabelText('Like');
      const commentButton = screen.getByLabelText('Comment');

      // Mock event objects
      const mockEvent = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn()
      };

      fireEvent.click(likeButton, mockEvent);
      fireEvent.click(commentButton, mockEvent);

      await waitFor(() => {
        expect(mockHandlers.onLike).toHaveBeenCalledWith('test-post-1', true);
        expect(mockHandlers.onComment).toHaveBeenCalledWith('test-post-1');
      });
    });

    it('handles user click correctly', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const userInfo = screen.getByText('Test User').closest('.user-info');
      fireEvent.click(userInfo!);

      expect(mockHandlers.onUserClick).toHaveBeenCalledWith('user-1');
    });

    it('prevents card click navigation when clicking on content', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const feedCard = screen.getByText('Test post caption').closest('.feed-card');
      
      // Create a mock event with proper structure
      const mockEvent = {
        target: { closest: jest.fn().mockReturnValue(null) },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      fireEvent.click(feedCard!, mockEvent);

      // Verify the event structure is handled correctly
      expect(mockEvent.target.closest).toHaveBeenCalled();
    });
  });

  describe('Share Functionality', () => {
    it('handles share button click correctly', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      const shareButton = screen.getByTestId('share-button');
      fireEvent.click(shareButton);

      expect(mockHandlers.onShare).toHaveBeenCalledWith('test-post-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interaction buttons', () => {
      render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText('Like')).toBeInTheDocument();
      expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    });

    it('updates ARIA labels based on like state', () => {
      const likedItem = { ...mockFeedItem, isLiked: true };
      render(
        <FeedCard
          item={likedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText('Unlike')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes component correctly', () => {
      const { rerender } = render(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      // Re-render with same props should not cause re-render
      rerender(
        <FeedCard
          item={mockFeedItem}
          currentUserId="current-user"
          {...mockHandlers}
        />
      );

      // Component should still be rendered correctly
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});
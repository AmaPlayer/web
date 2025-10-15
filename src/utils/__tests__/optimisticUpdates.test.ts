// Tests for optimistic updates and error rollback functionality
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

// Mock engagement error handler
jest.mock('../engagementErrorHandler', () => ({
  handleLikeError: jest.fn((error, postId) => ({
    userMessage: 'Failed to like post. Please try again.',
    canRetry: true,
    errorCode: 'LIKE_FAILED'
  })),
  handleCommentError: jest.fn((error, postId, action) => ({
    userMessage: `Failed to ${action} comment. Please try again.`,
    canRetry: true,
    errorCode: 'COMMENT_FAILED'
  })),
  retryWithBackoff: jest.fn((fn) => fn())
}));

// Mock toast hook
const mockShowToast = jest.fn();
jest.mock('../../hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast })
}));

// Utility function to simulate optimistic updates with error handling
const useOptimisticLike = (initialLiked: boolean, initialCount: number, onLike: (liked: boolean) => Promise<void>) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    const originalLiked = liked;
    const originalCount = likeCount;
    const newLiked = !liked;

    // Optimistic update
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      await onLike(newLiked);
    } catch (err) {
      // Rollback on error
      setLiked(originalLiked);
      setLikeCount(originalCount);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    liked,
    likeCount,
    isLoading,
    error,
    handleLike
  };
};

// Utility function to simulate optimistic comment updates
const useOptimisticComment = (initialCount: number, onAddComment: (text: string) => Promise<void>) => {
  const [commentCount, setCommentCount] = useState(initialCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddComment = async (text: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const originalCount = commentCount;

    // Optimistic update
    setCommentCount(prev => prev + 1);

    try {
      await onAddComment(text);
    } catch (err) {
      // Rollback on error
      setCommentCount(originalCount);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    commentCount,
    isSubmitting,
    error,
    handleAddComment
  };
};

describe('Optimistic Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Like Optimistic Updates', () => {
    it('performs optimistic like update successfully', async () => {
      const mockOnLike = jest.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // Initial state
      expect(result.current.liked).toBe(false);
      expect(result.current.likeCount).toBe(5);
      expect(result.current.isLoading).toBe(false);

      // Perform like action
      await act(async () => {
        await result.current.handleLike();
      });

      // Should update optimistically and call API
      expect(result.current.liked).toBe(true);
      expect(result.current.likeCount).toBe(6);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockOnLike).toHaveBeenCalledWith(true);
    });

    it('performs optimistic unlike update successfully', async () => {
      const mockOnLike = jest.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useOptimisticLike(true, 6, mockOnLike)
      );

      // Initial state
      expect(result.current.liked).toBe(true);
      expect(result.current.likeCount).toBe(6);

      // Perform unlike action
      await act(async () => {
        await result.current.handleLike();
      });

      // Should update optimistically
      expect(result.current.liked).toBe(false);
      expect(result.current.likeCount).toBe(5);
      expect(mockOnLike).toHaveBeenCalledWith(false);
    });

    it('rolls back like update on error', async () => {
      const mockOnLike = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // Initial state
      expect(result.current.liked).toBe(false);
      expect(result.current.likeCount).toBe(5);

      // Perform like action that will fail
      await act(async () => {
        await result.current.handleLike();
      });

      // Should rollback to original state
      expect(result.current.liked).toBe(false);
      expect(result.current.likeCount).toBe(5);
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('prevents double-clicking during like operation', async () => {
      const mockOnLike = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // Start first like operation
      act(() => {
        result.current.handleLike();
      });

      expect(result.current.isLoading).toBe(true);

      // Try to like again while loading
      await act(async () => {
        await result.current.handleLike();
      });

      // Should only call API once
      expect(mockOnLike).toHaveBeenCalledTimes(1);
    });

    it('handles rapid like/unlike operations correctly', async () => {
      const mockOnLike = jest.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // Perform multiple rapid operations
      await act(async () => {
        await result.current.handleLike(); // Like
      });

      await act(async () => {
        await result.current.handleLike(); // Unlike
      });

      await act(async () => {
        await result.current.handleLike(); // Like again
      });

      // Final state should be liked
      expect(result.current.liked).toBe(true);
      expect(result.current.likeCount).toBe(6);
      expect(mockOnLike).toHaveBeenCalledTimes(3);
      expect(mockOnLike).toHaveBeenNthCalledWith(1, true);
      expect(mockOnLike).toHaveBeenNthCalledWith(2, false);
      expect(mockOnLike).toHaveBeenNthCalledWith(3, true);
    });
  });

  describe('Comment Optimistic Updates', () => {
    it('performs optimistic comment addition successfully', async () => {
      const mockOnAddComment = jest.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useOptimisticComment(3, mockOnAddComment)
      );

      // Initial state
      expect(result.current.commentCount).toBe(3);
      expect(result.current.isSubmitting).toBe(false);

      // Add comment
      await act(async () => {
        await result.current.handleAddComment('Great post!');
      });

      // Should update optimistically
      expect(result.current.commentCount).toBe(4);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockOnAddComment).toHaveBeenCalledWith('Great post!');
    });

    it('rolls back comment addition on error', async () => {
      const mockOnAddComment = jest.fn().mockRejectedValue(new Error('Failed to add comment'));
      
      const { result } = renderHook(() => 
        useOptimisticComment(3, mockOnAddComment)
      );

      // Initial state
      expect(result.current.commentCount).toBe(3);

      // Add comment that will fail
      await act(async () => {
        await result.current.handleAddComment('Test comment');
      });

      // Should rollback to original count
      expect(result.current.commentCount).toBe(3);
      expect(result.current.error).toBe('Failed to add comment');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('prevents double submission of comments', async () => {
      const mockOnAddComment = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { result } = renderHook(() => 
        useOptimisticComment(3, mockOnAddComment)
      );

      // Start first submission
      act(() => {
        result.current.handleAddComment('First comment');
      });

      expect(result.current.isSubmitting).toBe(true);

      // Try to submit again while submitting
      await act(async () => {
        await result.current.handleAddComment('Second comment');
      });

      // Should only call API once
      expect(mockOnAddComment).toHaveBeenCalledTimes(1);
      expect(mockOnAddComment).toHaveBeenCalledWith('First comment');
    });

    it('handles multiple comment additions correctly', async () => {
      const mockOnAddComment = jest.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useOptimisticComment(3, mockOnAddComment)
      );

      // Add multiple comments
      await act(async () => {
        await result.current.handleAddComment('First comment');
      });

      await act(async () => {
        await result.current.handleAddComment('Second comment');
      });

      await act(async () => {
        await result.current.handleAddComment('Third comment');
      });

      // Should increment count for each comment
      expect(result.current.commentCount).toBe(6);
      expect(mockOnAddComment).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery', () => {
    it('clears error state on successful retry', async () => {
      const mockOnLike = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // First attempt fails
      await act(async () => {
        await result.current.handleLike();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.liked).toBe(false); // Rolled back

      // Retry succeeds
      await act(async () => {
        await result.current.handleLike();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.liked).toBe(true);
      expect(result.current.likeCount).toBe(6);
    });

    it('maintains error state across multiple failures', async () => {
      const mockOnLike = jest.fn()
        .mockRejectedValue(new Error('Persistent error'));
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // First failure
      await act(async () => {
        await result.current.handleLike();
      });

      expect(result.current.error).toBe('Persistent error');

      // Second failure
      await act(async () => {
        await result.current.handleLike();
      });

      expect(result.current.error).toBe('Persistent error');
      expect(result.current.liked).toBe(false);
      expect(result.current.likeCount).toBe(5);
    });
  });

  describe('State Consistency', () => {
    it('maintains consistent state during concurrent operations', async () => {
      const mockOnLike = jest.fn().mockImplementation((liked) => 
        new Promise(resolve => setTimeout(() => resolve(undefined), Math.random() * 50))
      );
      
      const { result } = renderHook(() => 
        useOptimisticLike(false, 5, mockOnLike)
      );

      // Start multiple concurrent operations
      const operations = [
        act(async () => await result.current.handleLike()),
        act(async () => await result.current.handleLike()),
        act(async () => await result.current.handleLike())
      ];

      // Wait for all to complete
      await Promise.all(operations);

      // State should be consistent (only first operation should execute)
      expect(mockOnLike).toHaveBeenCalledTimes(1);
      expect(result.current.liked).toBe(true);
      expect(result.current.likeCount).toBe(6);
    });

    it('handles state updates from external sources', async () => {
      const mockOnLike = jest.fn().mockResolvedValue(undefined);
      
      const { result, rerender } = renderHook(
        ({ liked, count }) => useOptimisticLike(liked, count, mockOnLike),
        { initialProps: { liked: false, count: 5 } }
      );

      // Simulate external update (e.g., real-time update)
      rerender({ liked: true, count: 6 });

      expect(result.current.liked).toBe(true);
      expect(result.current.likeCount).toBe(6);

      // Local operation should work with updated state
      await act(async () => {
        await result.current.handleLike();
      });

      expect(result.current.liked).toBe(false);
      expect(result.current.likeCount).toBe(5);
    });
  });
});
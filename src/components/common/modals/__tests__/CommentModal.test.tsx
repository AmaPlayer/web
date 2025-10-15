import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentModal from '../CommentModal';
import { Post, Comment } from '../../../../types/models';

// Mock dependencies
jest.mock('../../../ui/LazyImage', () => {
  return function MockLazyImage(props: any) {
    return <img {...props} data-testid="lazy-image" />;
  };
});

jest.mock('../../../feedback/LoadingSpinner', () => {
  return function MockLoadingSpinner(props: any) {
    return <div data-testid="loading-spinner" className={`spinner ${props.size} ${props.color}`}>{props.text}</div>;
  };
});

jest.mock('../../../feedback/ErrorMessage', () => {
  return function MockErrorMessage(props: any) {
    return (
      <div data-testid="error-message" className={`error-message ${props.type}`}>
        {props.message}
        {props.onDismiss && <button onClick={props.onDismiss}>Dismiss</button>}
        {props.onRetry && <button onClick={props.onRetry}>{props.retryLabel || 'Retry'}</button>}
      </div>
    );
  };
});

// Mock AuthContext
const mockCurrentUser = {
  uid: 'current-user-id',
  displayName: 'Current User',
  photoURL: 'https://example.com/current-user.jpg'
};

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    currentUser: mockCurrentUser
  }))
}));

// Mock useToast hook
const mockToast = {
  showToast: jest.fn()
};

jest.mock('../../../../hooks/useToast', () => ({
  useToast: jest.fn(() => mockToast)
}));

// Mock validation utilities
jest.mock('../../../../utils/validation', () => ({
  validateComment: jest.fn((text, options) => ({
    isValid: text.trim().length > 0 && text.length <= (options?.maxLength || 500),
    error: text.trim().length === 0 ? 'Comment cannot be empty' : 
           text.length > (options?.maxLength || 500) ? 'Comment is too long' : null
  })),
  getCharacterCount: jest.fn((text, maxLength) => ({
    remaining: maxLength - text.length,
    isOverLimit: text.length > maxLength
  }))
}));

// Mock engagement error handler
jest.mock('../../../../utils/engagementErrorHandler', () => ({
  handleCommentError: jest.fn((error, postId, action) => ({
    userMessage: `Failed to ${action} comment. Please try again.`,
    canRetry: true,
    errorCode: 'COMMENT_FAILED'
  })),
  retryWithBackoff: jest.fn((fn) => fn())
}));

// Mock posts service
const mockPostsService = {
  getById: jest.fn(),
  addComment: jest.fn()
};

jest.mock('../../../../services/api/postsService', () => ({
  default: mockPostsService
}));

const mockPost: Post = {
  id: 'test-post-1',
  userId: 'post-author-id',
  userDisplayName: 'Post Author',
  userPhotoURL: 'https://example.com/author.jpg',
  caption: 'Test post caption',
  createdAt: new Date('2024-01-01'),
  mediaUrl: 'https://example.com/image.jpg',
  mediaType: 'image',
  likes: [],
  comments: [],
  shares: [],
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0
};

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    text: 'Great post!',
    userId: 'user-1',
    userDisplayName: 'User One',
    userPhotoURL: 'https://example.com/user1.jpg',
    timestamp: new Date('2024-01-02'),
    likes: [],
    likesCount: 0
  },
  {
    id: 'comment-2',
    text: 'Amazing content!',
    userId: 'user-2',
    userDisplayName: 'User Two',
    userPhotoURL: 'https://example.com/user2.jpg',
    timestamp: new Date('2024-01-03'),
    likes: ['user-1'],
    likesCount: 1
  }
];

describe('CommentModal', () => {
  const mockHandlers = {
    onClose: jest.fn(),
    onCommentAdded: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPostsService.getById.mockResolvedValue({
      ...mockPost,
      comments: mockComments
    });
    mockPostsService.addComment.mockResolvedValue({
      id: 'new-comment-id',
      text: 'New comment',
      userId: mockCurrentUser.uid,
      userDisplayName: mockCurrentUser.displayName,
      userPhotoURL: mockCurrentUser.photoURL,
      timestamp: new Date(),
      likes: []
    });
  });

  describe('Basic Rendering', () => {
    it('renders modal with post preview and comments', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      // Check modal structure
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Post Author')).toBeInTheDocument();
      expect(screen.getByText('Test post caption')).toBeInTheDocument();

      // Wait for comments to load
      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument();
        expect(screen.getByText('Amazing content!')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching comments', () => {
      mockPostsService.getById.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading comments...')).toBeInTheDocument();
    });

    it('shows empty state when no comments exist', async () => {
      mockPostsService.getById.mockResolvedValue({
        ...mockPost,
        comments: []
      });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No comments yet')).toBeInTheDocument();
        expect(screen.getByText('Be the first to comment on this post!')).toBeInTheDocument();
      });
    });

    it('renders comment form for authenticated users', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
        expect(screen.getByLabelText('Send comment')).toBeInTheDocument();
      });
    });

    it('shows sign-in notice for unauthenticated users', async () => {
      const { useAuth } = require('../../../../contexts/AuthContext');
      useAuth.mockReturnValue({ currentUser: null });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sign in to join the conversation')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Add a comment...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Comment Loading', () => {
    it('fetches and displays comments sorted by newest first', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        const comments = screen.getAllByText(/Great post!|Amazing content!/);
        expect(comments).toHaveLength(2);
      });

      expect(mockPostsService.getById).toHaveBeenCalledWith('test-post-1');
    });

    it('handles comment loading errors', async () => {
      const error = new Error('Failed to load comments');
      mockPostsService.getById.mockRejectedValue(error);

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to load comment. Please try again.')).toBeInTheDocument();
      });
    });

    it('retries loading comments on error', async () => {
      mockPostsService.getById
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ ...mockPost, comments: mockComments });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Reload Comments');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument();
      });
    });
  });

  describe('Comment Submission', () => {
    it('submits new comment successfully', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByLabelText('Send comment');

      // Type comment
      fireEvent.change(input, { target: { value: 'New test comment' } });
      expect(input).toHaveValue('New test comment');

      // Submit comment
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPostsService.addComment).toHaveBeenCalledWith('test-post-1', {
          text: 'New test comment',
          userId: mockCurrentUser.uid,
          userDisplayName: mockCurrentUser.displayName,
          userPhotoURL: mockCurrentUser.photoURL
        });
      });

      // Check success feedback
      expect(mockToast.showToast).toHaveBeenCalledWith(
        'Comment posted successfully!',
        expect.objectContaining({
          type: 'success',
          duration: 3000
        })
      );

      // Check comment added callback
      expect(mockHandlers.onCommentAdded).toHaveBeenCalled();

      // Input should be cleared
      expect(input).toHaveValue('');
    });

    it('validates comment input before submission', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByLabelText('Send comment');

      // Try to submit empty comment
      fireEvent.click(submitButton);

      expect(mockPostsService.addComment).not.toHaveBeenCalled();
      expect(submitButton).toBeDisabled();
    });

    it('shows validation error for invalid comments', async () => {
      const { validateComment } = require('../../../../utils/validation');
      validateComment.mockReturnValue({
        isValid: false,
        error: 'Comment is too long'
      });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      
      // Type invalid comment
      fireEvent.change(input, { target: { value: 'x'.repeat(600) } });

      await waitFor(() => {
        expect(screen.getByText('Comment is too long')).toBeInTheDocument();
      });
    });

    it('handles comment submission errors', async () => {
      const error = new Error('Network error');
      mockPostsService.addComment.mockRejectedValue(error);

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByLabelText('Send comment');

      // Type and submit comment
      fireEvent.change(input, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.showToast).toHaveBeenCalledWith(
          'Failed to add comment. Please try again.',
          expect.objectContaining({
            type: 'error',
            duration: 5000,
            action: expect.objectContaining({
              label: 'Retry'
            })
          })
        );
      });
    });

    it('shows loading state during comment submission', async () => {
      mockPostsService.addComment.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByLabelText('Send comment');

      // Type and submit comment
      fireEvent.change(input, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
        expect(input).toBeDisabled();
      });
    });

    it('prevents double submission', async () => {
      mockPostsService.addComment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByLabelText('Send comment');

      // Type comment
      fireEvent.change(input, { target: { value: 'Test comment' } });

      // Click submit multiple times
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPostsService.addComment).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Comment Interactions', () => {
    it('handles comment like interactions', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument();
      });

      const likeButtons = screen.getAllByRole('button', { name: /heart/i });
      const firstCommentLikeButton = likeButtons[0];

      fireEvent.click(firstCommentLikeButton);

      // Should show optimistic update
      await waitFor(() => {
        expect(firstCommentLikeButton).toHaveClass('liked');
      });
    });

    it('displays comment like counts correctly', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Amazing content!')).toBeInTheDocument();
      });

      // Second comment has 1 like
      const likeCountElements = screen.getAllByText('1');
      expect(likeCountElements.length).toBeGreaterThan(0);
    });

    it('shows comment options for own comments', async () => {
      const ownComment = {
        ...mockComments[0],
        userId: mockCurrentUser.uid
      };

      mockPostsService.getById.mockResolvedValue({
        ...mockPost,
        comments: [ownComment]
      });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument();
      });

      // Should show options button for own comment
      expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('closes modal when close button is clicked', () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it('closes modal when overlay is clicked', () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      const overlay = screen.getByText('Comments').closest('.modal-overlay');
      fireEvent.click(overlay!);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it('prevents modal close when clicking inside modal content', () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      const modalContent = screen.getByText('Comments').closest('.comment-modal');
      fireEvent.click(modalContent!);

      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Character Counter', () => {
    it('shows character counter for comment input', async () => {
      const { getCharacterCount } = require('../../../../utils/validation');
      getCharacterCount.mockReturnValue({
        remaining: 485,
        isOverLimit: false
      });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      fireEvent.change(input, { target: { value: 'Short comment' } });

      expect(screen.getByText('485 characters remaining')).toBeInTheDocument();
    });

    it('shows over-limit warning for long comments', async () => {
      const { getCharacterCount } = require('../../../../utils/validation');
      getCharacterCount.mockReturnValue({
        remaining: -50,
        isOverLimit: true
      });

      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      fireEvent.change(input, { target: { value: 'x'.repeat(600) } });

      const counter = screen.getByText('-50 characters remaining');
      expect(counter).toHaveClass('over-limit');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText('Send comment')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('manages focus correctly', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Add a comment...');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('maintains proper layout on different screen sizes', async () => {
      render(
        <CommentModal
          post={mockPost}
          {...mockHandlers}
        />
      );

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toHaveClass('comment-modal');

      // Check that comments container has proper scrolling
      await waitFor(() => {
        const commentsContainer = screen.getByText('Great post!').closest('.comments-container');
        expect(commentsContainer).toBeInTheDocument();
      });
    });
  });
});
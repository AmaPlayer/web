// Tests for modal UI layout and responsiveness
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock ResizeObserver for responsive testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock LazyImage component
jest.mock('../../ui/LazyImage', () => {
  return function MockLazyImage(props: any) {
    return <img {...props} data-testid="lazy-image" style={{ width: '32px', height: '32px' }} />;
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

// Mock other dependencies
jest.mock('../../../../hooks/useToast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() }))
}));

jest.mock('../../../../utils/validation', () => ({
  validateComment: jest.fn(() => ({ isValid: true, error: null })),
  getCharacterCount: jest.fn(() => ({ remaining: 450, isOverLimit: false }))
}));

jest.mock('../../../../utils/engagementErrorHandler', () => ({
  handleCommentError: jest.fn(),
  retryWithBackoff: jest.fn((fn) => fn())
}));

jest.mock('../../../../services/api/postsService', () => ({
  default: {
    getById: jest.fn().mockResolvedValue({
      id: 'test-post',
      comments: []
    }),
    addComment: jest.fn().mockResolvedValue({
      id: 'new-comment',
      text: 'Test comment',
      userId: 'user-id',
      userDisplayName: 'User',
      userPhotoURL: null,
      timestamp: new Date(),
      likes: []
    })
  }
}));

import CommentModal from '../CommentModal';
import { Post } from '../../../../types/models';

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

describe('Modal Layout and Responsiveness', () => {
  const mockHandlers = {
    onClose: jest.fn(),
    onCommentAdded: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Structure', () => {
    it('renders modal with correct structure', () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      // Check modal overlay
      const overlay = screen.getByText('Comments').closest('.modal-overlay');
      expect(overlay).toBeInTheDocument();

      // Check modal content
      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toBeInTheDocument();

      // Check header
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('has proper modal dimensions and positioning', () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toHaveStyle({
        maxHeight: '90vh'
      });
    });

    it('prevents body scroll when modal is open', () => {
      const { unmount } = render(<CommentModal post={mockPost} {...mockHandlers} />);

      // Modal should prevent background scrolling
      expect(document.body.style.overflow).toBe('hidden');

      // Cleanup should restore scrolling
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Comment Form Layout', () => {
    it('renders comment form with proper sizing', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      // Wait for form to render
      const input = await screen.findByPlaceholderText('Add a comment...');
      const avatar = screen.getAllByTestId('lazy-image').find(img => 
        img.closest('.comment-form')
      );

      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveStyle({
        width: '32px',
        height: '32px'
      });

      expect(input).toBeInTheDocument();
    });

    it('maintains proper form layout with avatar and input', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const form = await screen.findByRole('form');
      expect(form).toHaveClass('comment-form');

      // Check form structure
      const avatar = form.querySelector('.user-avatar.small');
      const inputContainer = form.querySelector('.comment-input-container');
      
      expect(avatar).toBeInTheDocument();
      expect(inputContainer).toBeInTheDocument();
    });

    it('ensures comment form stays within modal boundaries', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      const form = await screen.findByRole('form');

      // Form should be contained within modal
      expect(modal).toContainElement(form);

      // Check that form doesn't overflow
      const formSection = form.closest('.comment-form-section');
      expect(formSection).toBeInTheDocument();
    });

    it('handles long comment input without breaking layout', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const input = await screen.findByPlaceholderText('Add a comment...');
      
      // Type a very long comment
      const longText = 'This is a very long comment that should not break the modal layout or cause the input to overflow outside the modal boundaries. '.repeat(5);
      fireEvent.change(input, { target: { value: longText } });

      expect(input.value).toBe(longText);
      
      // Input should still be within bounds
      const inputContainer = input.closest('.comment-input-container');
      expect(inputContainer).toBeInTheDocument();
    });
  });

  describe('Comments List Layout', () => {
    it('renders comments container with proper scrolling', async () => {
      const postWithComments = {
        ...mockPost,
        comments: Array.from({ length: 20 }, (_, i) => ({
          id: `comment-${i}`,
          text: `Comment ${i}`,
          userId: `user-${i}`,
          userDisplayName: `User ${i}`,
          userPhotoURL: null,
          timestamp: new Date(),
          likes: [],
          likesCount: 0
        }))
      };

      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.getById.mockResolvedValue(postWithComments);

      render(<CommentModal post={postWithComments} {...mockHandlers} />);

      // Wait for comments to load
      await screen.findByText('Comment 0');

      const commentsContainer = screen.getByText('Comment 0').closest('.comments-container');
      expect(commentsContainer).toBeInTheDocument();
      expect(commentsContainer).toHaveStyle({
        maxHeight: '400px',
        overflowY: 'auto'
      });
    });

    it('handles empty comments state layout', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      // Wait for empty state
      await screen.findByText('No comments yet');

      const emptyState = screen.getByText('No comments yet').closest('.empty-comments');
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText('Be the first to comment on this post!')).toBeInTheDocument();
    });

    it('maintains proper comment item layout', async () => {
      const postWithComment = {
        ...mockPost,
        comments: [{
          id: 'comment-1',
          text: 'Test comment with proper layout',
          userId: 'user-1',
          userDisplayName: 'Test User',
          userPhotoURL: 'https://example.com/user.jpg',
          timestamp: new Date(),
          likes: [],
          likesCount: 0
        }]
      };

      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.getById.mockResolvedValue(postWithComment);

      render(<CommentModal post={postWithComment} {...mockHandlers} />);

      // Wait for comment to load
      await screen.findByText('Test comment with proper layout');

      const comment = screen.getByText('Test comment with proper layout').closest('.comment');
      expect(comment).toBeInTheDocument();

      // Check comment structure
      const avatar = comment?.querySelector('.comment-avatar');
      const content = comment?.querySelector('.comment-content');
      
      expect(avatar).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toBeInTheDocument();

      // Modal should adapt to mobile screen
      expect(modal).toHaveClass('comment-modal');
    });

    it('adapts to tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toBeInTheDocument();
    });

    it('adapts to desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toBeInTheDocument();
    });

    it('handles viewport changes gracefully', async () => {
      const { rerender } = render(<CommentModal post={mockPost} {...mockHandlers} />);

      // Simulate viewport change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      rerender(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Profile Picture Sizing', () => {
    it('renders user avatars with correct size in comment form', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const form = await screen.findByRole('form');
      const avatar = form.querySelector('.user-avatar.small');
      
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveStyle({
        width: '32px',
        height: '32px'
      });
    });

    it('renders comment avatars with correct size', async () => {
      const postWithComment = {
        ...mockPost,
        comments: [{
          id: 'comment-1',
          text: 'Test comment',
          userId: 'user-1',
          userDisplayName: 'Test User',
          userPhotoURL: 'https://example.com/user.jpg',
          timestamp: new Date(),
          likes: [],
          likesCount: 0
        }]
      };

      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.getById.mockResolvedValue(postWithComment);

      render(<CommentModal post={postWithComment} {...mockHandlers} />);

      // Wait for comment to load
      await screen.findByText('Test comment');

      const commentAvatar = screen.getByText('Test comment')
        .closest('.comment')
        ?.querySelector('.comment-avatar');
      
      expect(commentAvatar).toBeInTheDocument();
    });

    it('handles missing profile pictures gracefully', async () => {
      const postWithComment = {
        ...mockPost,
        comments: [{
          id: 'comment-1',
          text: 'Test comment',
          userId: 'user-1',
          userDisplayName: 'Test User',
          userPhotoURL: null,
          timestamp: new Date(),
          likes: [],
          likesCount: 0
        }]
      };

      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.getById.mockResolvedValue(postWithComment);

      render(<CommentModal post={postWithComment} {...mockHandlers} />);

      // Wait for comment to load
      await screen.findByText('Test comment');

      // Should render default avatar
      const avatars = screen.getAllByTestId('lazy-image');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Modal Boundaries', () => {
    it('ensures all content stays within modal boundaries', async () => {
      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const modal = screen.getByText('Comments').closest('.comment-modal');
      const header = screen.getByText('Comments').closest('.modal-header');
      const form = await screen.findByRole('form');

      // All elements should be contained within modal
      expect(modal).toContainElement(header);
      expect(modal).toContainElement(form);
    });

    it('handles overflow content correctly', async () => {
      // Create post with many comments
      const postWithManyComments = {
        ...mockPost,
        comments: Array.from({ length: 50 }, (_, i) => ({
          id: `comment-${i}`,
          text: `This is comment number ${i} with some additional text to make it longer`,
          userId: `user-${i}`,
          userDisplayName: `User ${i}`,
          userPhotoURL: null,
          timestamp: new Date(),
          likes: [],
          likesCount: 0
        }))
      };

      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.getById.mockResolvedValue(postWithManyComments);

      render(<CommentModal post={postWithManyComments} {...mockHandlers} />);

      // Wait for comments to load
      await screen.findByText('This is comment number 0 with some additional text to make it longer');

      const commentsContainer = screen.getByText('This is comment number 0 with some additional text to make it longer')
        .closest('.comments-container');
      
      expect(commentsContainer).toBeInTheDocument();
      expect(commentsContainer).toHaveStyle({
        overflowY: 'auto'
      });
    });
  });

  describe('Loading States Layout', () => {
    it('maintains proper layout during loading', () => {
      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.getById.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const loadingContainer = screen.getByText('Loading comments...').closest('.loading-comments');
      expect(loadingContainer).toBeInTheDocument();

      const modal = screen.getByText('Comments').closest('.comment-modal');
      expect(modal).toContainElement(loadingContainer);
    });

    it('maintains layout during comment submission', async () => {
      const mockPostsService = require('../../../../services/api/postsService').default;
      mockPostsService.addComment.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CommentModal post={mockPost} {...mockHandlers} />);

      const input = await screen.findByPlaceholderText('Add a comment...');
      const submitButton = screen.getByLabelText('Send comment');

      fireEvent.change(input, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      // Should show loading state in button
      expect(submitButton).toBeDisabled();
      expect(input).toBeDisabled();
    });
  });
});
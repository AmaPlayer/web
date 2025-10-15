import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostsSection from '../PostsSection';
import { Post } from '../../types/ProfileTypes';

// Mock the modal components
jest.mock('../PostViewModal', () => {
  return function MockPostViewModal({ isOpen, onClose, post, onEdit, onDelete }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="post-view-modal">
        <div>Post: {post?.title}</div>
        <button onClick={() => onEdit?.(post)}>Edit Post</button>
        <button onClick={() => onDelete?.(post.id)}>Delete Post</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../PostManagementModal', () => {
  return function MockPostManagementModal({ isOpen, onClose, onSave, post }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="post-management-modal">
        <div>Management Modal</div>
        <button onClick={() => onSave({ type: 'photo', content: 'Test content', mediaUrls: [], isPublic: true })}>
          Save Post
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const mockPosts: Post[] = [
  {
    id: '1',
    type: 'photo',
    title: 'Test Photo Post',
    content: 'This is a test photo post',
    mediaUrls: ['https://example.com/photo1.jpg'],
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    createdDate: new Date('2024-01-01'),
    likes: 25,
    comments: 5,
    isPublic: true
  },
  {
    id: '2',
    type: 'video',
    title: 'Test Video Post',
    content: 'This is a test video post',
    mediaUrls: ['https://example.com/video1.mp4'],
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    createdDate: new Date('2024-01-02'),
    likes: 1500,
    comments: 250,
    isPublic: true
  },
  {
    id: '3',
    type: 'text',
    content: 'This is a text-only post',
    mediaUrls: [],
    createdDate: new Date('2024-01-03'),
    likes: 10,
    comments: 2,
    isPublic: true
  }
];

describe('PostsSection', () => {
  const defaultProps = {
    posts: mockPosts,
    isOwner: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Post Grid Display', () => {
    it('renders posts section with correct title', () => {
      render(<PostsSection {...defaultProps} />);
      
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    it('displays posts in a grid layout', () => {
      render(<PostsSection {...defaultProps} />);
      
      const postsGrid = document.querySelector('.posts-grid');
      expect(postsGrid).toBeInTheDocument();
      
      // Check that all posts are rendered
      expect(screen.getByLabelText('View post: Test Photo Post')).toBeInTheDocument();
      expect(screen.getByLabelText('View post: Test Video Post')).toBeInTheDocument();
      expect(screen.getByLabelText('View post: Untitled post')).toBeInTheDocument();
    });

    it('displays post thumbnails when available', () => {
      render(<PostsSection {...defaultProps} />);
      
      const photoThumbnail = screen.getByAltText('Test Photo Post');
      const videoThumbnail = screen.getByAltText('Test Video Post');
      
      expect(photoThumbnail).toBeInTheDocument();
      expect(photoThumbnail).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
      expect(videoThumbnail).toBeInTheDocument();
      expect(videoThumbnail).toHaveAttribute('src', 'https://example.com/thumb2.jpg');
    });

    it('displays post type indicators', () => {
      render(<PostsSection {...defaultProps} />);
      
      const typeIndicators = document.querySelectorAll('.post-type-indicator');
      expect(typeIndicators).toHaveLength(3);
      
      // Check for specific post type icons
      expect(screen.getAllByText('📷')).toHaveLength(1); // photo
      expect(screen.getAllByText('🎥')).toHaveLength(1); // video
      expect(screen.getAllByText('📝')).toHaveLength(2); // text (appears in placeholder and indicator)
    });

    it('displays placeholder for posts without thumbnails', () => {
      render(<PostsSection {...defaultProps} />);
      
      // Text post should have placeholder
      const placeholders = document.querySelectorAll('.post-placeholder');
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('shows empty state when no posts exist', () => {
      render(<PostsSection {...defaultProps} posts={[]} />);
      
      expect(screen.getByText('No posts yet')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument(); // empty state icon
    });

    it('shows "Create your first post" button in empty state for owners', () => {
      const mockOnAddPost = jest.fn();
      render(
        <PostsSection 
          {...defaultProps} 
          posts={[]} 
          isOwner={true} 
          onAddPost={mockOnAddPost}
        />
      );
      
      const createButton = screen.getByText('Create your first post');
      expect(createButton).toBeInTheDocument();
      
      fireEvent.click(createButton);
      expect(screen.getByTestId('post-management-modal')).toBeInTheDocument();
    });
  });

  describe('Post Navigation', () => {
    it('opens post view modal when post is clicked', () => {
      const mockOnPostClick = jest.fn();
      render(<PostsSection {...defaultProps} onPostClick={mockOnPostClick} />);
      
      const firstPost = screen.getByLabelText('View post: Test Photo Post');
      fireEvent.click(firstPost);
      
      expect(screen.getByTestId('post-view-modal')).toBeInTheDocument();
      expect(screen.getByText('Post: Test Photo Post')).toBeInTheDocument();
      expect(mockOnPostClick).toHaveBeenCalledWith(mockPosts[0]);
    });

    it('supports keyboard navigation for post selection', () => {
      const mockOnPostClick = jest.fn();
      render(<PostsSection {...defaultProps} onPostClick={mockOnPostClick} />);
      
      const firstPost = screen.getByLabelText('View post: Test Photo Post');
      
      // Test Enter key
      fireEvent.keyDown(firstPost, { key: 'Enter' });
      expect(mockOnPostClick).toHaveBeenCalledWith(mockPosts[0]);
      
      // Close modal and test Space key
      fireEvent.click(screen.getByText('Close'));
      fireEvent.keyDown(firstPost, { key: ' ' });
      expect(mockOnPostClick).toHaveBeenCalledTimes(2);
    });

    it('closes post view modal when close button is clicked', () => {
      render(<PostsSection {...defaultProps} />);
      
      // Open modal
      const firstPost = screen.getByLabelText('View post: Test Photo Post');
      fireEvent.click(firstPost);
      
      expect(screen.getByTestId('post-view-modal')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('post-view-modal')).not.toBeInTheDocument();
    });
  });

  describe('Post Management Operations', () => {
    it('shows management buttons for post owners', () => {
      const mockOnAddPost = jest.fn();
      const mockOnOpenEditModal = jest.fn();
      
      render(
        <PostsSection 
          {...defaultProps} 
          isOwner={true} 
          onAddPost={mockOnAddPost}
          onOpenEditModal={mockOnOpenEditModal}
        />
      );
      
      expect(screen.getByLabelText('Add new post')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit posts section')).toBeInTheDocument();
    });

    it('does not show management buttons for non-owners', () => {
      render(<PostsSection {...defaultProps} isOwner={false} />);
      
      expect(screen.queryByLabelText('Add new post')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Edit posts section')).not.toBeInTheDocument();
    });

    it('opens post management modal when add post is clicked', () => {
      const mockOnAddPost = jest.fn();
      render(<PostsSection {...defaultProps} isOwner={true} onAddPost={mockOnAddPost} />);
      
      const addButton = screen.getByLabelText('Add new post');
      fireEvent.click(addButton);
      
      expect(screen.getByTestId('post-management-modal')).toBeInTheDocument();
    });

    it('calls onAddPost when saving a new post', () => {
      const mockOnAddPost = jest.fn();
      render(<PostsSection {...defaultProps} isOwner={true} onAddPost={mockOnAddPost} />);
      
      // Open add post modal
      fireEvent.click(screen.getByLabelText('Add new post'));
      
      // Save post
      fireEvent.click(screen.getByText('Save Post'));
      
      expect(mockOnAddPost).toHaveBeenCalledWith({
        type: 'photo',
        content: 'Test content',
        mediaUrls: [],
        isPublic: true
      });
    });

    it('opens edit modal when edit is clicked from post view', () => {
      const mockOnEditPost = jest.fn();
      render(<PostsSection {...defaultProps} isOwner={true} onEditPost={mockOnEditPost} />);
      
      // Open post view modal
      fireEvent.click(screen.getByLabelText('View post: Test Photo Post'));
      
      // Click edit button
      fireEvent.click(screen.getByText('Edit Post'));
      
      expect(screen.getByTestId('post-management-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('post-view-modal')).not.toBeInTheDocument();
    });

    it('calls onEditPost when saving an edited post', async () => {
      const mockOnEditPost = jest.fn();
      render(<PostsSection {...defaultProps} isOwner={true} onEditPost={mockOnEditPost} />);
      
      // Open post view modal
      fireEvent.click(screen.getByLabelText('View post: Test Photo Post'));
      
      // Click edit button
      fireEvent.click(screen.getByText('Edit Post'));
      
      // Save edited post
      fireEvent.click(screen.getByText('Save Post'));
      
      expect(mockOnEditPost).toHaveBeenCalledWith('1', {
        type: 'photo',
        content: 'Test content',
        mediaUrls: [],
        isPublic: true
      });
    });

    it('calls onDeletePost when delete is clicked', () => {
      const mockOnDeletePost = jest.fn();
      render(<PostsSection {...defaultProps} isOwner={true} onDeletePost={mockOnDeletePost} />);
      
      // Open post view modal
      fireEvent.click(screen.getByLabelText('View post: Test Photo Post'));
      
      // Click delete button
      fireEvent.click(screen.getByText('Delete Post'));
      
      expect(mockOnDeletePost).toHaveBeenCalledWith('1');
    });

    it('calls onOpenEditModal when edit section button is clicked', () => {
      const mockOnOpenEditModal = jest.fn();
      render(<PostsSection {...defaultProps} isOwner={true} onOpenEditModal={mockOnOpenEditModal} />);
      
      fireEvent.click(screen.getByLabelText('Edit posts section'));
      
      expect(mockOnOpenEditModal).toHaveBeenCalledWith('posts');
    });
  });

  describe('Engagement Metrics Display', () => {
    it('displays like and comment counts', () => {
      render(<PostsSection {...defaultProps} />);
      
      // Check for engagement metrics
      expect(screen.getByText('❤️ 25')).toBeInTheDocument();
      expect(screen.getByText('💬 5')).toBeInTheDocument();
      expect(screen.getByText('❤️ 1.5K')).toBeInTheDocument(); // 1500 likes formatted
      expect(screen.getByText('💬 250')).toBeInTheDocument();
      expect(screen.getByText('❤️ 10')).toBeInTheDocument();
      expect(screen.getByText('💬 2')).toBeInTheDocument();
    });

    it('formats large engagement numbers correctly', () => {
      const postsWithLargeNumbers: Post[] = [
        {
          id: '1',
          type: 'photo',
          title: 'Viral Post',
          content: 'This went viral',
          mediaUrls: [],
          createdDate: new Date(),
          likes: 1500000, // 1.5M
          comments: 25000, // 25K
          isPublic: true
        },
        {
          id: '2',
          type: 'video',
          title: 'Popular Video',
          content: 'Popular content',
          mediaUrls: [],
          createdDate: new Date(),
          likes: 2500, // 2.5K
          comments: 999, // 999 (no formatting)
          isPublic: true
        }
      ];

      render(<PostsSection {...defaultProps} posts={postsWithLargeNumbers} />);
      
      expect(screen.getByText('❤️ 1.5M')).toBeInTheDocument();
      expect(screen.getByText('💬 25.0K')).toBeInTheDocument();
      expect(screen.getByText('❤️ 2.5K')).toBeInTheDocument();
      expect(screen.getByText('💬 999')).toBeInTheDocument();
    });

    it('displays engagement metrics in post overlay', () => {
      render(<PostsSection {...defaultProps} />);
      
      const overlays = document.querySelectorAll('.post-overlay');
      expect(overlays).toHaveLength(3);
      
      const engagementItems = document.querySelectorAll('.engagement-item');
      expect(engagementItems.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for post thumbnails', () => {
      render(<PostsSection {...defaultProps} />);
      
      expect(screen.getByLabelText('View post: Test Photo Post')).toBeInTheDocument();
      expect(screen.getByLabelText('View post: Test Video Post')).toBeInTheDocument();
      expect(screen.getByLabelText('View post: Untitled post')).toBeInTheDocument();
    });

    it('has proper tabIndex for keyboard navigation', () => {
      render(<PostsSection {...defaultProps} />);
      
      const postThumbnails = document.querySelectorAll('.post-thumbnail');
      postThumbnails.forEach(thumbnail => {
        expect(thumbnail).toHaveAttribute('tabIndex', '0');
        expect(thumbnail).toHaveAttribute('role', 'button');
      });
    });

    it('has proper alt text for post images', () => {
      render(<PostsSection {...defaultProps} />);
      
      const photoImage = screen.getByAltText('Test Photo Post');
      const videoImage = screen.getByAltText('Test Video Post');
      
      expect(photoImage).toBeInTheDocument();
      expect(videoImage).toBeInTheDocument();
    });
  });
});
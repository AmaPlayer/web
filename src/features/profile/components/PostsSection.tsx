import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types/ProfileTypes';
import PostViewModal from './PostViewModal';
import PostManagementModal from './PostManagementModal';
import '../styles/PostsSection.css';

interface PostsSectionProps {
  posts: Post[];
  isOwner: boolean;
  onPostClick?: (post: Post) => void;
  onAddPost?: (postData: Omit<Post, 'id' | 'createdDate' | 'likes' | 'comments'>) => void;
  onEditPost?: (postId: string, postData: Omit<Post, 'id' | 'createdDate' | 'likes' | 'comments'>) => void;
  onDeletePost?: (postId: string) => void;
  onOpenEditModal?: (initialTab: string) => void;
}

const PostsSection: React.FC<PostsSectionProps> = ({
  posts,
  isOwner,
  onPostClick,
  onAddPost,
  onEditPost,
  onDeletePost,
  onOpenEditModal
}) => {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const getPostTypeIcon = (type: Post['type']) => {
    switch (type) {
      case 'photo':
        return '📷';
      case 'video':
        return '🎥';
      case 'text':
        return '📝';
      case 'mixed':
        return '📱';
      default:
        return '📄';
    }
  };

  const formatEngagementCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsViewModalOpen(true);
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const handleAddPost = () => {
    // Navigate to the AddPost page
    navigate('/add-post');
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsManagementModalOpen(true);
    setIsViewModalOpen(false);
  };

  const handleDeletePost = (postId: string) => {
    if (onDeletePost) {
      onDeletePost(postId);
    }
  };

  const handleSavePost = (postData: Omit<Post, 'id' | 'createdDate' | 'likes' | 'comments'>) => {
    if (editingPost && onEditPost) {
      onEditPost(editingPost.id, postData);
    } else if (onAddPost) {
      onAddPost(postData);
    }
  };

  return (
    <div className="posts-section">
      <div className="section-header">
        <h3 className="section-title">Posts</h3>
        {isOwner && onAddPost && (
          <div className="section-actions">
            <button 
              className="section-action add-post-button"
              onClick={handleAddPost}
              aria-label="Add new post"
            >
              Add Post
            </button>
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-message">No posts yet</p>
          {isOwner && onAddPost && (
            <button 
              className="empty-state-action"
              onClick={handleAddPost}
            >
              Create your first post
            </button>
          )}
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <div
              key={post.id}
              className="post-thumbnail"
              onClick={() => handlePostClick(post)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePostClick(post);
                }
              }}
              aria-label={`View post: ${post.title || 'Untitled post'}`}
            >
              {(post.thumbnailUrl || (post.mediaUrls && post.mediaUrls.length > 0)) ? (
                <img
                  src={post.thumbnailUrl || post.mediaUrls[0]}
                  alt={post.title || 'Post thumbnail'}
                  className="post-image"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling;
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}

              <div className="post-placeholder" style={{ display: (post.thumbnailUrl || (post.mediaUrls && post.mediaUrls.length > 0)) ? 'none' : 'flex' }}>
                <span className="post-placeholder-icon">
                  {getPostTypeIcon(post.type)}
                </span>
                {post.title && (
                  <span className="post-placeholder-title">
                    {post.title}
                  </span>
                )}
                {post.content && !post.title && (
                  <span className="post-placeholder-title">
                    {post.content.substring(0, 50)}{post.content.length > 50 ? '...' : ''}
                  </span>
                )}
              </div>

              {post.type === 'video' && (
                <div className="post-type-indicator">
                  {getPostTypeIcon(post.type)}
                </div>
              )}

              <div className="post-overlay">
                <div className="post-engagement">
                  <span className="engagement-item">
                    ❤️ {formatEngagementCount(post.likes)}
                  </span>
                  <span className="engagement-item">
                    💬 {formatEngagementCount(post.comments)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post View Modal */}
      {selectedPost && (
        <PostViewModal
          post={selectedPost}
          isOwner={isOwner}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedPost(null);
          }}
          onEdit={onEditPost ? handleEditPost : undefined}
          onDelete={onDeletePost ? handleDeletePost : undefined}
        />
      )}

      {/* Post Management Modal */}
      <PostManagementModal
        post={editingPost || undefined}
        isOpen={isManagementModalOpen}
        onClose={() => {
          setIsManagementModalOpen(false);
          setEditingPost(null);
        }}
        onSave={handleSavePost}
      />
    </div>
  );
};

export default PostsSection;
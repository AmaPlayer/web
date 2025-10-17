import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Video, Send, Trash2, MoreVertical, Edit3, Share2, Check } from 'lucide-react';
import OptimizedImage from '../../../components/common/media/OptimizedImage';
import VideoPlayer from '../../../components/common/media/VideoPlayer';
import LazyImage from '../../../components/common/ui/LazyImage';
import LazyLoadImage from '../../../components/common/media/LazyLoadImage';
import SafeImage from '../../../components/common/SafeImage';
import ErrorBoundary from '../../../components/common/safety/ErrorBoundary';
import { SafeCommentsList } from '../../../components/common/safety/SafeComment';
import RoleBadge from '../../../components/common/ui/RoleBadge';
import SportBanner from '../../../features/profile/components/SportBanner';
import { Post as PostType, Like } from '../../../types/models';
import { User } from 'firebase/auth';
import userService from '../../../services/api/userService';
import './Post.css';

interface CommentForms {
  newComment: Record<string, string>;
}

interface PostProps {
  post: PostType;
  currentUser: User | null;
  isGuest: boolean;
  showComments: Record<string, boolean>;
  showPostMenus: Record<string, boolean>;
  editingPost: string | null;
  editText: string;
  shareSuccess: Record<string, boolean>;
  forms: CommentForms;
  onLike: (postId: string, likes: string[], isSample: boolean, post: PostType) => void;
  onToggleComments: (postId: string) => void;
  onTogglePostMenu: (postId: string) => void;
  onEditPost: (postId: string, newCaption: string) => void;
  onSaveEdit: (postId: string) => void;
  onCancelEdit: () => void;
  onSharePost: (postId: string, post: PostType) => void;
  onDeletePost: (postId: string, post: PostType) => void;
  onCommentSubmit: (postId: string, commentText: string) => void;
  onDeleteComment: (postId: string, index: number) => void;
  onSetNewComment: (postId: string, text: string) => void;
  onSetEditText: (text: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

/**
 * Post Component
 * 
 * Renders a single post with all interactions (like, comment, share, edit, delete).
 * Optimized for performance with lazy loading and error boundaries.
 */
const Post: React.FC<PostProps> = ({
  post,
  currentUser,
  isGuest,
  showComments,
  showPostMenus,
  editingPost,
  editText,
  shareSuccess,
  forms,
  onLike,
  onToggleComments,
  onTogglePostMenu,
  onEditPost,
  onSaveEdit,
  onCancelEdit,
  onSharePost,
  onDeletePost,
  onCommentSubmit,
  onDeleteComment,
  onSetNewComment,
  onSetEditText,
  onNavigateToPost,
  onUserClick
}) => {
  // Handle both string[] and Like[] formats for backward compatibility
  const userLiked = Array.isArray(post.likes) && post.likes.length > 0 && typeof post.likes[0] === 'string' 
    ? (post.likes as unknown as string[]).includes(currentUser?.uid || '')
    : (post.likes as Like[]).some(like => like.userId === (currentUser?.uid || ''));

  // Handle navigation to individual post
  const handleNavigateToPost = (postId: string) => {
    if (onNavigateToPost) {
      onNavigateToPost(postId);
    } else {
      console.log(`Navigate to /post/${postId}`);
    }
  };

  // Handle user click to navigate to profile
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserClick && post.userId) {
      onUserClick(post.userId);
    }
  };

  // Check if this is the current user's post
  const isCurrentUserPost = currentUser && post.userId === currentUser.uid;
  
  // State to track user profile data from Firebase
  const [userProfileData, setUserProfileData] = useState<any>(null);

  // Fetch user profile data from Firebase for current user's posts
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      if (isCurrentUserPost && currentUser) {
        try {
          const userData = await userService.getById(currentUser.uid);
          if (isMounted && userData) {
            setUserProfileData(userData);
            // Also update localStorage for immediate access
            if (userData.role) localStorage.setItem('userRole', userData.role);
            if (userData.sports && userData.sports[0]) localStorage.setItem('userSport', userData.sports[0]);
            if (userData.position) localStorage.setItem('userPosition', userData.position);
            if (userData.specializations) localStorage.setItem('userSpecializations', JSON.stringify(userData.specializations));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();

    // Listen for custom profile update event
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, [isCurrentUserPost, currentUser]);

  // Get current profile data - use Firebase data for current user, post data for others
  const currentRole = isCurrentUserPost && userProfileData
    ? (userProfileData.role || post.userRole || 'athlete')
    : (post.userRole || 'athlete');
  const currentSport = isCurrentUserPost && userProfileData
    ? (userProfileData.sports?.[0] || post.userSport)
    : post.userSport;
  const currentPosition = isCurrentUserPost && userProfileData
    ? (userProfileData.position || post.userPosition)
    : post.userPosition;
  const currentPlayerType = isCurrentUserPost && userProfileData
    ? (userProfileData.playerType || post.userPlayerType)
    : post.userPlayerType;
  const currentOrganizationType = isCurrentUserPost && userProfileData
    ? (userProfileData.organizationType || post.userOrganizationType)
    : post.userOrganizationType;
  const currentSpecializations = isCurrentUserPost && userProfileData
    ? (userProfileData.specializations || post.userSpecializations)
    : post.userSpecializations;

  return (
    <div className="post" data-testid={`post-${post.id}`}>
      <div className="post-header">
        <div className="post-user-info">
          <div className="post-username-container">
            <h3
              className="post-username-clickable"
              onClick={handleUserClick}
              style={{ cursor: 'pointer' }}
            >
              {post.userDisplayName}
            </h3>
            <SportBanner 
              role={currentRole as any} 
              sport={currentSport}
              position={currentPosition}
              playerType={currentPlayerType}
              organizationType={currentOrganizationType}
              specializations={currentSpecializations}
            />
          </div>
          <span className="post-time">
            {post.timestamp ? (
              (post.timestamp as any)?.toDate ?
                (post.timestamp as any).toDate().toLocaleDateString() :
                (post.timestamp instanceof Date ?
                  post.timestamp.toLocaleDateString() :
                  new Date(post.timestamp as any).toLocaleDateString()
                )
            ) : 'now'}
          </span>
        </div>

        {/* Three dots menu */}
        {currentUser && (
          <div className="post-menu-container">
            <button
              className="post-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePostMenu(post.id);
              }}
            >
              <MoreVertical size={20} />
            </button>

            {showPostMenus[post.id] && (
              <div className="post-menu-dropdown">
                {/* Share option */}
                <button
                  className="menu-item share"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSharePost(post.id, post);
                  }}
                >
                  {shareSuccess[post.id] ? (
                    <>
                      <Check size={16} />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      Share Post
                    </>
                  )}
                </button>

                {/* Edit and Delete options - only for own posts */}
                {post.userId === currentUser.uid && (
                  <>
                    <button
                      className="menu-item edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPost(post.id, post.caption || '');
                      }}
                    >
                      <Edit3 size={16} />
                      Edit Post
                    </button>
                    <button
                      className="menu-item delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePost(post.id, post);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete Post
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Display */}
      {((post.mediaUrl && post.mediaUrl.trim() !== '') ||
        ((post as any).imageUrl && (post as any).imageUrl.trim() !== '') ||
        ((post as any).videoUrl && (post as any).videoUrl.trim() !== '')) && (
          <div className="post-media">
            {(post.mediaType === 'video' || (post as any).videoUrl) ? (
              <div 
                onClick={(e) => {
                  // Prevent navigation when clicking anywhere on video
                  e.stopPropagation();
                }}
              >
                <VideoPlayer
                  src={post.mediaUrl || (post as any).videoUrl}
                  poster={(post as any).mediaMetadata?.thumbnail}
                  controls={true}
                  className="post-video"
                  videoId={`post-${post.id}`}
                  autoPauseOnScroll={true}
                />
              </div>
            ) : (
              <LazyLoadImage
                src={post.mediaUrl || (post as any).imageUrl}
                alt={post.caption}
                className="post-image"
                width={600}
                height={400}
                quality={85}
                webp={true}
                responsive={true}
                threshold={0.1}
                rootMargin="100px"
                onClick={() => handleNavigateToPost(post.id)}
                style={{ cursor: 'pointer' }}
              />
            )}
          </div>
        )}

      {/* Text-only content */}
      {!((post.mediaUrl && post.mediaUrl.trim() !== '') ||
        ((post as any).imageUrl && (post as any).imageUrl.trim() !== '') ||
        ((post as any).videoUrl && (post as any).videoUrl.trim() !== '')) && post.caption && (
          <div className="post-text-content">
            {editingPost === post.id ? (
              <div className="edit-post-container">
                <textarea
                  className="edit-post-input"
                  value={editText}
                  onChange={(e) => onSetEditText(e.target.value)}
                  placeholder="Edit your post..."
                  rows={4}
                  autoFocus
                />
                <div className="edit-post-actions">
                  <button
                    className="save-edit-btn"
                    onClick={() => onSaveEdit(post.id)}
                    disabled={!editText.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleNavigateToPost(post.id)}
                style={{
                  cursor: 'pointer',
                  padding: '16px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  margin: '8px 0',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {post.caption}
                {(post as any).editedAt && (
                  <span className="edited-indicator"> (edited)</span>
                )}
              </div>
            )}
          </div>
        )}

      <div className="post-actions">
        <button
          onClick={() => {
            // Convert Like[] to string[] for backward compatibility
            const likesAsStrings = Array.isArray(post.likes) && post.likes.length > 0 && typeof post.likes[0] === 'string'
              ? post.likes as unknown as string[]
              : (post.likes as Like[]).map(like => like.userId);
            onLike(post.id, likesAsStrings, false, post);
          }}
          className={userLiked ? 'liked' : ''}
          disabled={!currentUser}
        >
          <Heart
            size={20}
            fill={userLiked ? '#e74c3c' : 'none'}
            color={userLiked ? '#e74c3c' : 'currentColor'}
            className={userLiked ? 'heart-liked' : ''}
          />
          <span>{post.likes?.length || 0}</span>
        </button>
        <button
          onClick={() => onToggleComments(post.id)}
          disabled={!post.id}
          className={showComments[post.id] ? 'active' : ''}
        >
          <MessageCircle size={20} />
          <span>{post.comments?.length || 0}</span>
        </button>

        {/* Media type indicator */}
        {(post.mediaType === 'video' || (post as any).videoUrl) && (
          <div className="media-indicator">
            <Video size={16} />
            {(post as any).mediaMetadata?.durationFormatted && (
              <span>{(post as any).mediaMetadata.durationFormatted}</span>
            )}
          </div>
        )}
      </div>

      {/* Caption for posts with media */}
      {((post.mediaUrl && post.mediaUrl.trim() !== '') ||
        ((post as any).imageUrl && (post as any).imageUrl.trim() !== '') ||
        ((post as any).videoUrl && (post as any).videoUrl.trim() !== '')) && (
          <div className="post-caption">
            {editingPost === post.id ? (
              <div className="edit-post-container">
                <textarea
                  className="edit-post-input"
                  value={editText}
                  onChange={(e) => onSetEditText(e.target.value)}
                  placeholder="Edit your post..."
                  rows={3}
                  autoFocus
                />
                <div className="edit-post-actions">
                  <button
                    className="save-edit-btn"
                    onClick={() => onSaveEdit(post.id)}
                    disabled={!editText.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleNavigateToPost(post.id)}
                style={{ cursor: 'pointer' }}
              >
                <strong
                  onClick={handleUserClick}
                  style={{ cursor: 'pointer' }}
                  className="post-username-clickable"
                >
                  {post.userDisplayName}
                </strong> {post.caption}
                {(post as any).editedAt && (
                  <span className="edited-indicator"> (edited)</span>
                )}
              </div>
            )}
          </div>
        )}

      {/* Comments Section */}
      <ErrorBoundary name={`Post Comments for post ${post.id}`}>
        {showComments[post.id] && post.id && (
          <div className="comments-section">
            {/* Safe Comments List */}
            <SafeCommentsList
              comments={post.comments || []}
              currentUserId={currentUser?.uid}
              onDelete={(index) => onDeleteComment(post.id, index)}
              context={`post-${post.id}`}
              emptyMessage="No comments yet. Be the first to comment!"
            />

            {/* Add Comment Form */}
            {!isGuest ? (
              <form
                className="comment-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const commentText = forms.newComment[post.id] || '';
                  if (commentText.trim()) {
                    onCommentSubmit(post.id, commentText);
                  }
                }}
              >
                <div
                  className="comment-input-container"
                  onClick={() => {
                    const input = document.querySelector(`input[data-post-id="${post.id}"]`);
                    if (input) (input as HTMLInputElement).focus();
                  }}
                >
                  <SafeImage
                    src={currentUser?.photoURL || ''}
                    alt="Your avatar"
                    placeholder="avatar"
                    className="comment-avatar"
                    width={32}
                    height={32}
                    style={{ borderRadius: '50%' }}
                    threshold={0.2}
                    rootMargin="50px"
                  />
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={forms.newComment[post.id] || ''}
                    onChange={(e) => onSetNewComment(post.id, e.target.value)}
                    className="comment-input"
                    data-post-id={post.id}
                  />
                  <button
                    type="submit"
                    className="comment-submit-btn"
                    disabled={!forms.newComment[post.id]?.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="guest-comment-message">
                <span>Sign in to comment on posts</span>
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
};

export default Post;
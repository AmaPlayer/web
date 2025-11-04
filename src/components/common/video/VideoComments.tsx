import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, MoreVertical, Reply } from 'lucide-react';
import { VideoComment, CreateVideoCommentData } from '../../../types/models/moment';
import { MomentsService } from '../../../services/api/momentsService';
import PostsService from '../../../services/api/postsService';
import { Comment as PostComment } from '../../../types/models/post';
import './VideoComments.css';

interface VideoCommentsProps {
  momentId: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string | null;
  isVisible: boolean;
  onClose: () => void;
  isPostVideo?: boolean; // Flag to indicate if this is a post video
}

/**
 * VideoComments Component
 * 
 * Displays and manages comments for a video moment.
 * Supports adding new comments, viewing existing comments, and basic interactions.
 */
const VideoComments: React.FC<VideoCommentsProps> = ({
  momentId,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  isVisible,
  onClose,
  isPostVideo = false
}) => {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoFocusedRef = useRef<boolean>(false);

  // Fetch comments when component becomes visible
  useEffect(() => {
    if (isVisible && momentId) {
      fetchComments();
    }
  }, [isVisible, momentId]);

  // Auto-focus and focus trap when comments open
  useEffect(() => {
    if (isVisible) {
      // Focus the close button initially for better accessibility (only once per open)
      if (!hasAutoFocusedRef.current) {
        setTimeout(() => {
          closeButtonRef.current?.focus();
        }, 100);
        hasAutoFocusedRef.current = true;
      }

      // Add keyboard event listener for focus trap and escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        // Simple focus trap
        if (e.key === 'Tab') {
          const container = containerRef.current;
          if (!container) return;

          const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Reset the auto-focus flag when modal closes
      hasAutoFocusedRef.current = false;
    }
  }, [isVisible, onClose]);

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isPostVideo) {
        // Fetch comments from posts collection
        const post = await PostsService.getPostById(momentId, currentUserId);
        if (post && post.comments) {
          // Convert post comments to video comment format and filter out "Current User"
          const postComments = (post.comments as unknown as PostComment[])
            .filter((comment) => comment.userDisplayName !== 'Current User') // Filter out Current User
            .map((comment) => ({
              id: comment.id,
              text: comment.text,
              userId: comment.userId,
              userDisplayName: comment.userDisplayName,
              userPhotoURL: comment.userPhotoURL,
              timestamp: comment.timestamp,
              likes: comment.likes || [],
              likesCount: (comment.likes as unknown[])?.length || 0
            })) as VideoComment[];
          setComments(postComments);
        } else {
          setComments([]);
        }
      } else {
        // Fetch comments from moments collection and filter out "Current User"
        const fetchedComments = await MomentsService.getComments(momentId, 50);
        const filteredComments = fetchedComments.filter(
          (comment) => comment.userDisplayName !== 'Current User'
        );
        setComments(filteredComments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUserId || !currentUserName || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      if (isPostVideo) {
        // Add comment to post
        const postCommentData = {
          text: newComment.trim(),
          userId: currentUserId,
          userDisplayName: currentUserName,
          userPhotoURL: currentUserPhotoURL
        };

        const comment = await PostsService.addComment(momentId, postCommentData);

        // Add the new comment to the local state
        const newCommentObj: VideoComment = {
          id: comment.id,
          text: comment.text,
          userId: comment.userId,
          userDisplayName: comment.userDisplayName,
          userPhotoURL: comment.userPhotoURL,
          timestamp: comment.timestamp,
          likes: comment.likes || [],
          likesCount: 0
        };

        setComments(prev => [...prev, newCommentObj]);
      } else {
        // Add comment to moment
        const commentData: CreateVideoCommentData = {
          text: newComment.trim(),
          userId: currentUserId,
          userDisplayName: currentUserName,
          userPhotoURL: currentUserPhotoURL
        };

        const commentId = await MomentsService.addComment(momentId, commentData);

        // Add the new comment to the local state
        const newCommentObj: VideoComment = {
          id: commentId,
          ...commentData,
          timestamp: new Date(),
          likes: [],
          likesCount: 0
        };

        setComments(prev => [...prev, newCommentObj]);
      }

      setNewComment('');

    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  const handleLikeComment = async (commentId: string, commentIndex: number) => {
    if (!currentUserId) return;

    try {
      if (isPostVideo) {
        // Toggle like for post comment
        await PostsService.toggleCommentLike(momentId, commentIndex, currentUserId);
      } else {
        // Toggle like for moment comment
        await MomentsService.toggleCommentLike(commentId, currentUserId);
      }

      // Update local state optimistically
      setComments(prevComments =>
        prevComments.map((comment, index): VideoComment => {
          if (index === commentIndex) {
            // Ensure likes is treated as string[] for this operation
            const likes = (Array.isArray(comment.likes) && typeof comment.likes[0] === 'string'
              ? comment.likes
              : []) as string[];
            const hasLiked = likes.includes(currentUserId);
            const newLikes: string[] = hasLiked
              ? likes.filter(id => id !== currentUserId)
              : [...likes, currentUserId];

            return {
              ...comment,
              likes: newLikes,
              likesCount: newLikes.length
            };
          }
          return comment;
        })
      );
    } catch (err) {
      console.error('Failed to like comment:', err);
      // Refresh comments to get correct state
      fetchComments();
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="video-comments-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comments-title"
      aria-describedby="comments-description"
    >
      <div className="video-comments-container" ref={containerRef}>
        <div className="comments-header">
          <h3 id="comments-title">Comments</h3>
          <button 
            ref={closeButtonRef}
            className="close-comments-btn"
            onClick={onClose}
            aria-label="Close comments dialog"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        <div className="comments-content" id="comments-description">
          {loading && (
            <div className="comments-loading" role="status" aria-live="polite">
              <div className="loading-spinner" />
              <p>Loading comments...</p>
            </div>
          )}

          {error && (
            <div className="comments-error" role="alert" aria-live="assertive">
              <p className="error-message">{error}</p>
              <button 
                className="retry-btn"
                onClick={fetchComments}
                aria-label="Retry loading comments"
                tabIndex={0}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && comments.length === 0 && (
            <div className="comments-empty" role="status">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}

          {!loading && !error && comments.length > 0 && (
            <div 
              className="comments-list" 
              role="list" 
              aria-label={`${comments.length} comments`}
            >
              {comments.map((comment, index) => {
                // Handle both string[] and VideoLike[] types for likes
                const hasLiked = Array.isArray(comment.likes)
                  ? typeof comment.likes[0] === 'string'
                    ? (comment.likes as string[]).includes(currentUserId || '')
                    : (comment.likes as { userId: string }[]).some(like => like.userId === currentUserId)
                  : false;

                return (
                  <div key={comment.id} className="comment-item" role="listitem">
                    <div className="comment-avatar">
                      {comment.userPhotoURL ? (
                        <img
                          src={comment.userPhotoURL}
                          alt={`${comment.userDisplayName}'s profile picture`}
                          className="avatar-image"
                          role="img"
                        />
                      ) : (
                        <div
                          className="avatar-placeholder"
                          role="img"
                          aria-label={`${comment.userDisplayName}'s profile picture`}
                        >
                          {comment.userDisplayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.userDisplayName}</span>
                        <span className="comment-timestamp">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                      </div>

                      <p className="comment-text">{comment.text}</p>

                      <div className="comment-actions" role="group" aria-label="Comment actions">
                        <button
                          className={`comment-action-btn ${hasLiked ? 'liked' : ''}`}
                          onClick={() => handleLikeComment(comment.id, index)}
                          aria-label={`${hasLiked ? 'Unlike' : 'Like'} comment by ${comment.userDisplayName}. ${comment.likesCount || 0} likes`}
                          tabIndex={0}
                        >
                          <Heart size={14} fill={hasLiked ? 'currentColor' : 'none'} />
                          {comment.likesCount && comment.likesCount > 0 && (
                            <span className="action-count" aria-hidden="true">{comment.likesCount}</span>
                          )}
                        </button>

                        <button
                          className="comment-action-btn"
                          aria-label={`Reply to ${comment.userDisplayName}'s comment`}
                          tabIndex={0}
                        >
                          <Reply size={14} />
                          Reply
                        </button>
                      </div>
                    </div>

                    <button
                      className="comment-menu-btn"
                      aria-label={`More options for ${comment.userDisplayName}'s comment`}
                      tabIndex={0}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {currentUserId && (
          <form className="comment-form" onSubmit={handleSubmitComment} role="form" aria-label="Add a comment">
            <div className="comment-input-container">
              <div className="comment-input-avatar">
                {currentUserPhotoURL ? (
                  <img
                    src={currentUserPhotoURL}
                    alt="Your profile picture"
                    className="avatar-image"
                    role="img"
                  />
                ) : (
                  <div 
                    className="avatar-placeholder"
                    role="img"
                    aria-label="Your profile picture"
                  >
                    {currentUserName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              
              <textarea
                ref={textareaRef}
                className="comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                maxLength={500}
                disabled={submitting}
                aria-label="Write your comment"
                aria-describedby="character-count"
                required
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
              />
              
              <button
                type="submit"
                className="send-comment-btn"
                disabled={!newComment.trim() || submitting}
                aria-label={submitting ? "Sending comment..." : "Send comment"}
                tabIndex={0}
              >
                {submitting ? (
                  <div className="button-spinner" aria-hidden="true" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            
            <div className="comment-form-footer">
              <span 
                className="character-count" 
                id="character-count"
                aria-live="polite"
                role="status"
              >
                {newComment.length}/500 characters
              </span>
            </div>
          </form>
        )}

        {!currentUserId && (
          <div className="comment-login-prompt" role="status">
            <p>Sign in to add a comment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoComments;
// Comment modal for posts with lazy loading
import { memo, useState, useCallback, useEffect, FormEvent } from 'react';
import { X, Send, Heart, MoreHorizontal, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { validateComment, getCharacterCount } from '../../../utils/validation/validation';
import { handleCommentError, retryWithBackoff } from '../../../utils/error/engagementErrorHandler';
import { useToast } from '../../../hooks/useToast';
import LazyImage from '../ui/LazyImage';
import LoadingSpinner from '../feedback/LoadingSpinner';
import ErrorMessage from '../feedback/ErrorMessage';
import { Post, Comment, CreateCommentData } from '../../../types/models';
import postsService from '../../../services/api/postsService';
import './Modal.css';

interface CommentModalProps {
  post: Post;
  onClose: () => void;
  onCommentAdded?: (comment: Comment) => void;
}

const CommentModal = memo<CommentModalProps>(({ post, onClose, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const MAX_COMMENT_LENGTH = 500;

  // Fetch comments from the post data
  const fetchComments = useCallback(async (postData: Post): Promise<Comment[]> => {
    try {
      // Get fresh post data to ensure we have the latest comments
      const freshPost = await postsService.getById(postData.id);
      if (!freshPost) {
        throw new Error('Post not found');
      }

      const postComments = (freshPost.comments || []) as Comment[];
      
      // Sort comments by newest first (timestamp descending)
      return postComments.sort((a, b) => {
        const aTime = a.timestamp && typeof a.timestamp === 'object' && 'seconds' in a.timestamp 
          ? (a.timestamp as any).seconds * 1000
          : new Date(a.timestamp as string).getTime();
        const bTime = b.timestamp && typeof b.timestamp === 'object' && 'seconds' in b.timestamp 
          ? (b.timestamp as any).seconds * 1000
          : new Date(b.timestamp as string).getTime();
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }, []);

  const submitComment = useCallback(async (postId: string, text: string): Promise<Comment> => {
    if (!currentUser) {
      throw new Error('User must be authenticated to comment');
    }

    const commentData: CreateCommentData = {
      text: text.trim(),
      userId: currentUser.uid,
      userDisplayName: currentUser.displayName || 'Anonymous User',
      userPhotoURL: currentUser.photoURL || null,
    };

    try {
      const serviceComment = await postsService.addComment(postId, commentData);
      
      // Convert service comment to model comment
      const modelComment: Comment = {
        id: serviceComment.id,
        text: serviceComment.text,
        userId: serviceComment.userId,
        userDisplayName: serviceComment.userDisplayName,
        userPhotoURL: serviceComment.userPhotoURL,
        timestamp: serviceComment.timestamp,
        likes: serviceComment.likes as string[], // Convert unknown[] to string[]
        likesCount: 0,
      };
      
      return modelComment;
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error;
    }
  }, [currentUser]);

  const likeComment = useCallback(async (commentId: string, liked: boolean): Promise<{ success: boolean; liked: boolean }> => {
    // TODO: Implement comment liking functionality
    // For now, return success to maintain UI functionality
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, liked };
  }, []);

  // Load comments with retry mechanism
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const commentsData = await retryWithBackoff(
        () => fetchComments(post),
        {
          maxAttempts: retryCount < 2 ? 3 : 1,
          baseDelay: 1000,
          maxDelay: 5000
        }
      );
      
      setComments(commentsData);
      setRetryCount(0); // Reset on success
      
    } catch (error) {
      const engagementError = handleCommentError(error, post.id, 'load');
      setError(engagementError.userMessage);
      
      if (engagementError.canRetry) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [post, fetchComments, retryCount]);

  // Load comments
  useEffect(() => {
    if (post?.id) {
      loadComments();
    }
  }, [post?.id, loadComments]);

  // Validate comment input
  const validateCommentInput = useCallback((text: string) => {
    const validation = validateComment(text, {
      maxLength: MAX_COMMENT_LENGTH,
      allowEmpty: false,
      requireAlphanumeric: true
    });
    
    setValidationError(validation.isValid ? null : validation.error || null);
    return validation.isValid;
  }, []);

  // Handle comment input change with validation
  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Clear validation error when user starts typing
    if (validationError && value.trim().length > 0) {
      setValidationError(null);
    }
  }, [validationError]);

  // Handle comment submission
  const handleSubmitComment = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !currentUser) return;

    const commentText = newComment.trim();
    
    // Validate comment before submission
    if (!validateCommentInput(commentText)) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setValidationError(null);
      
      const comment = await retryWithBackoff(
        () => submitComment(post.id, commentText),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000
        }
      );
      
      // Add comment to local state (sorted by newest first)
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      // Notify parent component about the new comment for counter updates
      onCommentAdded?.(comment);
      
      // Show success feedback
      showToast('Success', 'Comment posted successfully!', {
        type: 'success',
        duration: 3000
      });
      
    } catch (error) {
      const engagementError = handleCommentError(error, post.id, 'add');
      
      if (engagementError.canRetry) {
        showToast('Comment Failed', engagementError.userMessage, {
          type: 'error',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => handleSubmitComment(e)
          }
        });
      } else {
        setValidationError(engagementError.userMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }, [newComment, submitting, currentUser, post.id, submitComment, onCommentAdded, validateCommentInput, showToast]);

  // Handle comment like
  const handleLikeComment = useCallback(async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment || !currentUser) return;
    
    // Check if user has already liked this comment
    const userLikes = Array.isArray(comment.likes) ? comment.likes : [];
    const isCurrentlyLiked = userLikes.some((like: any) => 
      typeof like === 'string' ? like === currentUser.uid : like.userId === currentUser.uid
    );
    
    const newLiked = !isCurrentlyLiked;
    const currentLikesCount = comment.likesCount || userLikes.length;
    
    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { 
            ...c, 
            likesCount: newLiked ? currentLikesCount + 1 : Math.max(0, currentLikesCount - 1)
          }
        : c
    ));

    try {
      await likeComment(commentId, newLiked);
    } catch (error) {
      // Revert on error
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { 
              ...c, 
              likesCount: newLiked ? Math.max(0, currentLikesCount - 1) : currentLikesCount + 1
            }
          : c
      ));
      console.error('Error liking comment:', error);
      setError('Failed to like comment. Please try again.');
    }
  }, [comments, likeComment, currentUser]);

  const formatTime = useCallback((timestamp: any): string => {
    const now = new Date();
    let time: Date;
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      time = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      time = timestamp;
    } else if (typeof timestamp === 'string') {
      time = new Date(timestamp);
    } else {
      return 'now';
    }
    
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Comments</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Post Preview */}
        <div className="post-preview">
          <div className="user-info">
            <LazyImage
              src={post.userPhotoURL}
              alt={post.userDisplayName}
              className="user-avatar small"
              placeholder="/default-avatar.jpg"
            />
            <div className="user-details">
              <h4>{post.userDisplayName}</h4>
              <span className="post-time">{formatTime(post.createdAt && typeof (post.createdAt as any).toDate === 'function' ? (post.createdAt as any).toDate() : new Date(post.createdAt as any))}</span>
            </div>
          </div>
          {post.caption && <p className="post-caption">{post.caption}</p>}
        </div>

        {/* Comments List */}
        <div className="comments-container">
          {error && (
            <ErrorMessage
              message={error}
              type="error"
              onDismiss={() => setError(null)}
              onRetry={loadComments}
              retryLabel="Reload Comments"
              className="comment-error"
            />
          )}
          
          {loading ? (
            <div className="loading-comments">
              <LoadingSpinner size="medium" text="Loading comments..." className="center" />
            </div>
          ) : comments.length > 0 ? (
            <div className="comments-list">
              {comments.map(comment => {
                const userLikes = Array.isArray(comment.likes) ? comment.likes : [];
                const isLiked = currentUser ? userLikes.some((like: any) => 
                  typeof like === 'string' ? like === currentUser.uid : like.userId === currentUser.uid
                ) : false;
                const likesCount = comment.likesCount || userLikes.length;
                
                return (
                  <div key={comment.id} className="comment">
                    <LazyImage
                      src={comment.userPhotoURL || '/default-avatar.jpg'}
                      alt={comment.userDisplayName}
                      className="comment-avatar"
                      placeholder="/default-avatar.jpg"
                    />
                    <div className="comment-content">
                      <div className="comment-header">
                        <h5 className="comment-author">{comment.userDisplayName}</h5>
                        <span className="comment-time">{formatTime(comment.timestamp)}</span>
                        {currentUser?.uid === comment.userId && (
                          <button className="comment-options">
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      </div>
                      <p className="comment-text">{comment.text}</p>
                      <div className="comment-actions">
                        {currentUser && (
                          <button 
                            className={`comment-like ${isLiked ? 'liked' : ''}`}
                            onClick={() => handleLikeComment(comment.id)}
                          >
                            <Heart size={14} fill={isLiked ? '#e91e63' : 'none'} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                          </button>
                        )}
                        <button className="comment-reply">Reply</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-comments">
              <div className="empty-icon">
                <User size={48} />
              </div>
              <h4>No comments yet</h4>
              <p>Be the first to comment on this post!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        {currentUser && (
          <div className="comment-form-section">
            {validationError && (
              <ErrorMessage
                message={validationError}
                type="warning"
                onDismiss={() => setValidationError(null)}
                className="comment-validation-error"
              />
            )}
            
            <form className="comment-form" onSubmit={handleSubmitComment}>
              <LazyImage
                src={currentUser.photoURL || '/default-avatar.jpg'}
                alt={currentUser.displayName || 'User'}
                className="user-avatar small"
                placeholder="/default-avatar.jpg"
              />
              <div className="comment-input-container">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={handleCommentChange}
                  disabled={submitting}
                  maxLength={MAX_COMMENT_LENGTH}
                  aria-describedby={validationError ? 'comment-error' : undefined}
                />
                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={!newComment.trim() || submitting || !!validationError}
                  aria-label="Send comment"
                >
                  {submitting ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </form>
            
            {/* Character counter */}
            <div className="comment-meta">
              <span className={`character-count ${getCharacterCount(newComment, MAX_COMMENT_LENGTH).isOverLimit ? 'over-limit' : ''}`}>
                {getCharacterCount(newComment, MAX_COMMENT_LENGTH).remaining} characters remaining
              </span>
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="guest-comment-notice">
            <p>Sign in to join the conversation</p>
          </div>
        )}
      </div>
    </div>
  );
});

CommentModal.displayName = 'CommentModal';

export default CommentModal;

// Comment modal for posts with lazy loading
import { memo, useState, useCallback, useEffect, FormEvent } from 'react';
import { X, Send, Heart, MoreHorizontal, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import LazyImage from '../ui/LazyImage';
import { Post } from '../../../types/models';
import './Modal.css';

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  text: string;
  createdAt: Date;
  likesCount: number;
  isLiked: boolean;
}

interface CommentModalProps {
  post: Post;
  onClose: () => void;
}

const CommentModal = memo<CommentModalProps>(({ post, onClose }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Mock API functions (replace with real API calls)
  const fetchComments = useCallback(async (postId: string): Promise<Comment[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockComments: Comment[] = Array.from({ length: 15 }, (_, index) => ({
      id: `comment-${index}`,
      postId,
      userId: `user-${Math.floor(Math.random() * 20)}`,
      userDisplayName: `User ${Math.floor(Math.random() * 20)}`,
      userPhotoURL: `https://picsum.photos/40/40?random=${index}`,
      text: [
        'Great post! 🔥',
        'Amazing content, keep it up!',
        'This is exactly what I needed to see today',
        'Incredible work! How did you do this?',
        'Thanks for sharing this with us',
        'This deserves more views',
        'Absolutely love this! Can\'t wait to see more',
        'Perfect timing for this post',
        'This made my day! Thank you',
        'Outstanding quality as always'
      ][Math.floor(Math.random() * 10)],
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 3),
      likesCount: Math.floor(Math.random() * 20),
      isLiked: Math.random() > 0.7
    }));

    return mockComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  const submitComment = useCallback(async (postId: string, text: string): Promise<Comment> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: `comment-${Date.now()}`,
      postId,
      userId: currentUser?.uid || 'guest',
      userDisplayName: currentUser?.displayName || 'Guest User',
      userPhotoURL: currentUser?.photoURL || '/default-avatar.jpg',
      text,
      createdAt: new Date(),
      likesCount: 0,
      isLiked: false
    };
  }, [currentUser]);

  const likeComment = useCallback(async (commentId: string, liked: boolean): Promise<{ success: boolean; liked: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, liked };
  }, []);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const commentsData = await fetchComments(post.id);
        setComments(commentsData);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (post?.id) {
      loadComments();
    }
  }, [post?.id, fetchComments]);

  // Handle comment submission
  const handleSubmitComment = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const comment = await submitComment(post.id, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [newComment, submitting, post.id, submitComment]);

  // Handle comment like
  const handleLikeComment = useCallback(async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    void likeComment; // Use the function to avoid unused warning

    const newLiked = !comment.isLiked;
    
    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: newLiked, likesCount: newLiked ? c.likesCount + 1 : c.likesCount - 1 }
        : c
    ));

    try {
      await likeComment(commentId, newLiked);
    } catch (error) {
      // Revert on error
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, isLiked: !newLiked, likesCount: newLiked ? c.likesCount - 1 : c.likesCount + 1 }
          : c
      ));
      console.error('Error liking comment:', error);
    }
  }, [comments, likeComment]);

  const formatTime = useCallback((timestamp: Date): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
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
          {loading ? (
            <div className="loading-comments">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="comment-skeleton">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-content">
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <LazyImage
                    src={comment.userPhotoURL}
                    alt={comment.userDisplayName}
                    className="comment-avatar"
                    placeholder="/default-avatar.jpg"
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <h5 className="comment-author">{comment.userDisplayName}</h5>
                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                      <button className="comment-options">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    <div className="comment-actions">
                      <button 
                        className={`comment-like ${comment.isLiked ? 'liked' : ''}`}
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        <Heart size={14} fill={comment.isLiked ? '#e91e63' : 'none'} />
                        {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                      </button>
                      <button className="comment-reply">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
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
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
                maxLength={500}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <div className="loading-spinner small" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </form>
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

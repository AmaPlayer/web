import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePostInteractions } from '../../hooks/usePostInteractions';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { Heart, MessageCircle, ArrowLeft, Video, Send, Trash2, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import VideoPlayer from '../../components/common/media/VideoPlayer';
import LazyImage from '../../components/common/ui/LazyImage';
import SafeImage from '../../components/common/SafeImage';
import notificationService from '../../services/notificationService';
import { filterChatMessage, getChatViolationMessage, logChatViolation } from '../../utils/content/chatFilter';
import FooterNav from '../../components/layout/FooterNav';
import { LoadingFallback } from '../../utils/performance/lazyLoading';
import './PostDetail.css';
import { cleanupPostComments } from '../../utils/data/cleanupPosts';
import { SafeCommentsList } from '../../components/common/safety/SafeComment';
import type { Post, Comment, Like, ShareData } from '../../types/models';

// Lazy-loaded components
const ShareModal = lazy(() => import('../../components/common/modals/ShareModal'));

interface ShareNotification {
  type: 'success' | 'error';
  message: string;
  timestamp: number;
}

export default function PostDetail(): React.JSX.Element {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser, isGuest } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isCommenting, setIsCommenting] = useState<boolean>(false);
  const [isDeletingComment, setIsDeletingComment] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareNotification, setShareNotification] = useState<ShareNotification | null>(null);
  const [engagementError, setEngagementError] = useState<string | null>(null);
  
  // Initialize post interactions hook for sharing functionality
  const {
    sharePost,
    getShareState,
    clearShareState,
    updateShareCount,
    getShareRateLimit,
    hasUserSharedPost,
    getShareAnalytics
  } = usePostInteractions();

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async (): Promise<void> => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📱 Loading post:', postId);
      
      // Clean up corrupted comments for this specific post
      await cleanupPostComments(postId);
      
      const postDoc = await getDoc(doc(db, 'posts', postId));
      
      if (postDoc.exists()) {
        const postData = { id: postDoc.id, ...postDoc.data() } as Post;
        
        // Clean up comment objects to prevent React error #31
        if (postData.comments && Array.isArray(postData.comments)) {
          postData.comments = postData.comments.map((comment: any) => {
            if (typeof comment === 'object' && comment !== null) {
              const { postId: _, ...cleanComment } = comment; // Remove postId field
              return {
                text: String(cleanComment.text || ''),
                userId: String(cleanComment.userId || ''),
                userDisplayName: String(cleanComment.userDisplayName || 'Unknown User'),
                userPhotoURL: String(cleanComment.userPhotoURL || ''),
                timestamp: cleanComment.timestamp || null
              } as Comment;
            }
            return comment;
          });
        }

        // Ensure accurate engagement counts are calculated
        const likes = postData.likes || [];
        const comments = postData.comments || [];
        const shares = postData.shares || [];

        postData.likesCount = likes.length;
        postData.commentsCount = comments.length;
        postData.sharesCount = postData.sharesCount || shares.length;
        
        console.log('📱 Post loaded:', postData);
        
        // Debug media URLs
        console.log('📱 Media URLs:', {
          mediaUrl: postData.mediaUrl,
          mediaType: postData.mediaType
        });
        
        setPost(postData);
      } else {
        console.error('❌ Post not found:', postId);
        setError('Post not found');
      }
    } catch (error) {
      console.error('❌ Error loading post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (): Promise<void> => {
    if (!currentUser || !post || isLiking) return;

    setIsLiking(true);
    const postRef = doc(db, 'posts', post.id);
    const currentLikes = post.likes || [];
    // Handle both string[] and Like[] formats for backward compatibility
    const userLiked = Array.isArray(currentLikes) && currentLikes.length > 0 && typeof currentLikes[0] === 'string' 
      ? (currentLikes as unknown as string[]).includes(currentUser.uid)
      : (currentLikes as Like[]).some(like => like.userId === currentUser.uid);

    // Store original state for error rollback
    const originalPost = { ...post };

    try {
      if (userLiked) {
        // Optimistic update - remove like
        const updatedLikes = Array.isArray(currentLikes) && currentLikes.length > 0 && typeof currentLikes[0] === 'string'
          ? (currentLikes as unknown as string[]).filter(uid => uid !== currentUser.uid)
          : (currentLikes as Like[]).filter(like => like.userId !== currentUser.uid);
        
        setPost(prev => prev ? ({
          ...prev,
          likes: updatedLikes as Like[],
          likesCount: updatedLikes.length
        }) : null);

        // Remove like - handle both string and Like object formats
        if (currentLikes.length > 0 && typeof currentLikes[0] === 'string') {
          // Handle legacy string format
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid),
            likesCount: updatedLikes.length
          });
        } else {
          // Handle Like object format
          const likeToRemove = (currentLikes as Like[]).find(like => like.userId === currentUser.uid);
          if (likeToRemove) {
            await updateDoc(postRef, {
              likes: arrayRemove(likeToRemove),
              likesCount: updatedLikes.length
            });
          }
        }
      } else {
        // Optimistic update - add like
        const newLikes = [...currentLikes, currentUser.uid] as unknown as Like[];
        
        setPost(prev => prev ? ({
          ...prev,
          likes: newLikes,
          likesCount: newLikes.length
        }) : null);

        // Add like as string for backward compatibility
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid),
          likesCount: newLikes.length
        });
        
        // Send notification to post owner (only when liking, not unliking)
        if (post.userId && post.userId !== currentUser.uid) {
          try {
            console.log('🔔 Sending like notification to:', post.userId);
            await notificationService.sendLikeNotification(
              currentUser.uid,
              currentUser.displayName || 'Someone',
              currentUser.photoURL || '',
              post.userId,
              post.id,
              post
            );
          } catch (notificationError) {
            console.error('Error sending like notification:', notificationError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
      
      // Rollback optimistic update on error
      setPost(originalPost);
      
      // Show user-friendly error message
      setEngagementError('Failed to update like. Please try again.');
      setTimeout(() => setEngagementError(null), 5000);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const commentText = newComment.trim();
    
    if (!commentText || !currentUser || isCommenting || !post) return;

    setIsCommenting(true);

    // Prevent guests from commenting
    if (isGuest()) {
      setIsCommenting(false);
      if (window.confirm('Please sign up or log in to comment on posts.\n\nWould you like to go to the login page?')) {
        navigate('/login');
      }
      return;
    }

    // Content filtering for comments
    const filterResult = filterChatMessage(commentText);
    
    if (!filterResult.isClean) {
      const violationMessage = getChatViolationMessage(filterResult.violations, filterResult.categories);
      
      // Log the violation
      await logChatViolation(currentUser.uid, commentText, filterResult.violations, 'comment');
      
      // Show user-friendly error message
      alert(`You can't post this comment.\n\n${violationMessage}\n\nTip: Share positive sports content, training updates, or encouraging messages!`);
      setIsCommenting(false);
      return;
    }

    // Store original state for error rollback
    const originalPost = { ...post };

    try {
      const commentData: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: commentText,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous User',
        userPhotoURL: currentUser.photoURL || '',
        timestamp: Timestamp.now(),
        likes: []
      };

      // Optimistic update - add comment to local state immediately
      const updatedComments = [...(post.comments || []), commentData];
      setPost(prev => prev ? ({
        ...prev,
        comments: updatedComments,
        commentsCount: updatedComments.length
      }) : null);

      // Clear input immediately for better UX
      setNewComment('');

      // Update post's comment array in database
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(commentData),
        commentsCount: updatedComments.length
      });

      // Send notification to post owner (only if commenting on someone else's post)
      if (post.userId && post.userId !== currentUser.uid) {
        try {
          console.log('🔔 Sending comment notification to:', post.userId);
          await notificationService.sendCommentNotification(
            currentUser.uid,
            currentUser.displayName || 'Someone',
            currentUser.photoURL || '',
            post.userId,
            post.id,
            commentText,
            post
          );
        } catch (notificationError) {
          console.error('Error sending comment notification:', notificationError);
        }
      }

    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Rollback optimistic update on error
      setPost(originalPost);
      setNewComment(commentText); // Restore the comment text
      
      // Show user-friendly error message
      setEngagementError('Failed to add comment. Please try again.');
      setTimeout(() => setEngagementError(null), 5000);
    } finally {
      setIsCommenting(false);
    }
  };

  // Handle share button click
  const handleShare = useCallback(() => {
    if (!currentUser || isGuest()) {
      if (window.confirm('Please sign up or log in to share posts.\n\nWould you like to go to the login page?')) {
        navigate('/login');
      }
      return;
    }
    setShowShareModal(true);
  }, [currentUser, isGuest, navigate]);

  // Handle share completion with success/error feedback
  const handleShareComplete = useCallback(async (shareData: ShareData) => {
    if (!currentUser || !post) return;

    try {
      // Execute the share using the post interactions hook
      const result = await sharePost(post.id, shareData.type as "friends" | "groups" | "feeds", shareData.targets);
      
      // Update local share count optimistically
      updateShareCount(post.id, 1);
      
      // Update post state with new share count
      setPost(prev => prev ? ({
        ...prev,
        sharesCount: (prev.sharesCount || 0) + 1
      }) : null);
      
      // Show success notification
      setShareNotification({
        type: 'success',
        message: `Successfully shared to ${shareData.type}!`,
        timestamp: Date.now()
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setShareNotification(null);
        clearShareState(post.id);
      }, 3000);
      
      // Close modal
      setShowShareModal(false);
      
      return result;
    } catch (error) {
      console.error('Share failed:', error);
      
      // Show error notification
      setShareNotification({
        type: 'error',
        message: (error as Error).message || 'Failed to share post. Please try again.',
        timestamp: Date.now()
      });
      
      // Clear error notification after 5 seconds
      setTimeout(() => {
        setShareNotification(null);
        if (post) {
          clearShareState(post.id);
        }
      }, 5000);
      
      throw error;
    }
  }, [currentUser, post, sharePost, updateShareCount, clearShareState]);

  // Close share modal
  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handleDeleteComment = async (commentIndex: number): Promise<void> => {
    if (!currentUser || !post || isDeletingComment === commentIndex) return;

    const commentToDelete = post.comments?.[commentIndex];
    
    if (!commentToDelete) return;

    // Only allow users to delete their own comments
    if (commentToDelete.userId !== currentUser.uid) {
      setEngagementError('You can only delete your own comments');
      setTimeout(() => setEngagementError(null), 3000);
      return;
    }

    setIsDeletingComment(commentIndex);
    
    // Store original state for error rollback
    const originalPost = { ...post };

    try {
      // Optimistic update - remove comment from local state immediately
      const updatedComments = post.comments?.filter((_, index) => index !== commentIndex) || [];
      setPost(prev => prev ? ({
        ...prev,
        comments: updatedComments,
        commentsCount: updatedComments.length
      }) : null);

      // Update database
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayRemove(commentToDelete),
        commentsCount: updatedComments.length
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Rollback optimistic update on error
      setPost(originalPost);
      
      // Show user-friendly error message
      setEngagementError('Failed to delete comment. Please try again.');
      setTimeout(() => setEngagementError(null), 5000);
    } finally {
      setIsDeletingComment(null);
    }
  };

  if (loading) {
    return (
      <div className="post-detail">
        <nav className="nav-bar">
          <div className="nav-content">
            <button onClick={() => navigate(-1)} className="back-btn">
              <ArrowLeft size={20} />
              Back
            </button>
            <h1>Post</h1>
            <div className="nav-links">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </nav>
        
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Loading post...</span>
          </div>
        </div>
        
        <FooterNav />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail">
        <nav className="nav-bar">
          <div className="nav-content">
            <button onClick={() => navigate(-1)} className="back-btn">
              <ArrowLeft size={20} />
              Back
            </button>
            <h1>Post</h1>
            <div className="nav-links">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </nav>
        
        <div className="main-content">
          <div className="error-container">
            <h2>Post Not Found</h2>
            <p>The post you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => navigate('/home')} className="home-btn">
              Go to Home
            </button>
          </div>
        </div>
        
        <FooterNav />
      </div>
    );
  }

  const effectiveLikes = post.likes || [];
  const userLiked = Array.isArray(effectiveLikes) && effectiveLikes.length > 0 && typeof effectiveLikes[0] === 'string' 
    ? (effectiveLikes as unknown as string[]).includes(currentUser?.uid || '')
    : (effectiveLikes as Like[]).some(like => like.userId === (currentUser?.uid || ''));

  // Calculate accurate engagement counts
  const likesCount = effectiveLikes.length;
  const commentsCount = post.comments?.length || 0;
  const sharesCount = post.sharesCount || post.shares?.length || 0;

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'now';
    
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="post-detail">
      <nav className="nav-bar">
        <div className="nav-content">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Post</h1>
          <div className="nav-links">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Share Notification */}
      {shareNotification && (
        <div className={`share-notification ${shareNotification.type}`}>
          <div className="notification-content">
            {shareNotification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{shareNotification.message}</span>
          </div>
        </div>
      )}

      {/* Engagement Error Notification */}
      {engagementError && (
        <div className="share-notification error">
          <div className="notification-content">
            <AlertCircle size={20} />
            <span>{engagementError}</span>
          </div>
        </div>
      )}

      <div className="main-content post-detail-content">
        <div className="post-detail-container">
          <div className="post">
            <div className="post-header">
              <h3>{post.userDisplayName}</h3>
              <span className="post-time">
                {formatTimestamp(post.timestamp)}
              </span>
            </div>
            
            {/* Media Display - Only render if media exists */}
            {(post.mediaUrl && post.mediaUrl.trim() !== '') && (
              <div className="post-media">
                {post.mediaType === 'video' ? (
                  <div className="post-video-container">
                    <VideoPlayer 
                      src={post.mediaUrl || ''}
                      poster={post.mediaMetadata?.thumbnail}
                      controls={true}
                      className="post-video"
                      videoId={`post-${post.id}`}
                      autoPauseOnScroll={false}
                    />
                  </div>
                ) : (
                  <div className="post-image-container">
                    <LazyImage 
                      src={post.mediaUrl || ''} 
                      alt={post.caption || 'Post image'} 
                      className="post-image"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="post-actions">
              <button 
                onClick={handleLike}
                className={userLiked ? 'liked' : ''}
                disabled={!currentUser || isLiking}
                title={currentUser ? (userLiked ? 'Unlike this post' : 'Like this post') : 'Sign in to like'}
              >
                <Heart 
                  size={20} 
                  fill={userLiked ? '#e74c3c' : 'none'}
                  color={userLiked ? '#e74c3c' : 'currentColor'}
                  className={userLiked ? 'heart-liked' : ''}
                />
                <span>{likesCount}</span>
                {isLiking && <span style={{marginLeft: '5px'}}>...</span>}
              </button>
              <button 
                className="active"
                title="View comments"
              >
                <MessageCircle size={20} />
                <span>{commentsCount}</span>
              </button>
              <button 
                onClick={handleShare}
                className={hasUserSharedPost(post.id, currentUser?.uid) ? 'shared' : ''}
                disabled={!currentUser || getShareState(post.id).loading}
                title={currentUser ? 'Share this post' : 'Sign in to share'}
              >
                <Share2 
                  size={20} 
                  className={getShareState(post.id).loading ? 'spinning' : ''}
                />
                <span>{sharesCount}</span>
                {getShareState(post.id).loading && <span style={{marginLeft: '5px'}}>...</span>}
              </button>
              
              {/* Media type indicator */}
              {post.mediaType === 'video' && (
                <div className="media-indicator">
                  <Video size={16} />
                  {post.mediaMetadata?.durationFormatted && (
                    <span>{post.mediaMetadata.durationFormatted}</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Text-only content - render as main content if no media */}
            {!(post.mediaUrl && post.mediaUrl.trim() !== '') && post.caption && (
              <div 
                className="post-text-content"
                style={{ 
                  padding: '20px',
                  fontSize: '18px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  margin: '16px 0',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid var(--border-color)'
                }}
              >
                {post.caption}
              </div>
            )}
            
            {/* Caption - only show for posts with media */}
            {(post.mediaUrl && post.mediaUrl.trim() !== '') && post.caption && (
              <div className="post-caption">
                <strong>{post.userDisplayName}</strong> {post.caption}
              </div>
            )}

            {/* Comments Section */}
            <div className="comments-section">
              {/* Safe Comments List */}
              <SafeCommentsList
                comments={post.comments || []}
                currentUserId={currentUser?.uid}
                onDelete={(index: number) => handleDeleteComment(index)}
                context={`post-detail-${post.id}`}
                emptyMessage="No comments yet. Be the first to comment!"
              />

              {/* Add Comment Form */}
              {!isGuest() ? (
                <form 
                  className="comment-form"
                  onSubmit={handleCommentSubmit}
                >
                  <div className="comment-input-container">
                    <SafeImage 
                      src={currentUser?.photoURL || ''} 
                      alt="Your avatar"
                      placeholder="avatar"
                      className="comment-avatar"
                      width={32}
                      height={32}
                      style={{ borderRadius: '50%' }}
                    />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="comment-input"
                      disabled={isCommenting}
                    />
                    <button 
                      type="submit"
                      className="comment-submit-btn"
                      disabled={!newComment.trim() || isCommenting}
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
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      <Suspense fallback={<LoadingFallback />}>
        {showShareModal && post && (
          <ShareModal
            post={post}
            currentUser={currentUser}
            onClose={closeShareModal}
            onShareComplete={handleShareComplete}
          />
        )}
      </Suspense>
      
      <FooterNav />
    </div>
  );
}

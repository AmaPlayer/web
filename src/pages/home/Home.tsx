import React, { useEffect, useCallback, useMemo, memo, Suspense, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adaptFirebaseUser } from '../../utils/auth/userAdapter';
import { usePostOperations } from '../../hooks/usePostOperations';
import { useCommentOperations } from '../../hooks/useCommentOperations';
import { useNotifications } from '../../hooks/useNotifications';
import { useSimpleAnalytics } from '../../utils/simpleAnalytics';
import { sharePost } from './utils/shareUtils';
import { initializeHomeFeatures } from './utils/initializationUtils';
import { handleCommentSubmission, handleCommentDeletion } from './utils/commentUtils';
import {
  handlePostLike,
  handlePostEdit,
  handlePostSave,
  handlePostDeletion,
  handlePostCreation
} from './utils/postUtils';
import NavigationBar from './components/NavigationBar';
import NotificationPrompt from './components/NotificationPrompt';
import PostComposer from './components/PostComposer';
// Use optimized PostsFeed with progressive loading
import PostsFeed from './components/PostsFeed';
import StoriesContainer from '../../features/stories/StoriesContainer';
import FooterNav from '../../components/layout/FooterNav';
import ErrorBoundary from '../../components/common/safety/ErrorBoundary';
import { Post } from '../../types/models/post';
// Removed performance monitoring hooks to prevent re-renders and hook violations
import './Home.css';

// Debug components removed to prevent performance issues

// Advanced features - import with fallbacks
let usePredictivePrefetch: any, useSmartCacheInvalidation: any, usePushNotifications: any;

try {
  ({ usePredictivePrefetch } = require('../../utils/caching/predictivePrefetching'));
} catch (e) {
  usePredictivePrefetch = () => ({ setUser: () => {}, trackBehavior: () => {}, performHealthCheck: () => {} });
}

try {
  ({ useSmartCacheInvalidation } = require('../../utils/caching/smartCacheInvalidation'));
} catch (e) {
  useSmartCacheInvalidation = () => ({ performHealthCheck: () => {} });
}

try {
  ({ usePushNotifications } = require('../../utils/caching/pushNotificationManager'));
} catch (e) {
  usePushNotifications = () => ({ notifyContent: () => {} });
}

interface AdvancedFeatures {
  setPrefetchUser?: (user: any) => void;
  trackBehavior?: (action: string, data?: any) => void;
  performHealthCheck?: () => void;
  notifyContent?: (type: string, data: any) => void;
}

/**
 * Home Component
 * 
 * Main container component for the home page that orchestrates all child components.
 * Refactored from a monolithic 1400+ line component into a modular architecture
 * following the Single Responsibility Principle.
 * 
 * Features:
 * - Post creation and management
 * - Comments system
 * - Media upload and display
 * - User interactions (likes, shares)
 * - Notification management
 * - Performance optimizations
 * 
 * @returns {React.JSX.Element} The rendered Home component
 */
function Home(): React.JSX.Element {
  const { currentUser: firebaseUser, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  
  // Memoize isGuest value to prevent function calls on every render
  const isGuestUser = useMemo(() => isGuest(), [isGuest]);
  
  // Performance monitoring completely removed to stop infinite re-renders
  
  // Adapt Firebase User to our custom User type
  const currentUser = useMemo(() => adaptFirebaseUser(firebaseUser), [firebaseUser]);

  // Custom hooks for business logic
  const {
    posts,
    loading,
    hasMore,
    error: postsError,
    loadPosts,
    refreshPosts,
    updatePost,
    deletePost,
    likePost
  } = usePostOperations();

  const { addComment, deleteComment } = useCommentOperations();

  const {
    showPrompt: showNotificationPrompt,
    loading: notificationLoading,
    error: notificationError,
    enableNotifications,
    dismissPrompt
  } = useNotifications(currentUser, isGuestUser);

  // Refs for accessing current state without dependencies
  const currentUserRef = useRef(currentUser);
  const firebaseUserRef = useRef(firebaseUser);
  const postsRef = useRef(posts);
  
  // Update refs when values change
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  useEffect(() => {
    firebaseUserRef.current = firebaseUser;
  }, [firebaseUser]);
  
  // Removed posts ref update to prevent re-renders from posts changes

  // Analytics and optional advanced features
  const { trackPageView, trackInteraction, track: trackAnalytics } = useSimpleAnalytics();

  // Advanced features - hooks must be called at top level
  const prefetch = usePredictivePrefetch();
  const cacheInvalidation = useSmartCacheInvalidation();
  const pushNotifications = usePushNotifications();

  // Memoize individual functions to prevent re-initialization and maintain stable references
  const setPrefetchUser = useMemo(() => prefetch?.setUser, [prefetch?.setUser]);
  const trackBehavior = useMemo(() => prefetch?.trackBehavior, [prefetch?.trackBehavior]);
  const performHealthCheck = useMemo(() => cacheInvalidation?.performHealthCheck, [cacheInvalidation?.performHealthCheck]);
  const notifyContent = useMemo(() => pushNotifications?.notifyContent, [pushNotifications?.notifyContent]);


  const handleTitleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshPosts();
  }, [refreshPosts]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }, [logout, navigate]);

  // Initialize features and load posts - simplified to prevent infinite re-renders
  useEffect(() => {
    let cleanup: (() => void) | void = () => {};
    
    const initialize = async () => {
      // Simplified initialization without unstable callbacks
      if (firebaseUser) {
        try {
          await loadPosts();
          trackPageView?.('home');
        } catch (error) {
          console.error('Failed to initialize home features:', error);
        }
      }
    };
    
    initialize();
    
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [firebaseUser]); // Only depend on firebaseUser to prevent infinite loops


  const handleLike = useCallback(async (postId: string, currentLikes: string[], isSample: boolean, postData: Post) => {
    const currentUserValue = currentUserRef.current;
    const firebaseUserValue = firebaseUserRef.current;
    
    if (!currentUserValue || !firebaseUserValue) return;
    
    // Direct call without performance monitoring to prevent re-renders
    await handlePostLike(postId, currentLikes, isSample, postData, firebaseUserValue, trackBehavior, trackInteraction, 
      (postId: string, currentLikes: string[], fbUser: any, postData?: Post | null) => 
        likePost(postId, currentLikes, currentUserValue, postData)
    );
  }, [likePost, trackBehavior, trackInteraction]);


  const handleCommentSubmit = useCallback(async (postId: string, commentText: string) => {
    const firebaseUserValue = firebaseUserRef.current;
    const postsValue = postsRef.current;
    
    if (!firebaseUserValue || !commentText.trim()) return;
    
    if (isGuestUser) {
      navigate('/login');
      return;
    }
    
    try {
      const postData = postsValue.find(p => p.id === postId);
      await addComment(postId, commentText.trim(), firebaseUserValue, postData, isGuestUser);
      
      // Track analytics
      trackBehavior?.('comment_submitted', { postId });
      trackInteraction?.('comment', postId, { userId: firebaseUserValue.uid });
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  }, [isGuestUser, navigate, addComment, trackBehavior, trackInteraction]);
  
  const handleDeleteComment = useCallback(async (postId: string, commentIndex: number) => {
    const firebaseUserValue = firebaseUserRef.current;
    const postsValue = postsRef.current;
    
    if (!firebaseUserValue) return;
    
    await handleCommentDeletion(postId, commentIndex, firebaseUserValue, postsValue, deleteComment);
  }, [deleteComment]);

  const handleEnableNotifications = useCallback(async () => {
    const success = await enableNotifications();
    if (success) {
      alert('🔔 Notifications enabled! You\'ll now get notified when someone likes your posts.');
    }
  }, [enableNotifications]);

  const handleDismissNotificationPrompt = useCallback(() => {
    dismissPrompt();
  }, [dismissPrompt]);

  const handlePostCreated = useCallback(async () => {
    const firebaseUserValue = firebaseUserRef.current;
    await handlePostCreation(refreshPosts, trackBehavior, trackAnalytics, notifyContent, firebaseUserValue);
  }, [refreshPosts, trackBehavior, trackAnalytics, notifyContent]);



  const handleEditPost = useCallback(async (postId: string, newCaption: string) => {
    const currentUserValue = currentUserRef.current;
    const firebaseUserValue = firebaseUserRef.current;
    
    if (!currentUserValue || !firebaseUserValue) return;
    
    await updatePost(postId, { caption: newCaption, currentUser: currentUserValue });
  }, [updatePost]);

  const handleSharePost = useCallback(async (postId: string, postData: Post) => {
    const firebaseUserValue = firebaseUserRef.current;
    
    if (!firebaseUserValue) return;
    
    const result = await sharePost(postId, postData, trackInteraction, firebaseUserValue);
    return result.success;
  }, [trackInteraction]);

  const handleDeletePost = useCallback(async (postId: string, postData: Post) => {
    const firebaseUserValue = firebaseUserRef.current;
    
    if (!firebaseUserValue) return;
    
    await deletePost(postId);
  }, [deletePost]);

  // Note: Menu closing is now handled by PostsFeed component

  // Memoized callback for loading more posts to prevent recreation
  const handleLoadMore = useCallback(async () => {
    // Direct call without performance monitoring to prevent re-renders
    await loadPosts(true);
  }, [loadPosts]);
  
  // Memoized callback for navigating to post to prevent recreation
  const handleNavigateToPost = useCallback((postId: string) => navigate(`/post/${postId}`), [navigate]);

  // Simplified props for PostsFeed - only stable callbacks and data
  const postsFeedProps = useMemo(() => ({
    posts, 
    loading, 
    hasMore, 
    error: postsError, 
    currentUser: firebaseUser, 
    isGuest: isGuestUser,
    onLoadMore: handleLoadMore, 
    onRefresh: refreshPosts, 
    onLike: handleLike,
    onEditPost: handleEditPost, 
    onSharePost: handleSharePost, 
    onDeletePost: handleDeletePost,
    onCommentSubmit: handleCommentSubmit, 
    onDeleteComment: handleDeleteComment
  }), [posts, loading, hasMore, postsError, firebaseUser, isGuestUser, 
    handleLoadMore, refreshPosts, handleLike, handleEditPost, handleSharePost, 
    handleDeletePost, handleCommentSubmit, handleDeleteComment]);

  return (
    <ErrorBoundary name="Home">
      <div className="home">
        <NavigationBar
          currentUser={firebaseUser}
          isGuest={isGuestUser}
          onTitleClick={handleTitleClick}
          onLogout={handleLogout}
        />

        <div className="main-content home-content">
          <NotificationPrompt
            visible={showNotificationPrompt}
            onEnable={handleEnableNotifications}
            onDismiss={handleDismissNotificationPrompt}
            loading={notificationLoading}
            error={notificationError}
          />

          <StoriesContainer key={currentUser?.photoURL || 'no-photo'} />

          <PostComposer
            currentUser={firebaseUser}
            isGuest={isGuestUser}
            onPostCreated={handlePostCreated}
            disabled={false}
          />

          <PostsFeed {...postsFeedProps} />
        </div>

        <FooterNav />
        
        {/* Performance Debug Panel - Removed to prevent re-renders */}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Home);

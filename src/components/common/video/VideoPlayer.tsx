import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share } from 'lucide-react';
import { MomentVideo, VideoPlayerState } from '../../../types/models/moment';
import { MomentsService } from '../../../services/api/momentsService';
import VideoComments from './VideoComments';
import VideoShare from './VideoShare';
import { useTouchGestures } from '../../../hooks/useTouchGestures';
import { useVideoPerformance } from '../../../hooks/useVideoPerformance';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import VideoOptimizationUtils from '../../../utils/videoOptimization';
import LoadingSpinner from '../loading/LoadingSpinner';
import RetryHandler from '../error/RetryHandler';
import './VideoPlayer.css';

interface VideoPlayerProps {
  moment: MomentVideo;
  isActive: boolean;
  currentUserId?: string;
  onLike?: (momentId: string, liked: boolean, likesCount: number) => void;
  onComment?: (momentId: string) => void;
  onShare?: (momentId: string) => void;
  onVideoEnd?: () => void;
  onVideoError?: (error: string) => void;
  // Auto-play management props
  onVideoRegister?: (video: HTMLVideoElement, id: string) => void;
  onVideoUnregister?: (id: string) => void;
  autoPlayEnabled?: boolean;
  // Navigation props for swipe gestures
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  // Performance optimization props
  enablePerformanceOptimizations?: boolean;
  preloadDistance?: number;
}

/**
 * VideoPlayer Component
 * 
 * Handles video playback with controls, engagement features, and metadata display.
 * Supports auto-play when active, touch controls, and accessibility features.
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  moment,
  isActive,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onVideoEnd,
  onVideoError,
  onVideoRegister,
  onVideoUnregister,
  autoPlayEnabled = true,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  enablePerformanceOptimizations = true,
  preloadDistance = 2
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: true, // Start muted for better UX
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
    isLoading: true,
    hasError: false,
    quality: 'auto',
    volume: 1,
    playbackRate: 1
  });

  const [showControls, setShowControls] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<string>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const [videoStatus, setVideoStatus] = useState<string>('');
  
  // Network status monitoring
  const { networkStatus, isGoodConnection, recommendedVideoQuality } = useNetworkStatus();

  // Initialize performance optimizations
  const {
    registerVideo: registerPerformanceVideo,
    unregisterVideo: unregisterPerformanceVideo,
    getOptimalQuality,
    getCurrentNetworkType,
    setVideoVisible,
    preloadVideo,
    optimizeQuality
  } = useVideoPerformance({
    enableLazyLoading: enablePerformanceOptimizations,
    enablePreloading: enablePerformanceOptimizations,
    enableAdaptiveQuality: enablePerformanceOptimizations,
    preloadDistance,
    memoryThreshold: VideoOptimizationUtils.isLowEndDevice() ? 50 : 100,
    qualityPreferences: {
      wifi: 'high',
      cellular: 'medium',
      slow: 'low'
    }
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Monitor network changes for quality optimization
  useEffect(() => {
    if (!enablePerformanceOptimizations) return;

    const cleanup = VideoOptimizationUtils.monitorNetworkChanges((networkInfo) => {
      setNetworkQuality(networkInfo.effectiveType);
      
      // Re-optimize video quality when network changes
      if (videoRef.current) {
        optimizeQuality(moment.id).catch(console.warn);
      }
    });

    // Set initial network quality
    setNetworkQuality(getCurrentNetworkType());

    return cleanup;
  }, [enablePerformanceOptimizations, moment.id, optimizeQuality, getCurrentNetworkType]);

  // Touch gesture handlers
  const handleDoubleTap = useCallback(() => {
    handleLike();
  }, []);

  const handleSingleTap = useCallback(() => {
    togglePlayPause();
    showControlsTemporarily();
  }, []);

  const handleLongPress = useCallback(() => {
    // Show video info or additional options on long press
    showControlsTemporarily();
  }, []);

  // Initialize touch gestures
  const { attachGestures } = useTouchGestures({
    onTap: handleSingleTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance: 50,
    maxTapDistance: 15,
    doubleTapDelay: 300,
    longPressDelay: 500,
    preventScroll: true // Prevent scroll during video interaction
  });

  // Attach touch gestures to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    const cleanup = attachGestures(container);
    return cleanup;
  }, [attachGestures, isMobile]);

  // Register/unregister video with auto-play system and performance optimizations
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Register video with auto-play system
    if (autoPlayEnabled) {
      onVideoRegister?.(video, moment.id);
    }

    // Register video with performance optimization system
    if (enablePerformanceOptimizations) {
      registerPerformanceVideo(video, moment.id, moment.metadata?.qualityVersions);
    }

    // Cleanup on unmount
    return () => {
      if (autoPlayEnabled) {
        onVideoUnregister?.(moment.id);
      }
      if (enablePerformanceOptimizations) {
        unregisterPerformanceVideo(moment.id);
      }
    };
  }, [
    moment.id, 
    autoPlayEnabled, 
    enablePerformanceOptimizations,
    onVideoRegister, 
    onVideoUnregister,
    registerPerformanceVideo,
    unregisterPerformanceVideo,
    moment.metadata?.qualityVersions
  ]);

  // Handle video visibility for performance optimizations
  useEffect(() => {
    if (enablePerformanceOptimizations) {
      setVideoVisible(moment.id, isActive);
    }
  }, [isActive, moment.id, enablePerformanceOptimizations, setVideoVisible]);

  // Handle video play/pause based on isActive prop (fallback for non-auto-play mode)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || autoPlayEnabled) return; // Skip if auto-play is handling this

    if (isActive && !playerState.hasError) {
      // Preload video if performance optimizations are enabled
      if (enablePerformanceOptimizations) {
        preloadVideo(moment.id).catch(console.warn);
      }
      
      video.play().catch((error) => {
        console.error('Auto-play failed:', error);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      });
    } else {
      video.pause();
    }
  }, [isActive, playerState.hasError, autoPlayEnabled, enablePerformanceOptimizations, moment.id, preloadVideo]);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlayerState(prev => ({
      ...prev,
      duration: video.duration,
      isLoading: false,
      hasError: false
    }));
  }, []);

  // Handle video time update
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlayerState(prev => ({
      ...prev,
      currentTime: video.currentTime
    }));
  }, []);

  // Handle video play event
  const handlePlay = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: true }));
    setVideoStatus('Playing');
    setAnnouncement(`Video by ${moment.userDisplayName} is now playing`);
  }, [moment.userDisplayName]);

  // Handle video pause event
  const handlePause = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    setVideoStatus('Paused');
    setAnnouncement(`Video by ${moment.userDisplayName} is paused`);
  }, [moment.userDisplayName]);

  // Handle video ended
  const handleEnded = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    setVideoStatus('Ended');
    setAnnouncement(`Video by ${moment.userDisplayName} has ended`);
    onVideoEnd?.();
  }, [onVideoEnd, moment.userDisplayName]);

  // Handle video error
  const handleError = useCallback(() => {
    const video = videoRef.current;
    let errorMessage = 'Video failed to load';
    
    if (video?.error) {
      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video format not supported';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video source not supported';
          break;
        default:
          errorMessage = video.error.message || 'Unknown video error';
      }
    }
    
    setPlayerState(prev => ({
      ...prev,
      hasError: true,
      isLoading: false,
      isPlaying: false
    }));
    
    setLastError(errorMessage);
    onVideoError?.(errorMessage);
  }, [onVideoError]);

  // Show controls temporarily
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || playerState.hasError) return;

    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Play failed:', error);
      });
    }
  }, [playerState.isPlaying, playerState.hasError]);

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !playerState.isMuted;
    video.muted = newMuted;
    setPlayerState(prev => ({ ...prev, isMuted: newMuted }));
    setAnnouncement(`Video ${newMuted ? 'muted' : 'unmuted'}`);
  }, [playerState.isMuted]);

  // Handle like button click
  const handleLike = useCallback(async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    try {
      const result = await MomentsService.toggleLike(
        moment.id,
        currentUserId,
        'Current User', // In real app, get from user context
        null // In real app, get from user context
      );
      
      onLike?.(moment.id, result.liked, result.likesCount);
      setAnnouncement(`Video ${result.liked ? 'liked' : 'unliked'}. ${result.likesCount} total likes`);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setAnnouncement('Failed to update like status');
    } finally {
      setIsLiking(false);
    }
  }, [currentUserId, isLiking, moment.id, onLike]);

  // Handle comment button click
  const handleCommentClick = useCallback(() => {
    setShowComments(true);
    setAnnouncement('Comments dialog opened');
    onComment?.(moment.id);
  }, [moment.id, onComment]);

  // Handle share button click
  const handleShareClick = useCallback(() => {
    setShowShare(true);
    setAnnouncement('Share dialog opened');
    onShare?.(moment.id);
  }, [moment.id, onShare]);

  // Handle share action
  const handleShareAction = useCallback((platform: string) => {
    console.log(`Shared on ${platform}:`, moment.id);
    // Track share interaction
    if (currentUserId) {
      MomentsService.trackInteraction({
        momentId: moment.id,
        userId: currentUserId,
        type: 'share',
        timestamp: new Date(),
        metadata: {
          platform
        }
      }).catch(console.error);
    }
  }, [moment.id, currentUserId]);

  // Handle video click (play/pause and show controls) - for non-touch devices
  const handleVideoClick = useCallback(() => {
    if (isMobile) return; // Let touch gestures handle mobile interactions
    togglePlayPause();
    showControlsTemporarily();
  }, [togglePlayPause, showControlsTemporarily, isMobile]);

  // Handle retry on error
  const handleRetry = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setRetryCount(prev => prev + 1);
    setLastError(null);
    
    setPlayerState(prev => ({
      ...prev,
      hasError: false,
      isLoading: true
    }));

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Try to reload the video
      video.load();
      
      // If network is poor, try to get a lower quality version
      if (!isGoodConnection && enablePerformanceOptimizations) {
        try {
          await optimizeQuality(moment.id);
        } catch (optimizeError) {
          console.warn('Failed to optimize video quality:', optimizeError);
        }
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setPlayerState(prev => ({
        ...prev,
        hasError: true,
        isLoading: false
      }));
      setLastError('Retry failed. Please check your connection.');
    }
  }, [moment.id, isGoodConnection, enablePerformanceOptimizations, optimizeQuality]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const video = videoRef.current;
    if (!video || playerState.hasError) return;

    // Only handle keyboard events when this video is active
    if (!isActive) return;

    switch (e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlayPause();
        showControlsTemporarily();
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        showControlsTemporarily();
        break;
      case 'l':
        e.preventDefault();
        if (currentUserId) {
          handleLike();
        }
        break;
      case 'c':
        e.preventDefault();
        if (currentUserId) {
          handleCommentClick();
        }
        break;
      case 's':
        e.preventDefault();
        handleShareClick();
        break;
      case 'arrowleft':
        e.preventDefault();
        // Seek backward 10 seconds
        video.currentTime = Math.max(0, video.currentTime - 10);
        showControlsTemporarily();
        break;
      case 'arrowright':
        e.preventDefault();
        // Seek forward 10 seconds
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showControlsTemporarily();
        break;
      case 'arrowup':
        e.preventDefault();
        // Navigate to previous video
        onSwipeDown?.();
        break;
      case 'arrowdown':
        e.preventDefault();
        // Navigate to next video
        onSwipeUp?.();
        break;
      case 'home':
        e.preventDefault();
        // Go to beginning of video
        video.currentTime = 0;
        showControlsTemporarily();
        break;
      case 'end':
        e.preventDefault();
        // Go to end of video
        video.currentTime = video.duration;
        showControlsTemporarily();
        break;
      case 'escape':
        e.preventDefault();
        // Close any open modals
        setShowComments(false);
        setShowShare(false);
        break;
      default:
        break;
    }
  }, [
    isActive,
    playerState.hasError,
    togglePlayPause,
    toggleMute,
    handleLike,
    handleCommentClick,
    handleShareClick,
    showControlsTemporarily,
    currentUserId,
    onSwipeUp,
    onSwipeDown
  ]);

  // Add keyboard event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add keyboard event listener to container
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`video-player-container ${isMobile ? 'mobile' : 'desktop'}`}
      tabIndex={isActive ? 0 : -1}
      role="region"
      aria-label={`Video player for ${moment.userDisplayName}'s moment`}
      aria-describedby={`video-metadata-${moment.id}`}
      onFocus={() => showControlsTemporarily()}
    >
      <div 
        className="video-wrapper"
        onClick={handleVideoClick}
        onMouseMove={!isMobile ? showControlsTemporarily : undefined}
      >
        <video
          ref={videoRef}
          className="video-player"
          src={moment.videoUrl}
          poster={moment.thumbnailUrl}
          muted={playerState.isMuted}
          playsInline
          preload={enablePerformanceOptimizations ? "none" : "metadata"}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          aria-label={`Video by ${moment.userDisplayName}: ${moment.caption || 'No description'}`}
          aria-describedby={`video-metadata-${moment.id}`}
          role="application"
          tabIndex={0}
        />

        {/* Loading State */}
        {playerState.isLoading && !playerState.hasError && (
          <div className="video-loading">
            <LoadingSpinner 
              size="large" 
              message="Loading video..." 
              overlay={false}
            />
          </div>
        )}

        {/* Error State with Retry Handler */}
        {playerState.hasError && (
          <div className="video-error">
            <RetryHandler
              onRetry={handleRetry}
              error={lastError}
              maxRetries={3}
              retryDelay={1000}
              showNetworkStatus={true}
              className="video-retry-handler"
            />
          </div>
        )}

        {/* Video Controls Overlay */}
        {(showControls || !playerState.isPlaying) && !playerState.hasError && (
          <div className="video-controls-overlay">
            <button
              className="play-pause-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              aria-label={playerState.isPlaying ? 'Pause video' : 'Play video'}
              aria-pressed={playerState.isPlaying}
              title={playerState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              tabIndex={0}
            >
              {playerState.isPlaying ? <Pause size={48} /> : <Play size={48} />}
            </button>
          </div>
        )}

        {/* Mute/Unmute Button */}
        <button
          className="mute-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          aria-label={playerState.isMuted ? 'Unmute video' : 'Mute video'}
          aria-pressed={!playerState.isMuted}
          title={playerState.isMuted ? 'Unmute (M)' : 'Mute (M)'}
          tabIndex={0}
        >
          {playerState.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Quality Indicator */}
        {enablePerformanceOptimizations && networkQuality !== 'unknown' && (
          <div className="quality-indicator">
            <span className={`quality-badge quality-${networkQuality}`}>
              {networkQuality.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Video Metadata */}
      <div className="video-metadata" id={`video-metadata-${moment.id}`} role="region" aria-label="Video information">
        <div className="creator-info">
          {moment.userPhotoURL && (
            <img
              src={moment.userPhotoURL}
              alt={`${moment.userDisplayName}'s profile picture`}
              className="creator-avatar"
              role="img"
            />
          )}
          <span className="creator-name" role="text" aria-label={`Created by ${moment.userDisplayName}`}>
            {moment.userDisplayName}
          </span>
        </div>
        
        {moment.caption && (
          <p className="video-description" role="text" aria-label={`Video description: ${moment.caption}`}>
            {moment.caption}
          </p>
        )}

        <div className="video-stats" role="group" aria-label="Video statistics">
          <span className="video-duration" role="text" aria-label={`Video progress: ${formatTime(playerState.currentTime)} of ${formatTime(playerState.duration)}`}>
            {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
          </span>
          <span className="video-views" role="text" aria-label={`${moment.engagement.views.toLocaleString()} views`}>
            {moment.engagement.views.toLocaleString()} views
          </span>
        </div>
      </div>

      {/* Engagement Actions */}
      <div className="engagement-actions">
        <button
          className={`engagement-btn ${moment.isLiked ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          disabled={isLiking || !currentUserId}
          aria-label={`${moment.isLiked ? 'Unlike' : 'Like'} video by ${moment.userDisplayName}. ${moment.engagement.likesCount} likes`}
          aria-pressed={moment.isLiked}
          title={`${moment.isLiked ? 'Unlike' : 'Like'} (L)`}
          tabIndex={0}
        >
          <Heart size={24} fill={moment.isLiked ? 'currentColor' : 'none'} />
          <span className="engagement-count" aria-hidden="true">
            {moment.engagement.likesCount > 0 ? moment.engagement.likesCount.toLocaleString() : ''}
          </span>
        </button>

        <button
          className="engagement-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCommentClick();
          }}
          aria-label={`View comments for video by ${moment.userDisplayName}. ${moment.engagement.commentsCount} comments`}
          title="View comments (C)"
          tabIndex={0}
        >
          <MessageCircle size={24} />
          <span className="engagement-count" aria-hidden="true">
            {moment.engagement.commentsCount > 0 ? moment.engagement.commentsCount.toLocaleString() : ''}
          </span>
        </button>

        <button
          className="engagement-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleShareClick();
          }}
          aria-label={`Share video by ${moment.userDisplayName}. ${moment.engagement.sharesCount} shares`}
          title="Share video (S)"
          tabIndex={0}
        >
          <Share size={24} />
          <span className="engagement-count" aria-hidden="true">
            {moment.engagement.sharesCount > 0 ? moment.engagement.sharesCount.toLocaleString() : ''}
          </span>
        </button>
      </div>

      {/* Comments Modal */}
      <VideoComments
        momentId={moment.id}
        currentUserId={currentUserId}
        currentUserName="Current User" // In real app, get from user context
        currentUserPhotoURL={null} // In real app, get from user context
        isVisible={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Share Modal */}
      <VideoShare
        momentId={moment.id}
        videoUrl={moment.videoUrl}
        caption={moment.caption}
        creatorName={moment.userDisplayName}
        isVisible={showShare}
        onClose={() => setShowShare(false)}
        onShare={handleShareAction}
      />

      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>
      
      <div 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
        role="alert"
      >
        {lastError}
      </div>

      {/* Video Status for Screen Readers */}
      <div 
        aria-live="polite" 
        aria-atomic="false" 
        className="sr-only"
        role="status"
      >
        {videoStatus && `Video status: ${videoStatus}`}
      </div>
    </div>
  );
};

export default VideoPlayer;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Upload, X } from 'lucide-react';
import NavigationBar from '../../components/layout/NavigationBar';
import FooterNav from '../../components/layout/FooterNav';
import VideoPlayer from '../../components/common/video/VideoPlayer';
import VideoErrorBoundary from '../../components/common/error/VideoErrorBoundary';
import VideoSkeleton from '../../components/common/loading/VideoSkeleton';

import RetryHandler from '../../components/common/error/RetryHandler';
import { MomentVideo } from '../../types/models/moment';
import { MomentsService } from '../../services/api/momentsService';
import { useVideoAutoPlay } from '../../hooks/useVideoAutoPlay';
import { useVideoPerformance } from '../../hooks/useVideoPerformance';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import VideoOptimizationUtils from '../../utils/videoOptimization';
import { diversifyFeed, DEFAULT_DIVERSITY_CONFIG } from '../../utils/feedDiversity';
import './MomentsPage.css';

/**
 * MomentsPage Component
 * 
 * Displays video content in a vertical feed format similar to Instagram Reels.
 * Features auto-play functionality and video engagement features.
 */
const MomentsPage: React.FC = () => {
  const { currentUser, isGuest } = useAuth();
  const [moments, setMoments] = useState<MomentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Network status monitoring
  const { networkStatus, isGoodConnection } = useNetworkStatus();
  const videoFeedRef = useRef<HTMLDivElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [performanceSettings, setPerformanceSettings] = useState(
    VideoOptimizationUtils.getRecommendedSettings()
  );

  // Initialize auto-play functionality
  const {
    registerVideo,
    unregisterVideo,
    isVideoInView,
    getActiveVideoId,
    pauseAllVideos,
    resumeActiveVideo
  } = useVideoAutoPlay({
    threshold: 0.6, // Video needs to be 60% visible
    rootMargin: '-10% 0px -10% 0px', // Slight margin for better UX
    root: null, // Use viewport as root for better compatibility
    playDelay: 150, // Small delay to prevent rapid play/pause
    pauseDelay: 300, // Longer delay for pause to prevent flickering
    enableMemoryManagement: true,
    maxConcurrentVideos: performanceSettings.enablePreloading ? 2 : 1 // Adjust based on device capabilities
  });

  // Initialize performance optimizations
  const {
    getMemoryUsage,
    cleanupMemory
  } = useVideoPerformance({
    enableLazyLoading: performanceSettings.enableLazyLoading,
    enablePreloading: performanceSettings.enablePreloading,
    enableAdaptiveQuality: true,
    preloadDistance: performanceSettings.preloadDistance,
    memoryThreshold: 200 // More reasonable threshold: 200MB instead of device-based
  });

  // Update performance settings based on network changes
  useEffect(() => {
    const cleanup = VideoOptimizationUtils.monitorNetworkChanges(() => {
      const newSettings = VideoOptimizationUtils.getRecommendedSettings();
      setPerformanceSettings(newSettings);
    });

    return cleanup;
  }, []);

  // Monitor memory usage and cleanup when needed
  useEffect(() => {
    const interval = setInterval(() => {
      const memoryUsage = getMemoryUsage();
      if (memoryUsage > 200) { // 200MB threshold
        cleanupMemory().catch(console.warn);
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [getMemoryUsage, cleanupMemory]);

  // Fetch moments data
  const fetchMoments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Adjust fetch limit based on device capabilities and network
      let fetchLimit = VideoOptimizationUtils.isLowEndDevice() ? 5 : 10;
      if (!isGoodConnection) {
        fetchLimit = Math.min(fetchLimit, 3); // Reduce for poor connections
      }
      
      // Use combined feed to show both moments and verified talent videos
      const result = await MomentsService.getCombinedFeed({
        limit: fetchLimit,
        currentUserId: currentUser?.uid,
        includeEngagementMetrics: true,
        // For development: show all moments (pending and approved)
        // In production, only approved moments should be shown
        moderationStatus: process.env.NODE_ENV === 'development' ? undefined : 'approved'
      });
      
      // Apply feed diversity if enabled
      const enableFeedDiversity = process.env.REACT_APP_ENABLE_FEED_DIVERSITY !== 'false';
      let processedMoments = result.moments;

      // Debug: Log videos before diversity filter
      console.log('📊 BEFORE diversity filter:', {
        totalVideos: processedMoments.length,
        userDistribution: processedMoments.reduce((acc, m) => {
          acc[m.userDisplayName] = (acc[m.userDisplayName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        videoTypes: processedMoments.reduce((acc, m) => {
          const type = m.isTalentVideo ? 'talent' : m.isPostVideo ? 'post' : 'moment';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      // Only apply diversity filter if we have enough videos (10+)
      // With small feeds, the diversity algorithm is too restrictive
      if (enableFeedDiversity && processedMoments.length >= 10) {
        // Get custom config from environment or use defaults
        const maxConsecutive = parseInt(process.env.REACT_APP_FEED_MAX_CONSECUTIVE || '2', 10);
        const maxPercentage = parseFloat(process.env.REACT_APP_FEED_MAX_PERCENTAGE || '0.3');

        console.log('🎯 Applying diversity filter with:', { maxConsecutive, maxPercentage, videoCount: processedMoments.length });

        processedMoments = diversifyFeed(processedMoments, {
          maxConsecutiveFromSameUser: maxConsecutive,
          maxPercentageFromSingleUser: maxPercentage
        });

        // Debug: Log videos after diversity filter
        console.log('📊 AFTER diversity filter:', {
          totalVideos: processedMoments.length,
          userDistribution: processedMoments.reduce((acc, m) => {
            acc[m.userDisplayName] = (acc[m.userDisplayName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          videosFiltered: result.moments.length - processedMoments.length
        });
      } else if (processedMoments.length > 0) {
        console.log('⏭️ Skipped diversity filter (feed too small, need 10+ videos)');
      }

      setMoments(processedMoments);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Failed to fetch moments:', err);
      let errorMessage = 'Failed to load videos. Please try again.';
      
      if (!networkStatus.isOnline) {
        errorMessage = 'No internet connection. Please check your network and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, isGoodConnection, networkStatus.isOnline]);

  // Fetch moments on component mount and when network status changes
  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  // Auto-retry when network comes back online
  useEffect(() => {
    if (error && networkStatus.isOnline && isGoodConnection && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchMoments();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, networkStatus.isOnline, isGoodConnection, retryCount, fetchMoments]);

  const handleTitleClick = () => {
    // Scroll to top and refresh functionality
    const videoFeedElement = videoFeedRef.current;
    if (videoFeedElement) {
      videoFeedElement.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentVideoIndex(0);
    }
  };

  // Handle swipe navigation
  const handleSwipeUp = useCallback(() => {
    // Navigate to next video
    if (currentVideoIndex < moments.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      
      const videoFeedElement = videoFeedRef.current;
      if (videoFeedElement) {
        const nextVideoElement = videoFeedElement.children[nextIndex] as HTMLElement;
        if (nextVideoElement) {
          nextVideoElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }
    }
  }, [currentVideoIndex, moments.length]);

  const handleSwipeDown = useCallback(() => {
    // Navigate to previous video
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      
      const videoFeedElement = videoFeedRef.current;
      if (videoFeedElement) {
        const prevVideoElement = videoFeedElement.children[prevIndex] as HTMLElement;
        if (prevVideoElement) {
          prevVideoElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }
    }
  }, [currentVideoIndex]);

  const handleSwipeLeft = useCallback(() => {
    // Could be used for additional features like showing video info
  }, []);

  const handleSwipeRight = useCallback(() => {
    // Could be used for additional features like quick actions
  }, []);

  // Handle like action
  const handleLike = (momentId: string, liked: boolean, likesCount: number) => {
    setMoments(prevMoments =>
      prevMoments.map(moment =>
        moment.id === momentId
          ? { ...moment, isLiked: liked, engagement: { ...moment.engagement, likesCount } }
          : moment
      )
    );
  };

  // Handle comment action
  const handleComment = (momentId: string) => {
    // The VideoPlayer component now handles the comment modal display
  };

  // Handle share action
  const handleShare = (momentId: string) => {
    // The VideoPlayer component now handles the share modal display
  };

  // Handle video end
  const handleVideoEnd = () => {
    // Video ended - the auto-play system will handle moving to the next video
    const activeVideoId = getActiveVideoId();
  };

  // Handle video error
  const handleVideoError = (error: string) => {
    console.error('Video error:', error);
  };

  // Handle create moment button click
  const handleCreateMomentClick = () => {
    if (isGuest()) {
      alert('Please sign in to create moments');
      return;
    }
    setShowCreateModal(true);
  };

  // Handle video file selection
  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Video file size must be less than 100MB');
      return;
    }

    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        setUploadError('Video must be 30 seconds or less');
        setSelectedVideo(null);
      } else {
        setUploadError(null);
        setSelectedVideo(file);
      }
    };
    video.src = URL.createObjectURL(file);
  };

  // Handle moment upload
  const handleUploadMoment = async () => {
    if (!selectedVideo || !currentUser) return;

    try {
      setUploading(true);
      setUploadError(null);

      // Create moment
      const momentId = await MomentsService.createMoment({
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'User',
        userPhotoURL: currentUser.photoURL || null,
        caption,
        videoFile: selectedVideo,
        duration: 0 // Will be updated after video processing
      });

      // Upload video
      const uploadResult = await MomentsService.uploadVideo(selectedVideo, momentId);

      // Update moment with video URL
      await MomentsService.updateMoment(momentId, {
        videoUrl: uploadResult.videoUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        metadata: uploadResult.metadata
      });

      // Close modal and refresh feed
      setShowCreateModal(false);
      setSelectedVideo(null);
      setCaption('');
      fetchMoments();

      alert('Moment created successfully!');
    } catch (err) {
      console.error('Error uploading moment:', err);
      setUploadError('Failed to upload moment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    if (uploading) return;
    setShowCreateModal(false);
    setSelectedVideo(null);
    setCaption('');
    setUploadError(null);
  };

  // Handle page visibility changes to pause/resume videos
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause all videos
        pauseAllVideos();
      } else {
        // Page is visible, resume active video
        setTimeout(() => {
          resumeActiveVideo();
        }, 100); // Small delay to ensure page is fully visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseAllVideos, resumeActiveVideo]);

  // Handle window focus/blur for additional video management
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        resumeActiveVideo();
      }, 100);
    };

    const handleBlur = () => {
      pauseAllVideos();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [pauseAllVideos, resumeActiveVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Pause all videos and cleanup when component unmounts
      pauseAllVideos();
    };
  }, [pauseAllVideos]);

  return (
    <div className="moments-page">
      <NavigationBar
        currentUser={currentUser}
        isGuest={isGuest()}
        onTitleClick={handleTitleClick}
        title="Moments"
      />

      {/* Create Moment Floating Button */}
      {!isGuest() && (
        <button
          className="create-moment-btn"
          onClick={handleCreateMomentClick}
          aria-label="Create moment"
          title="Create a new moment"
        >
          <Plus size={24} />
        </button>
      )}

      <div className="moments-content">
        <div className="moments-container">
          {loading && (
            <div className="moments-loading">
              <VideoSkeleton 
                count={3} 
                showMetadata={true} 
                showEngagement={true}
                className="moments-skeleton"
              />
            </div>
          )}

          {error && !loading && (
            <div className="moments-error">
              <RetryHandler
                onRetry={fetchMoments}
                error={error}
                maxRetries={3}
                retryDelay={2000}
                showNetworkStatus={true}
                className="moments-retry-handler"
              />
            </div>
          )}

          {!loading && !error && moments.length === 0 && (
            <div className="moments-empty">
              <div className="empty-content">
                <h2>No Moments to Discover</h2>
                <p>The community hasn't shared any moments yet. Be the first to create and share content!</p>
              </div>
            </div>
          )}

          {!loading && !error && moments.length > 0 && (
            <VideoErrorBoundary
              onError={(error, errorInfo) => {
                console.error('Video component error:', error, errorInfo);
                // Could send to error tracking service here
              }}
            >
              <div 
                ref={videoFeedRef}
                className="video-feed-container"
                role="main"
                aria-label="Video moments feed"
                tabIndex={-1}
              >
                {moments.map((moment, index) => (
                  <div 
                    key={moment.id} 
                    className="video-item"
                    data-video-index={index}
                    data-video-id={moment.id}
                    role="article"
                    aria-label={`Video ${index + 1} of ${moments.length} by ${moment.userDisplayName}`}
                  >
                    <VideoErrorBoundary
                      fallback={
                        <div className="video-error-fallback">
                          <p>This video couldn't be loaded</p>
                          <button onClick={() => window.location.reload()}>
                            Refresh Page
                          </button>
                        </div>
                      }
                    >
                      <VideoPlayer
                        moment={moment}
                        isActive={isVideoInView(moment.id)}
                        currentUserId={currentUser?.uid}
                        currentUserName={currentUser?.displayName || undefined}
                        currentUserPhotoURL={currentUser?.photoURL || null}
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={handleShare}
                        onVideoEnd={handleVideoEnd}
                        onVideoError={handleVideoError}
                        onVideoRegister={registerVideo}
                        onVideoUnregister={unregisterVideo}
                        autoPlayEnabled={true}
                        onSwipeUp={handleSwipeUp}
                        onSwipeDown={handleSwipeDown}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                        enablePerformanceOptimizations={true}
                        preloadDistance={performanceSettings.preloadDistance}
                      />
                    </VideoErrorBoundary>
                  </div>
                ))}
              </div>
            </VideoErrorBoundary>
          )}
        </div>
      </div>

      {/* Create Moment Modal */}
      {showCreateModal && (
        <div className="create-moment-modal-overlay" onClick={handleCloseModal}>
          <div className="create-moment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Moment</h2>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                disabled={uploading}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {uploadError && (
                <div className="upload-error">
                  {uploadError}
                </div>
              )}

              {!selectedVideo ? (
                <div className="video-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="upload-trigger-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload size={48} />
                    <h3>Upload Video</h3>
                    <p>Select a video up to 30 seconds</p>
                    <span className="file-requirements">
                      Max size: 100MB | Formats: MP4, MOV, AVI
                    </span>
                  </button>
                </div>
              ) : (
                <div className="video-preview-section">
                  <div className="video-preview">
                    <video
                      src={URL.createObjectURL(selectedVideo)}
                      controls
                      className="preview-video"
                    />
                  </div>
                  <div className="video-info">
                    <p className="selected-file-name">{selectedVideo.name}</p>
                    <p className="selected-file-size">
                      {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    className="change-video-btn"
                    onClick={() => {
                      setSelectedVideo(null);
                      setUploadError(null);
                    }}
                    disabled={uploading}
                  >
                    Change Video
                  </button>
                </div>
              )}

              {selectedVideo && (
                <div className="caption-section">
                  <label htmlFor="moment-caption">Caption (optional)</label>
                  <textarea
                    id="moment-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption for your moment..."
                    maxLength={150}
                    rows={3}
                    disabled={uploading}
                  />
                  <span className="character-count">
                    {caption.length}/150
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn-upload"
                onClick={handleUploadMoment}
                disabled={!selectedVideo || uploading}
              >
                {uploading ? 'Uploading...' : 'Post Moment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterNav />
    </div>
  );
};

export default MomentsPage;
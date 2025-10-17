import { useEffect, useRef, useCallback, useState } from 'react';
import { VideoQuality, VideoQualityVersion } from '../types/models/moment';

/**
 * Network connection types for quality selection
 */
export type NetworkType = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';

/**
 * Video performance optimization options
 */
export interface UseVideoPerformanceOptions {
  enableLazyLoading?: boolean;
  enablePreloading?: boolean;
  enableAdaptiveQuality?: boolean;
  preloadDistance?: number; // Number of videos to preload ahead
  memoryThreshold?: number; // MB threshold for memory management
  qualityPreferences?: {
    wifi: VideoQuality;
    cellular: VideoQuality;
    slow: VideoQuality;
  };
}

/**
 * Video element with performance metadata
 */
interface VideoPerformanceData {
  element: HTMLVideoElement;
  id: string;
  isPreloaded: boolean;
  isVisible: boolean;
  quality: VideoQuality;
  lastAccessTime: number;
  memoryUsage: number; // Estimated memory usage in MB
  networkType: NetworkType;
  loadStartTime?: number;
  loadEndTime?: number;
}

/**
 * Network information interface
 */
interface NetworkInformation extends EventTarget {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Return type for video performance hook
 */
export interface UseVideoPerformanceReturn {
  registerVideo: (video: HTMLVideoElement, id: string, qualityVersions?: VideoQualityVersion[]) => void;
  unregisterVideo: (id: string) => void;
  preloadVideo: (id: string) => Promise<void>;
  optimizeQuality: (id: string) => Promise<void>;
  getOptimalQuality: () => VideoQuality;
  getCurrentNetworkType: () => NetworkType;
  getMemoryUsage: () => number;
  cleanupMemory: () => Promise<void>;
  setVideoVisible: (id: string, visible: boolean) => void;
}

/**
 * Custom hook for video performance optimizations
 */
export const useVideoPerformance = (
  options: UseVideoPerformanceOptions = {}
): UseVideoPerformanceReturn => {
  const {
    enableLazyLoading = true,
    enablePreloading = true,
    enableAdaptiveQuality = true,
    preloadDistance = 2,
    memoryThreshold = 100, // 100MB
    qualityPreferences = {
      wifi: 'high',
      cellular: 'medium',
      slow: 'low'
    }
  } = options;

  const videosRef = useRef<Map<string, VideoPerformanceData>>(new Map());
  const preloadQueueRef = useRef<Set<string>>(new Set());
  const [networkType, setNetworkType] = useState<NetworkType>('unknown');
  const [memoryUsage, setMemoryUsage] = useState(0);

  // Detect network connection type
  const detectNetworkType = useCallback((): NetworkType => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection as NetworkInformation;
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
          return 'slow-2g';
        case '2g':
          return '2g';
        case '3g':
          return '3g';
        case '4g':
          return '4g';
        default:
          // Check if we're on WiFi (rough estimation)
          if (connection.downlink > 10) {
            return 'wifi';
          }
          return '4g';
      }
    }
    
    // Fallback: estimate based on connection speed test
    return 'unknown';
  }, []);

  // Update network type
  useEffect(() => {
    const updateNetworkType = () => {
      const type = detectNetworkType();
      setNetworkType(type);
    };

    updateNetworkType();

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection as NetworkInformation;
      connection.addEventListener('change', updateNetworkType);
      
      return () => {
        connection.removeEventListener('change', updateNetworkType);
      };
    }
  }, [detectNetworkType]);

  // Get optimal video quality based on network conditions
  const getOptimalQuality = useCallback((): VideoQuality => {
    if (!enableAdaptiveQuality) return 'auto';

    switch (networkType) {
      case 'wifi':
        return qualityPreferences.wifi;
      case '4g':
        return qualityPreferences.cellular;
      case '3g':
      case '2g':
      case 'slow-2g':
        return qualityPreferences.slow;
      default:
        return 'medium'; // Safe default
    }
  }, [networkType, enableAdaptiveQuality, qualityPreferences]);

  // Estimate video memory usage
  const estimateVideoMemoryUsage = useCallback((video: HTMLVideoElement): number => {
    if (!video.videoWidth || !video.videoHeight) return 0;
    
    // Rough estimation: width * height * 4 bytes per pixel * duration in seconds / 1MB
    const pixelCount = video.videoWidth * video.videoHeight;
    const bytesPerFrame = pixelCount * 4; // RGBA
    const estimatedFrames = video.duration * 30; // Assume 30fps
    const totalBytes = bytesPerFrame * estimatedFrames;
    
    return totalBytes / (1024 * 1024); // Convert to MB
  }, []);

  // Update total memory usage
  const updateMemoryUsage = useCallback(() => {
    let total = 0;
    videosRef.current.forEach(data => {
      total += data.memoryUsage;
    });
    setMemoryUsage(total);
  }, []);

  // Lazy load video thumbnail
  const lazyLoadThumbnail = useCallback(async (video: HTMLVideoElement): Promise<void> => {
    if (!enableLazyLoading || video.poster) return;

    try {
      // Create a canvas to generate thumbnail from video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Wait for video metadata to load
      if (video.readyState < 1) {
        await new Promise<void>((resolve) => {
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            resolve();
          };
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
        });
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;

      // Seek to 1 second or 10% of duration for thumbnail
      const thumbnailTime = Math.min(1, video.duration * 0.1);
      video.currentTime = thumbnailTime;

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked);
          resolve();
        };
        video.addEventListener('seeked', handleSeeked);
      });

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob and create object URL
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      });

      const thumbnailUrl = URL.createObjectURL(blob);
      video.poster = thumbnailUrl;

      // Reset video time
      video.currentTime = 0;
    } catch (error) {
      console.warn('Failed to generate lazy thumbnail:', error);
    }
  }, [enableLazyLoading]);

  // Preload video for smooth playback
  const preloadVideo = useCallback(async (id: string): Promise<void> => {
    if (!enablePreloading) return;

    const videoData = videosRef.current.get(id);
    if (!videoData || videoData.isPreloaded) return;

    const { element } = videoData;

    try {
      videoData.loadStartTime = Date.now();
      
      // Set preload attribute
      element.preload = 'metadata';
      
      // Load video metadata
      if (element.readyState < 1) {
        await new Promise<void>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            element.removeEventListener('loadedmetadata', handleLoadedMetadata);
            element.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            element.removeEventListener('loadedmetadata', handleLoadedMetadata);
            element.removeEventListener('error', handleError);
            reject(new Error('Failed to load video metadata'));
          };

          element.addEventListener('loadedmetadata', handleLoadedMetadata);
          element.addEventListener('error', handleError);
        });
      }

      // Preload some video data for smooth start
      element.preload = 'auto';
      
      videoData.isPreloaded = true;
      videoData.loadEndTime = Date.now();
      videoData.memoryUsage = estimateVideoMemoryUsage(element);
      
      updateMemoryUsage();
      
      console.log(`Preloaded video: ${id} (${videoData.memoryUsage.toFixed(1)}MB)`);
    } catch (error) {
      console.warn(`Failed to preload video ${id}:`, error);
    }
  }, [enablePreloading, estimateVideoMemoryUsage, updateMemoryUsage]);

  // Optimize video quality based on network conditions
  const optimizeQuality = useCallback(async (id: string): Promise<void> => {
    if (!enableAdaptiveQuality) return;

    const videoData = videosRef.current.get(id);
    if (!videoData) return;

    const optimalQuality = getOptimalQuality();
    if (videoData.quality === optimalQuality) return;

    const { element } = videoData;
    
    try {
      // In a real implementation, you would switch to different quality URLs
      // For now, we'll adjust the video element properties
      
      // Store current time and playing state
      const currentTime = element.currentTime;
      const wasPlaying = !element.paused;
      
      // Update quality preference
      videoData.quality = optimalQuality;
      
      // Apply quality-specific optimizations
      switch (optimalQuality) {
        case 'low':
          element.preload = 'metadata';
          break;
        case 'medium':
          element.preload = 'auto';
          break;
        case 'high':
          element.preload = 'auto';
          break;
        default:
          element.preload = 'metadata';
      }

      // Restore playback state
      if (currentTime > 0) {
        element.currentTime = currentTime;
      }
      
      if (wasPlaying) {
        await element.play().catch(console.warn);
      }
      
      console.log(`Optimized video quality: ${id} -> ${optimalQuality}`);
    } catch (error) {
      console.warn(`Failed to optimize video quality for ${id}:`, error);
    }
  }, [enableAdaptiveQuality, getOptimalQuality]);

  // Clean up memory by removing unused videos
  const cleanupMemory = useCallback(async (): Promise<void> => {
    if (memoryUsage < memoryThreshold) return;

    const now = Date.now();
    const videosToCleanup: string[] = [];

    // Find videos that haven't been accessed recently and aren't visible
    videosRef.current.forEach((data, id) => {
      const timeSinceAccess = now - data.lastAccessTime;
      const isOld = timeSinceAccess > 30000; // 30 seconds
      
      if (!data.isVisible && isOld && data.isPreloaded) {
        videosToCleanup.push(id);
      }
    });

    // Sort by last access time (oldest first)
    videosToCleanup.sort((a, b) => {
      const dataA = videosRef.current.get(a)!;
      const dataB = videosRef.current.get(b)!;
      return dataA.lastAccessTime - dataB.lastAccessTime;
    });

    // Clean up videos until we're under the threshold
    for (const id of videosToCleanup) {
      const videoData = videosRef.current.get(id);
      if (!videoData) continue;

      const { element } = videoData;
      
      // Pause and reset video
      element.pause();
      element.currentTime = 0;
      element.preload = 'none';
      
      // Clear preloaded data
      videoData.isPreloaded = false;
      videoData.memoryUsage = 0;
      
      updateMemoryUsage();
      
      console.log(`Cleaned up video memory: ${id}`);
      
      // Stop if we're under the threshold
      if (memoryUsage < memoryThreshold * 0.8) break;
    }
  }, [memoryUsage, memoryThreshold, updateMemoryUsage]);

  // Register video for performance optimization
  const registerVideo = useCallback((
    video: HTMLVideoElement, 
    id: string, 
    qualityVersions?: VideoQualityVersion[]
  ) => {
    if (videosRef.current.has(id)) return;

    const videoData: VideoPerformanceData = {
      element: video,
      id,
      isPreloaded: false,
      isVisible: false,
      quality: getOptimalQuality(),
      lastAccessTime: Date.now(),
      memoryUsage: 0,
      networkType: detectNetworkType()
    };

    videosRef.current.set(id, videoData);

    // Initialize lazy loading
    if (enableLazyLoading) {
      lazyLoadThumbnail(video).catch(console.warn);
    }

    // Optimize quality on registration
    if (enableAdaptiveQuality) {
      optimizeQuality(id).catch(console.warn);
    }

    console.log(`Registered video for performance optimization: ${id}`);
  }, [getOptimalQuality, detectNetworkType, enableLazyLoading, enableAdaptiveQuality, lazyLoadThumbnail, optimizeQuality]);

  // Unregister video
  const unregisterVideo = useCallback((id: string) => {
    const videoData = videosRef.current.get(id);
    if (!videoData) return;

    // Clean up any object URLs created for thumbnails
    if (videoData.element.poster && videoData.element.poster.startsWith('blob:')) {
      URL.revokeObjectURL(videoData.element.poster);
    }

    videosRef.current.delete(id);
    preloadQueueRef.current.delete(id);
    updateMemoryUsage();

    console.log(`Unregistered video from performance optimization: ${id}`);
  }, [updateMemoryUsage]);

  // Set video visibility for preloading decisions
  const setVideoVisible = useCallback((id: string, visible: boolean) => {
    const videoData = videosRef.current.get(id);
    if (!videoData) return;

    videoData.isVisible = visible;
    videoData.lastAccessTime = Date.now();

    // Trigger preloading for visible videos
    if (visible && !videoData.isPreloaded) {
      preloadVideo(id).catch(console.warn);
    }
  }, [preloadVideo]);

  // Preload videos ahead of current position
  const preloadAheadVideos = useCallback((currentVideoIds: string[]) => {
    if (!enablePreloading) return;

    const currentIndex = currentVideoIds.findIndex(id => {
      const data = videosRef.current.get(id);
      return data?.isVisible;
    });

    if (currentIndex === -1) return;

    // Preload videos ahead
    for (let i = 1; i <= preloadDistance; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < currentVideoIds.length) {
        const nextId = currentVideoIds[nextIndex];
        if (!preloadQueueRef.current.has(nextId)) {
          preloadQueueRef.current.add(nextId);
          preloadVideo(nextId).finally(() => {
            preloadQueueRef.current.delete(nextId);
          });
        }
      }
    }
  }, [enablePreloading, preloadDistance, preloadVideo]);

  // Monitor memory usage and clean up when needed
  useEffect(() => {
    const interval = setInterval(() => {
      if (memoryUsage > memoryThreshold) {
        cleanupMemory().catch(console.warn);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [memoryUsage, memoryThreshold, cleanupMemory]);

  // Network change handler - re-optimize all videos
  useEffect(() => {
    if (!enableAdaptiveQuality) return;

    const optimizeAllVideos = async () => {
      const promises = Array.from(videosRef.current.keys()).map(id => 
        optimizeQuality(id).catch(console.warn)
      );
      await Promise.all(promises);
    };

    optimizeAllVideos();
  }, [networkType, enableAdaptiveQuality, optimizeQuality]);

  return {
    registerVideo,
    unregisterVideo,
    preloadVideo,
    optimizeQuality,
    getOptimalQuality,
    getCurrentNetworkType: () => networkType,
    getMemoryUsage: () => memoryUsage,
    cleanupMemory,
    setVideoVisible
  };
};

export default useVideoPerformance;
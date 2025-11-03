import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadProgress } from '@features/events/types/form.types';
import { uploadService } from '@features/events/services/uploadService';

interface UseVideoUploadReturn {
  uploadProgress: UploadProgress | null;
  uploadError: string | null;
  isUploading: boolean;
  uploadVideo: (file: File, userId: string) => Promise<string>;
  cancelUpload: () => void;
  resetUpload: () => void;
}

interface UploadParams {
  file: File;
  userId: string;
}

/**
 * Custom hook for handling video uploads with progress tracking
 * Now uses React Query mutation for upload management
 * Requirements: 6.2, 9.2, 9.5
 */
export function useVideoUpload(): UseVideoUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  
  // Use ref to track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // React Query mutation for video upload
  const uploadMutation = useMutation({
    mutationFn: async ({ file, userId }: UploadParams) => {
      setUploadProgress(null);
      
      const result = await uploadService.uploadVideo(file, userId, (progress) => {
        if (isMountedRef.current) {
          setUploadProgress(progress);
        }
      });

      if (isMountedRef.current) {
        setUploadProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
      }

      return result.videoUrl;
    },
    onError: () => {
      if (isMountedRef.current) {
        setUploadProgress(null);
      }
    },
  });

  /**
   * Uploads a video file with progress tracking using React Query
   * Requirements: 6.2, 9.2, 9.5
   */
  const uploadVideo = useCallback(async (file: File, userId: string): Promise<string> => {
    try {
      const url = await uploadMutation.mutateAsync({ file, userId });
      return url;
    } catch (err) {
      throw err;
    }
  }, [uploadMutation]);

  /**
   * Cancels the current upload
   * Requirements: 9.5
   */
  const cancelUpload = useCallback(() => {
    uploadService.cancelUpload();
    uploadMutation.reset();
    
    if (isMountedRef.current) {
      setUploadProgress(null);
    }
  }, [uploadMutation]);

  /**
   * Resets the upload state
   */
  const resetUpload = useCallback(() => {
    setUploadProgress(null);
    uploadMutation.reset();
  }, [uploadMutation]);

  return {
    uploadProgress,
    uploadError: uploadMutation.error instanceof Error ? uploadMutation.error.message : null,
    isUploading: uploadMutation.isPending,
    uploadVideo,
    cancelUpload,
    resetUpload,
  };
}

export default useVideoUpload;

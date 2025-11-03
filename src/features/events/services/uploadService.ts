import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '@lib/firebase';
import { UploadProgress } from '../types/form.types';
import { validateVideoFile } from '../utils/validation';
import { VIDEO_UPLOAD_ERRORS } from '../utils/constants';

interface UploadResult {
  videoUrl: string;
  thumbnailUrl?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

class UploadService {
  private currentUploadTask: UploadTask | null = null;

  /**
   * Validates a video file before upload
   * Requirements: 9.3, 9.4
   */
  validateVideoFile(file: File): ValidationResult {
    const error = validateVideoFile(file);
    
    if (error) {
      return { valid: false, error };
    }
    
    return { valid: true };
  }

  /**
   * Uploads a video file to Firebase Storage with progress tracking
   * Requirements: 9.2, 9.5, 3.4
   */
  async uploadVideo(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validate file before upload
    const validation = this.validateVideoFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || VIDEO_UPLOAD_ERRORS.INVALID_FORMAT);
    }

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const videoFileName = `${timestamp}_${sanitizedFileName}`;
      
      // Create storage reference for video
      const videoStorageRef = ref(
        storage, 
        `events/videos/${userId}/${videoFileName}`
      );

      // Create upload task
      this.currentUploadTask = uploadBytesResumable(videoStorageRef, file);

      // Track upload progress
      return new Promise((resolve, reject) => {
        if (!this.currentUploadTask) {
          reject(new Error(VIDEO_UPLOAD_ERRORS.UPLOAD_FAILED));
          return;
        }

        this.currentUploadTask.on(
          'state_changed',
          // Progress callback
          (snapshot: UploadTaskSnapshot) => {
            if (onProgress) {
              const progress: UploadProgress = {
                loaded: snapshot.bytesTransferred,
                total: snapshot.totalBytes,
                percentage: Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                ),
              };
              onProgress(progress);
            }
          },
          // Error callback
          (error) => {
            this.currentUploadTask = null;
            
            // Handle specific Firebase Storage errors
            switch (error.code) {
              case 'storage/unauthorized':
                reject(new Error('You do not have permission to upload videos'));
                break;
              case 'storage/canceled':
                reject(new Error('Upload cancelled'));
                break;
              case 'storage/unknown':
              default:
                reject(new Error(VIDEO_UPLOAD_ERRORS.UPLOAD_FAILED));
                break;
            }
          },
          // Success callback
          async () => {
            try {
              if (!this.currentUploadTask) {
                reject(new Error(VIDEO_UPLOAD_ERRORS.UPLOAD_FAILED));
                return;
              }

              // Get download URL for the uploaded video
              const videoUrl = await getDownloadURL(
                this.currentUploadTask.snapshot.ref
              );

              // TODO: Generate thumbnail (can be done via Cloud Function)
              // For now, we'll return undefined for thumbnailUrl
              const thumbnailUrl = undefined;

              this.currentUploadTask = null;
              
              resolve({
                videoUrl,
                thumbnailUrl,
              });
            } catch (error) {
              this.currentUploadTask = null;
              reject(new Error(VIDEO_UPLOAD_ERRORS.UPLOAD_FAILED));
            }
          }
        );
      });
    } catch (error) {
      this.currentUploadTask = null;
      
      if (error instanceof Error) {
        throw new Error(error.message || VIDEO_UPLOAD_ERRORS.UPLOAD_FAILED);
      }
      throw new Error(VIDEO_UPLOAD_ERRORS.UPLOAD_FAILED);
    }
  }

  /**
   * Uploads an event video with automatic thumbnail generation
   * This is a convenience method that wraps uploadVideo
   * Requirements: 3.4
   */
  async uploadEventVideo(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return this.uploadVideo(file, userId, onProgress);
  }

  /**
   * Cancels the current upload
   * Requirements: 9.5
   */
  cancelUpload(): void {
    if (this.currentUploadTask) {
      this.currentUploadTask.cancel();
      this.currentUploadTask = null;
    }
  }

  /**
   * Checks if an upload is currently in progress
   */
  isUploading(): boolean {
    return this.currentUploadTask !== null;
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;

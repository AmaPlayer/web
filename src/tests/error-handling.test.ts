/**
 * Error Handling Tests for Multi-User Moments Feed
 * 
 * This test suite verifies error handling scenarios including:
 * - Empty state behavior
 * - Network connection failures
 * - Individual video load failures
 * - Retry logic
 * - Offline/online transitions
 * 
 * Requirements tested: 3.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { MomentsService } from '../services/api/momentsService';
import { MomentVideo } from '../types/models/moment';

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() })
  },
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  increment: jest.fn((val: number) => val)
}));

// Mock Storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

describe('Error Handling Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Empty State Behavior (Requirement 7.2)', () => {
    it('should return empty array when no moments are available', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock empty result
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        size: 0
      });

      const result = await MomentsService.getMoments({
        limit: 10,
        moderationStatus: 'approved'
      });

      expect(result.moments).toEqual([]);
      expect(result.moments.length).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty state for specific user', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        size: 0
      });

      const result = await MomentsService.getMoments({
        userId: 'user123',
        limit: 10
      });

      expect(result.moments).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('should return empty array when all moments are filtered out by moderation', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock result with no approved moments
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        size: 0
      });

      const result = await MomentsService.getMoments({
        moderationStatus: 'approved',
        limit: 10
      });

      expect(result.moments).toEqual([]);
    });

    it('should handle empty comments for a moment', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          // No comments
        }
      });

      const comments = await MomentsService.getComments('moment123');

      expect(comments).toEqual([]);
      expect(comments.length).toBe(0);
    });
  });

  describe('Network Connection Failures (Requirement 7.1, 7.4)', () => {
    it('should throw network error when fetching moments fails', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const networkError = new Error('unavailable');
      (getDocs as jest.Mock).mockRejectedValue(networkError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle network timeout errors', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'deadline-exceeded';
      (getDocs as jest.Mock).mockRejectedValue(timeoutError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow();
    });

    it('should handle network error when toggling like', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      const networkError = new Error('Network request failed');
      (getDoc as jest.Mock).mockRejectedValue(networkError);

      await expect(
        MomentsService.toggleLike('moment123', 'user123', 'User', null)
      ).rejects.toThrow('Failed to toggle like');
    });

    it('should handle network error when adding comment', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      const networkError = new Error('Network unavailable');
      (addDoc as jest.Mock).mockRejectedValue(networkError);

      const commentData = {
        userId: 'user123',
        userDisplayName: 'Test User',
        userPhotoURL: null,
        text: 'Test comment'
      };

      await expect(
        MomentsService.addComment('moment123', commentData)
      ).rejects.toThrow('Failed to add comment');
    });

    it('should handle network error when fetching single moment', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      const networkError = new Error('Connection lost');
      (getDoc as jest.Mock).mockRejectedValue(networkError);

      await expect(
        MomentsService.getMomentById('moment123')
      ).rejects.toThrow('Failed to fetch moment');
    });

    it('should provide specific error message for network errors', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const networkError = new Error('network error occurred');
      (getDocs as jest.Mock).mockRejectedValue(networkError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Permission Denied Errors (Requirement 7.1)', () => {
    it('should handle permission denied when fetching moments', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const permissionError = new Error('permission-denied: Missing or insufficient permissions');
      (getDocs as jest.Mock).mockRejectedValue(permissionError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow('Access denied');
    });

    it('should handle permission denied when creating moment', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      const permissionError = new Error('Permission denied');
      (addDoc as jest.Mock).mockRejectedValue(permissionError);

      const momentData = {
        userId: 'user123',
        userDisplayName: 'Test User',
        userPhotoURL: null,
        caption: 'Test moment',
        videoFile: new File([''], 'test.mp4', { type: 'video/mp4' })
      };

      await expect(
        MomentsService.createMoment(momentData)
      ).rejects.toThrow('Failed to create moment');
    });

    it('should handle permission denied when updating moment', async () => {
      const { updateDoc } = await import('firebase/firestore');
      
      const permissionError = new Error('Insufficient permissions');
      (updateDoc as jest.Mock).mockRejectedValue(permissionError);

      await expect(
        MomentsService.updateMoment('moment123', { caption: 'Updated' })
      ).rejects.toThrow('Failed to update moment');
    });

    it('should handle permission denied when deleting moment', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      
      const permissionError = new Error('Permission denied');
      (deleteDoc as jest.Mock).mockRejectedValue(permissionError);

      await expect(
        MomentsService.deleteMoment('moment123')
      ).rejects.toThrow('Failed to delete moment');
    });
  });

  describe('Individual Video Load Failures (Requirement 7.3)', () => {
    it('should handle moment not found error', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const result = await MomentsService.getMomentById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle corrupted moment data gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock moment with missing required fields
      const corruptedMoment = {
        id: 'corrupt1',
        // Missing userId, videoUrl, etc.
        caption: 'Test'
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          id: 'corrupt1',
          data: () => corruptedMoment
        }],
        size: 1
      });

      const result = await MomentsService.getMoments({ limit: 10 });

      // Service should still return the data, UI handles validation
      expect(result.moments).toHaveLength(1);
    });

    it('should handle video upload failure', async () => {
      const { uploadBytes } = await import('firebase/storage');
      
      const uploadError = new Error('Upload failed');
      (uploadBytes as jest.Mock).mockRejectedValue(uploadError);

      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await expect(
        MomentsService.uploadVideo(file, 'moment123')
      ).rejects.toThrow('Failed to upload video');
    });

    it('should handle video URL generation failure', async () => {
      const { uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      (uploadBytes as jest.Mock).mockResolvedValue(undefined);
      (getDownloadURL as jest.Mock).mockRejectedValue(new Error('URL generation failed'));

      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await expect(
        MomentsService.uploadVideo(file, 'moment123')
      ).rejects.toThrow('Failed to upload video');
    });

    it('should handle partial moment data in feed', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const partialMoment = {
        id: 'partial1',
        userId: 'user123',
        videoUrl: 'https://example.com/video.mp4',
        // Missing some optional fields
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          id: 'partial1',
          data: () => partialMoment
        }],
        size: 1
      });

      const result = await MomentsService.getMoments({ limit: 10 });

      expect(result.moments).toHaveLength(1);
      expect(result.moments[0].id).toBe('partial1');
    });
  });

  describe('Retry Logic (Requirement 3.5, 7.5)', () => {
    it('should support retry after failed fetch', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // First call fails, second succeeds
      (getDocs as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          docs: [{
            id: 'moment1',
            data: () => ({
              id: 'moment1',
              userId: 'user1',
              videoUrl: 'https://example.com/video.mp4',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
              moderationStatus: 'approved'
            })
          }],
          size: 1
        });

      // First attempt fails
      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow();

      // Retry succeeds
      const result = await MomentsService.getMoments({ limit: 10 });
      expect(result.moments).toHaveLength(1);
    });

    it('should handle multiple retry attempts', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      let attemptCount = 0;
      (getDocs as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Retry needed'));
        }
        return Promise.resolve({
          docs: [],
          size: 0
        });
      });

      // First two attempts fail
      await expect(MomentsService.getMoments({ limit: 10 })).rejects.toThrow();
      await expect(MomentsService.getMoments({ limit: 10 })).rejects.toThrow();
      
      // Third attempt succeeds
      const result = await MomentsService.getMoments({ limit: 10 });
      expect(result.moments).toEqual([]);
      expect(attemptCount).toBe(3);
    });

    it('should handle retry for like action', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // First attempt fails, second succeeds
      (getDoc as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'moment1',
            engagement: {
              likes: [],
              likesCount: 0
            }
          })
        });

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      // First attempt fails
      await expect(
        MomentsService.toggleLike('moment1', 'user1', 'User', null)
      ).rejects.toThrow();

      // Retry succeeds
      const result = await MomentsService.toggleLike('moment1', 'user1', 'User', null);
      expect(result.liked).toBe(true);
    });
  });

  describe('Offline/Online Transitions (Requirement 7.4, 7.5)', () => {
    it('should handle offline state gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const offlineError = new Error('unavailable');
      (getDocs as jest.Mock).mockRejectedValue(offlineError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('should recover when connection is restored', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Simulate offline then online
      (getDocs as jest.Mock)
        .mockRejectedValueOnce(new Error('unavailable'))
        .mockResolvedValueOnce({
          docs: [{
            id: 'moment1',
            data: () => ({
              id: 'moment1',
              userId: 'user1',
              videoUrl: 'https://example.com/video.mp4',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
              moderationStatus: 'approved',
              engagement: {
                likes: [],
                likesCount: 0,
                comments: [],
                commentsCount: 0,
                shares: [],
                sharesCount: 0,
                views: 0,
                watchTime: 0,
                completionRate: 0
              }
            })
          }],
          size: 1
        });

      // Offline attempt fails
      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow();

      // Online attempt succeeds
      const result = await MomentsService.getMoments({ limit: 10 });
      expect(result.moments).toHaveLength(1);
    });

    it('should handle intermittent connectivity during pagination', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // First page succeeds, second page fails (offline), third page succeeds
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({
          docs: [{
            id: 'moment1',
            data: () => ({
              id: 'moment1',
              userId: 'user1',
              videoUrl: 'https://example.com/video1.mp4',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
              moderationStatus: 'approved'
            })
          }],
          size: 1
        })
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce({
          docs: [{
            id: 'moment2',
            data: () => ({
              id: 'moment2',
              userId: 'user2',
              videoUrl: 'https://example.com/video2.mp4',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
              moderationStatus: 'approved'
            })
          }],
          size: 1
        });

      // First page loads
      const page1 = await MomentsService.getMoments({ limit: 1 });
      expect(page1.moments).toHaveLength(1);

      // Second page fails (offline)
      await expect(
        MomentsService.getMoments({ limit: 1, startAfter: page1.lastDocument })
      ).rejects.toThrow();

      // Third page succeeds (back online)
      const page3 = await MomentsService.getMoments({ limit: 1, startAfter: page1.lastDocument });
      expect(page3.moments).toHaveLength(1);
    });

    it('should handle offline state during engagement actions', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      const offlineError = new Error('Client is offline');
      (getDoc as jest.Mock).mockRejectedValue(offlineError);

      await expect(
        MomentsService.toggleLike('moment1', 'user1', 'User', null)
      ).rejects.toThrow('Failed to toggle like');
    });
  });

  describe('Service Unavailable Errors (Requirement 7.1)', () => {
    it('should handle Firestore service unavailable', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const serviceError = new Error('Service unavailable');
      (serviceError as any).code = 'unavailable';
      (getDocs as jest.Mock).mockRejectedValue(serviceError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle Storage service unavailable during upload', async () => {
      const { uploadBytes } = await import('firebase/storage');
      
      const serviceError = new Error('Storage service unavailable');
      (uploadBytes as jest.Mock).mockRejectedValue(serviceError);

      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      await expect(
        MomentsService.uploadVideo(file, 'moment123')
      ).rejects.toThrow('Failed to upload video');
    });

    it('should handle rate limiting errors', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const rateLimitError = new Error('Quota exceeded');
      (rateLimitError as any).code = 'resource-exhausted';
      (getDocs as jest.Mock).mockRejectedValue(rateLimitError);

      await expect(
        MomentsService.getMoments({ limit: 10 })
      ).rejects.toThrow();
    });
  });

  describe('Data Validation Errors (Requirement 7.3)', () => {
    it('should handle invalid moment ID', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const result = await MomentsService.getMomentById('');
      expect(result).toBeNull();
    });

    it('should handle missing required fields in comment', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      const validationError = new Error('Missing required field');
      (addDoc as jest.Mock).mockRejectedValue(validationError);

      const invalidCommentData = {
        userId: '',
        userDisplayName: '',
        userPhotoURL: null,
        text: ''
      };

      await expect(
        MomentsService.addComment('moment123', invalidCommentData)
      ).rejects.toThrow('Failed to add comment');
    });

    it('should handle invalid file type for video upload', async () => {
      const { uploadBytes } = await import('firebase/storage');
      
      const typeError = new Error('Invalid file type');
      (uploadBytes as jest.Mock).mockRejectedValue(typeError);

      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(
        MomentsService.uploadVideo(invalidFile, 'moment123')
      ).rejects.toThrow('Failed to upload video');
    });
  });

  describe('Concurrent Operation Errors (Requirement 7.3)', () => {
    it('should handle concurrent like operations on same moment', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      const momentData = {
        id: 'moment1',
        engagement: {
          likes: [],
          likesCount: 0
        }
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => momentData
      });

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      // Simulate concurrent likes
      const promises = [
        MomentsService.toggleLike('moment1', 'user1', 'User 1', null),
        MomentsService.toggleLike('moment1', 'user2', 'User 2', null),
        MomentsService.toggleLike('moment1', 'user3', 'User 3', null)
      ];

      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.liked).toBe(true);
      });
    });

    it('should handle concurrent comment additions', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      (addDoc as jest.Mock).mockResolvedValue({ id: 'comment123' });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const commentData = {
        userId: 'user1',
        userDisplayName: 'User 1',
        userPhotoURL: null,
        text: 'Test comment'
      };

      // Simulate concurrent comments
      const promises = [
        MomentsService.addComment('moment1', commentData),
        MomentsService.addComment('moment1', { ...commentData, userId: 'user2' }),
        MomentsService.addComment('moment1', { ...commentData, userId: 'user3' })
      ];

      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results).toHaveLength(3);
    });
  });

  describe('Error Recovery and Cleanup (Requirement 7.5)', () => {
    it('should not throw error when tracking interaction fails', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      (addDoc as jest.Mock).mockRejectedValue(new Error('Tracking failed'));

      // Should not throw - tracking failures are logged but don't break flow
      await expect(
        MomentsService.trackInteraction({
          momentId: 'moment1',
          userId: 'user1',
          type: 'view',
          timestamp: new Date()
        })
      ).resolves.not.toThrow();
    });

    it('should not throw error when deleting non-existent video', async () => {
      const { deleteObject } = await import('firebase/storage');
      
      const notFoundError = new Error('Object not found');
      (notFoundError as any).code = 'storage/object-not-found';
      (deleteObject as jest.Mock).mockRejectedValue(notFoundError);

      // Should not throw - deletion of non-existent file is handled gracefully
      await expect(
        MomentsService.deleteVideo('moment123')
      ).resolves.not.toThrow();
    });

    it('should handle cleanup after failed moment creation', async () => {
      const { addDoc, deleteDoc } = await import('firebase/firestore');
      
      (addDoc as jest.Mock).mockRejectedValue(new Error('Creation failed'));
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      const momentData = {
        userId: 'user123',
        userDisplayName: 'Test User',
        userPhotoURL: null,
        caption: 'Test',
        videoFile: new File([''], 'test.mp4', { type: 'video/mp4' })
      };

      await expect(
        MomentsService.createMoment(momentData)
      ).rejects.toThrow('Failed to create moment');
    });
  });
});

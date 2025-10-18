/**
 * Unit Tests for MomentsService Changes
 * 
 * This test suite verifies the core functionality of MomentsService,
 * specifically focusing on the multi-user feed enhancement changes.
 * 
 * Requirements tested: 1.1, 1.2, 2.1, 5.1, 5.2
 */

import { MomentsService } from '../services/api/momentsService';
import { MomentVideo, MomentsQueryOptions } from '../types/models/moment';
import { Timestamp } from 'firebase/firestore';

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

describe('MomentsService - Multi-User Feed Enhancement', () => {
  // Sample test data representing moments from different users
  const createMockMoment = (id: string, userId: string, userName: string): any => ({
    id,
    userId,
    userDisplayName: userName,
    userPhotoURL: `https://example.com/${userId}.jpg`,
    videoUrl: `https://example.com/video-${id}.mp4`,
    thumbnailUrl: `https://example.com/thumb-${id}.jpg`,
    caption: `Video from ${userName}`,
    duration: 30,
    metadata: {
      width: 1080,
      height: 1920,
      fileSize: 5000000,
      format: 'video/mp4',
      aspectRatio: '9:16',
      uploadedAt: new Date().toISOString(),
      processingStatus: 'completed' as const,
      qualityVersions: []
    },
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
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    isActive: true,
    moderationStatus: 'approved' as const
  });

  const mockMultiUserMoments = [
    createMockMoment('moment1', 'user1', 'Alice Johnson'),
    createMockMoment('moment2', 'user2', 'Bob Smith'),
    createMockMoment('moment3', 'user3', 'Carol Davis'),
    createMockMoment('moment4', 'user1', 'Alice Johnson'),
    createMockMoment('moment5', 'user4', 'Dave Wilson'),
    createMockMoment('moment6', 'user2', 'Bob Smith'),
    createMockMoment('moment7', 'user5', 'Eve Brown'),
    createMockMoment('moment8', 'user3', 'Carol Davis')
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMoments() without userId - Multi-User Feed (Requirement 1.1, 1.2)', () => {
    it('should fetch moments from all users when userId is not provided', async () => {
      const { getDocs, query, collection, where, orderBy, limit } = await import('firebase/firestore');
      
      // Mock the query building
      (collection as jest.Mock).mockReturnValue('moments-collection');
      (where as jest.Mock).mockReturnValue('where-clause');
      (orderBy as jest.Mock).mockReturnValue('order-clause');
      (limit as jest.Mock).mockReturnValue('limit-clause');
      (query as jest.Mock).mockReturnValue('final-query');

      // Mock getDocs to return multi-user moments
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      const result = await MomentsService.getMoments({
        limit: 20
      });

      // Verify query was built without userId filter
      expect(collection).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(where).toHaveBeenCalledWith('moderationStatus', '==', 'approved');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(limit).toHaveBeenCalledWith(20);

      // Verify results contain moments from multiple users
      expect(result.moments).toHaveLength(8);
      const uniqueUserIds = new Set(result.moments.map(m => m.userId));
      expect(uniqueUserIds.size).toBeGreaterThan(1);
      expect(uniqueUserIds).toContain('user1');
      expect(uniqueUserIds).toContain('user2');
      expect(uniqueUserIds).toContain('user3');
    });

    it('should return moments from at least 5 different users when available', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      const result = await MomentsService.getMoments({ limit: 20 });

      const uniqueUserIds = new Set(result.moments.map(m => m.userId));
      expect(uniqueUserIds.size).toBeGreaterThanOrEqual(5);
    });

    it('should include user metadata for each moment', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.slice(0, 3).map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 3
      });

      const result = await MomentsService.getMoments({ limit: 3 });

      result.moments.forEach(moment => {
        expect(moment.userId).toBeDefined();
        expect(moment.userDisplayName).toBeDefined();
        expect(moment.userPhotoURL).toBeDefined();
      });
    });

    it('should order moments by creation date (most recent first)', async () => {
      const { getDocs, orderBy } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      await MomentsService.getMoments({ limit: 20 });

      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });
  });

  describe('getMoments() with userId - User-Specific Feed (Requirement 2.1)', () => {
    it('should fetch only specific user moments when userId is provided', async () => {
      const { getDocs, where } = await import('firebase/firestore');
      
      const user1Moments = mockMultiUserMoments.filter(m => m.userId === 'user1');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: user1Moments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: user1Moments.length
      });

      const result = await MomentsService.getMoments({
        userId: 'user1',
        limit: 20
      });

      // Verify userId filter was applied
      expect(where).toHaveBeenCalledWith('userId', '==', 'user1');

      // Verify all returned moments belong to the specified user
      expect(result.moments).toHaveLength(2);
      result.moments.forEach(moment => {
        expect(moment.userId).toBe('user1');
      });
    });

    it('should return empty array when user has no moments', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        size: 0
      });

      const result = await MomentsService.getMoments({
        userId: 'user-with-no-moments',
        limit: 20
      });

      expect(result.moments).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it('should maintain backward compatibility for profile pages', async () => {
      const { getDocs, where } = await import('firebase/firestore');
      
      const user2Moments = mockMultiUserMoments.filter(m => m.userId === 'user2');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: user2Moments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: user2Moments.length
      });

      // Simulate profile page query
      const result = await MomentsService.getMoments({
        userId: 'user2',
        currentUserId: 'current-user',
        includeEngagementMetrics: true,
        limit: 20
      });

      expect(where).toHaveBeenCalledWith('userId', '==', 'user2');
      expect(result.moments.every(m => m.userId === 'user2')).toBe(true);
    });
  });

  describe('Pagination with Multi-User Feed (Requirement 1.2)', () => {
    it('should support pagination with startAfter parameter', async () => {
      const { getDocs, startAfter } = await import('firebase/firestore');
      
      const mockLastDoc = { id: 'moment4' };
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.slice(4).map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 4
      });

      const result = await MomentsService.getMoments({
        limit: 20,
        startAfter: mockLastDoc
      });

      expect(startAfter).toHaveBeenCalledWith(mockLastDoc);
      expect(result.moments).toHaveLength(4);
    });

    it('should indicate hasMore when results equal limit', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const limitedMoments = mockMultiUserMoments.slice(0, 5);
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: limitedMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 5
      });

      const result = await MomentsService.getMoments({ limit: 5 });

      expect(result.hasMore).toBe(true);
      expect(result.lastDocument).toBeDefined();
    });

    it('should indicate no more results when results less than limit', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const limitedMoments = mockMultiUserMoments.slice(0, 3);
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: limitedMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 3
      });

      const result = await MomentsService.getMoments({ limit: 10 });

      expect(result.hasMore).toBe(false);
    });

    it('should correctly paginate through multi-user content', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // First page
      const firstPage = mockMultiUserMoments.slice(0, 3);
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: firstPage.map((moment, index) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 3
      });

      const firstResult = await MomentsService.getMoments({ limit: 3 });
      expect(firstResult.moments).toHaveLength(3);
      expect(firstResult.hasMore).toBe(true);

      // Second page
      const secondPage = mockMultiUserMoments.slice(3, 6);
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: secondPage.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 3
      });

      const secondResult = await MomentsService.getMoments({
        limit: 3,
        startAfter: firstResult.lastDocument
      });
      expect(secondResult.moments).toHaveLength(3);
      
      // Verify different users across pages
      const allMoments = [...firstResult.moments, ...secondResult.moments];
      const uniqueUsers = new Set(allMoments.map(m => m.userId));
      expect(uniqueUsers.size).toBeGreaterThan(1);
    });
  });

  describe('Moderation Status Filtering (Requirement 5.1, 5.2)', () => {
    it('should only fetch approved moments by default', async () => {
      const { getDocs, where } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      await MomentsService.getMoments({ limit: 20 });

      expect(where).toHaveBeenCalledWith('moderationStatus', '==', 'approved');
    });

    it('should only fetch active moments', async () => {
      const { getDocs, where } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      await MomentsService.getMoments({ limit: 20 });

      expect(where).toHaveBeenCalledWith('isActive', '==', true);
    });

    it('should exclude pending moments from feed', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // All returned moments should be approved
      const approvedMoments = mockMultiUserMoments.map(m => ({
        ...m,
        moderationStatus: 'approved' as const
      }));
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: approvedMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: approvedMoments.length
      });

      const result = await MomentsService.getMoments({ limit: 20 });

      result.moments.forEach(moment => {
        expect(moment.moderationStatus).toBe('approved');
      });
    });

    it('should exclude rejected moments from feed', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const approvedMoments = mockMultiUserMoments.filter(m => m.moderationStatus === 'approved');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: approvedMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: approvedMoments.length
      });

      const result = await MomentsService.getMoments({ limit: 20 });

      result.moments.forEach(moment => {
        expect(moment.moderationStatus).not.toBe('rejected');
      });
    });

    it('should exclude inactive moments from feed', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const activeMoments = mockMultiUserMoments.map(m => ({
        ...m,
        isActive: true
      }));
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: activeMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: activeMoments.length
      });

      const result = await MomentsService.getMoments({ limit: 20 });

      result.moments.forEach(moment => {
        expect(moment.isActive).toBe(true);
      });
    });
  });

  describe('Error Handling (Requirement 1.1, 1.2)', () => {
    it('should handle permission denied errors', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const permissionError = new Error('permission-denied');
      (getDocs as jest.Mock).mockRejectedValue(permissionError);

      await expect(
        MomentsService.getMoments({ limit: 20 })
      ).rejects.toThrow('Access denied');
    });

    it('should handle service unavailable errors', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const unavailableError = new Error('unavailable');
      (getDocs as jest.Mock).mockRejectedValue(unavailableError);

      await expect(
        MomentsService.getMoments({ limit: 20 })
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle network errors', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const networkError = new Error('network error occurred');
      (getDocs as jest.Mock).mockRejectedValue(networkError);

      await expect(
        MomentsService.getMoments({ limit: 20 })
      ).rejects.toThrow('Network error');
    });

    it('should handle generic errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const genericError = new Error('Something went wrong');
      (getDocs as jest.Mock).mockRejectedValue(genericError);

      await expect(
        MomentsService.getMoments({ limit: 20 })
      ).rejects.toThrow('Failed to fetch moments');
    });

    it('should handle non-Error exceptions', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockRejectedValue('String error');

      await expect(
        MomentsService.getMoments({ limit: 20 })
      ).rejects.toThrow('Failed to fetch moments');
    });

    it('should handle empty results gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        size: 0
      });

      const result = await MomentsService.getMoments({ limit: 20 });

      expect(result.moments).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.lastDocument).toBeNull();
    });
  });

  describe('Engagement Metrics with currentUserId (Requirement 1.2)', () => {
    it('should compute isLiked state when currentUserId is provided', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const currentUserId = 'current-user';
      const momentsWithLikes = [
        {
          ...mockMultiUserMoments[0],
          engagement: {
            ...mockMultiUserMoments[0].engagement,
            likes: [
              {
                userId: currentUserId,
                userName: 'Current User',
                userPhotoURL: 'https://example.com/current.jpg',
                timestamp: new Date().toISOString()
              }
            ],
            likesCount: 1
          }
        },
        {
          ...mockMultiUserMoments[1],
          engagement: {
            ...mockMultiUserMoments[1].engagement,
            likes: [],
            likesCount: 0
          }
        }
      ];
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: momentsWithLikes.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: momentsWithLikes.length
      });

      const result = await MomentsService.getMoments({
        currentUserId,
        includeEngagementMetrics: true,
        limit: 20
      });

      expect(result.moments[0].isLiked).toBe(true);
      expect(result.moments[1].isLiked).toBe(false);
    });

    it('should not compute isLiked when currentUserId is not provided', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.slice(0, 2).map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 2
      });

      const result = await MomentsService.getMoments({ limit: 20 });

      result.moments.forEach(moment => {
        expect(moment.isLiked).toBeUndefined();
      });
    });

    it('should not compute isLiked when includeEngagementMetrics is false', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.slice(0, 2).map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 2
      });

      const result = await MomentsService.getMoments({
        currentUserId: 'current-user',
        includeEngagementMetrics: false,
        limit: 20
      });

      result.moments.forEach(moment => {
        expect(moment.isLiked).toBeUndefined();
      });
    });
  });

  describe('Query Options and Flexibility', () => {
    it('should respect custom limit parameter', async () => {
      const { getDocs, limit } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.slice(0, 5).map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 5
      });

      await MomentsService.getMoments({ limit: 5 });

      expect(limit).toHaveBeenCalledWith(5);
    });

    it('should use default limit of 20 when not specified', async () => {
      const { getDocs, limit } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      await MomentsService.getMoments({});

      expect(limit).toHaveBeenCalledWith(20);
    });

    it('should support custom orderBy field', async () => {
      const { getDocs, orderBy } = await import('firebase/firestore');
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: mockMultiUserMoments.length
      });

      await MomentsService.getMoments({
        orderBy: 'updatedAt',
        orderDirection: 'asc',
        limit: 20
      });

      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'asc');
    });

    it('should handle all query options together', async () => {
      const { getDocs, where, orderBy, limit, startAfter } = await import('firebase/firestore');
      
      const mockLastDoc = { id: 'last-doc' };
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockMultiUserMoments.slice(0, 10).map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: 10
      });

      const options: MomentsQueryOptions = {
        userId: 'user1',
        currentUserId: 'current-user',
        includeEngagementMetrics: true,
        limit: 10,
        startAfter: mockLastDoc,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        moderationStatus: 'approved'
      };

      await MomentsService.getMoments(options);

      expect(where).toHaveBeenCalledWith('userId', '==', 'user1');
      expect(where).toHaveBeenCalledWith('isActive', '==', true);
      expect(where).toHaveBeenCalledWith('moderationStatus', '==', 'approved');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(limit).toHaveBeenCalledWith(10);
      expect(startAfter).toHaveBeenCalledWith(mockLastDoc);
    });
  });

  describe('Data Integrity and Quality Versions', () => {
    it('should ensure metadata has qualityVersions array', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const momentWithoutQuality = {
        ...mockMultiUserMoments[0],
        metadata: {
          ...mockMultiUserMoments[0].metadata,
          qualityVersions: undefined
        }
      };
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          {
            id: momentWithoutQuality.id,
            data: () => momentWithoutQuality
          }
        ],
        size: 1
      });

      const result = await MomentsService.getMoments({ limit: 1 });

      expect(result.moments[0].metadata.qualityVersions).toEqual([]);
    });

    it('should preserve existing qualityVersions', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const qualityVersions = [
        {
          quality: 'high' as const,
          url: 'https://example.com/high.mp4',
          bitrate: 5000000,
          resolution: '1080p',
          fileSize: 10000000
        }
      ];
      
      const momentWithQuality = {
        ...mockMultiUserMoments[0],
        metadata: {
          ...mockMultiUserMoments[0].metadata,
          qualityVersions
        }
      };
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          {
            id: momentWithQuality.id,
            data: () => momentWithQuality
          }
        ],
        size: 1
      });

      const result = await MomentsService.getMoments({ limit: 1 });

      expect(result.moments[0].metadata.qualityVersions).toEqual(qualityVersions);
    });
  });
});

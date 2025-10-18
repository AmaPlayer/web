/**
 * Integration Tests for Engagement Features with Multi-User Content
 * 
 * This test suite verifies that like, comment, and share functionality
 * works correctly on videos from different users in the multi-user feed.
 * 
 * Requirements tested: 4.1, 4.2, 4.3, 4.4, 4.5
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
  increment: jest.fn((val) => val)
}));

// Mock Storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

describe('Engagement Features with Multi-User Content', () => {
  // Sample multi-user moments data
  const mockMoments: MomentVideo[] = [
    {
      id: 'moment1',
      userId: 'user1',
      userDisplayName: 'Alice Johnson',
      userPhotoURL: 'https://example.com/alice.jpg',
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      caption: 'Amazing sunset!',
      duration: 30,
      metadata: {
        width: 1080,
        height: 1920,
        fileSize: 5000000,
        format: 'video/mp4',
        aspectRatio: '9:16',
        uploadedAt: new Date().toISOString(),
        processingStatus: 'completed',
        qualityVersions: []
      },
      engagement: {
        likes: [],
        likesCount: 0,
        comments: [],
        commentsCount: 0,
        shares: [],
        sharesCount: 0,
        views: 100,
        watchTime: 0,
        completionRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      moderationStatus: 'approved',
      isLiked: false
    },
    {
      id: 'moment2',
      userId: 'user2',
      userDisplayName: 'Bob Smith',
      userPhotoURL: 'https://example.com/bob.jpg',
      videoUrl: 'https://example.com/video2.mp4',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      caption: 'Cooking tutorial',
      duration: 45,
      metadata: {
        width: 1080,
        height: 1920,
        fileSize: 7000000,
        format: 'video/mp4',
        aspectRatio: '9:16',
        uploadedAt: new Date().toISOString(),
        processingStatus: 'completed',
        qualityVersions: []
      },
      engagement: {
        likes: [],
        likesCount: 5,
        comments: [],
        commentsCount: 2,
        shares: [],
        sharesCount: 1,
        views: 250,
        watchTime: 0,
        completionRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      moderationStatus: 'approved',
      isLiked: false
    },
    {
      id: 'moment3',
      userId: 'user3',
      userDisplayName: 'Carol Davis',
      userPhotoURL: 'https://example.com/carol.jpg',
      videoUrl: 'https://example.com/video3.mp4',
      thumbnailUrl: 'https://example.com/thumb3.jpg',
      caption: 'Dance performance',
      duration: 60,
      metadata: {
        width: 1080,
        height: 1920,
        fileSize: 9000000,
        format: 'video/mp4',
        aspectRatio: '9:16',
        uploadedAt: new Date().toISOString(),
        processingStatus: 'completed',
        qualityVersions: []
      },
      engagement: {
        likes: [],
        likesCount: 15,
        comments: [],
        commentsCount: 8,
        shares: [],
        sharesCount: 3,
        views: 500,
        watchTime: 0,
        completionRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      moderationStatus: 'approved',
      isLiked: false
    }
  ];

  const currentUserId = 'currentUser123';
  const currentUserName = 'Current User';
  const currentUserPhoto = 'https://example.com/current.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Like Functionality (Requirement 4.1, 4.2, 4.5)', () => {
    it('should allow liking videos from other users', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Mock getDoc to return a moment from another user
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => mockMoments[0]
      });

      // Mock updateDoc
      (updateDoc as any).mockResolvedValue(undefined);

      const result = await MomentsService.toggleLike(
        mockMoments[0].id,
        currentUserId,
        currentUserName,
        currentUserPhoto
      );

      expect(result.liked).toBe(true);
      expect(result.likesCount).toBe(1);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should allow unliking videos from other users', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Mock moment that current user has already liked
      const likedMoment = {
        ...mockMoments[1],
        engagement: {
          ...mockMoments[1].engagement,
          likes: [
            {
              userId: currentUserId,
              userName: currentUserName,
              userPhotoURL: currentUserPhoto,
              timestamp: new Date().toISOString()
            },
            {
              userId: 'otherUser1',
              userName: 'Other User 1',
              userPhotoURL: 'https://example.com/other1.jpg',
              timestamp: new Date().toISOString()
            },
            {
              userId: 'otherUser2',
              userName: 'Other User 2',
              userPhotoURL: 'https://example.com/other2.jpg',
              timestamp: new Date().toISOString()
            },
            {
              userId: 'otherUser3',
              userName: 'Other User 3',
              userPhotoURL: 'https://example.com/other3.jpg',
              timestamp: new Date().toISOString()
            },
            {
              userId: 'otherUser4',
              userName: 'Other User 4',
              userPhotoURL: 'https://example.com/other4.jpg',
              timestamp: new Date().toISOString()
            }
          ],
          likesCount: 5
        }
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => likedMoment
      });

      (updateDoc as any).mockResolvedValue(undefined);

      const result = await MomentsService.toggleLike(
        likedMoment.id,
        currentUserId,
        currentUserName,
        currentUserPhoto
      );

      expect(result.liked).toBe(false);
      expect(result.likesCount).toBe(4); // 5 likes - 1 (current user) = 4
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should correctly compute isLiked state for current user across multiple videos', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock moments where some are liked by current user
      const momentsWithLikes = mockMoments.map((moment, index) => ({
        ...moment,
        engagement: {
          ...moment.engagement,
          likes: index === 1 ? [{
            userId: currentUserId,
            userName: currentUserName,
            userPhotoURL: currentUserPhoto,
            timestamp: new Date().toISOString()
          }] : []
        }
      }));

      (getDocs as any).mockResolvedValue({
        docs: momentsWithLikes.map((moment, index) => ({
          id: moment.id,
          data: () => moment
        })),
        size: momentsWithLikes.length
      });

      const result = await MomentsService.getMoments({
        currentUserId,
        includeEngagementMetrics: true,
        limit: 10
      });

      // Verify isLiked is correctly set
      expect(result.moments[0].isLiked).toBe(false);
      expect(result.moments[1].isLiked).toBe(true);
      expect(result.moments[2].isLiked).toBe(false);
    });

    it('should update like count correctly across all users videos', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Clear previous mock calls
      jest.clearAllMocks();
      
      // Test liking multiple videos from different users
      for (let i = 0; i < mockMoments.length; i++) {
        const moment = mockMoments[i];
        (getDoc as any).mockResolvedValueOnce({
          exists: () => true,
          data: () => moment
        });

        (updateDoc as any).mockResolvedValueOnce(undefined);

        const result = await MomentsService.toggleLike(
          moment.id,
          currentUserId,
          currentUserName,
          currentUserPhoto
        );

        expect(result.liked).toBe(true);
        // The service returns the new likes array length
        expect(result.likesCount).toBeGreaterThanOrEqual(1);
      }

      // Verify updateDoc was called for each moment
      expect(updateDoc).toHaveBeenCalledTimes(mockMoments.length);
    });
  });

  describe('Comment Functionality (Requirement 4.3, 4.4)', () => {
    it('should allow commenting on videos from other users', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      (addDoc as any).mockResolvedValue({ id: 'comment123' });
      (updateDoc as any).mockResolvedValue(undefined);

      const commentData = {
        userId: currentUserId,
        userDisplayName: currentUserName,
        userPhotoURL: currentUserPhoto,
        text: 'Great video!'
      };

      const commentId = await MomentsService.addComment(
        mockMoments[0].id,
        commentData
      );

      expect(commentId).toBe('comment123');
      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should update comment count correctly when adding comments', async () => {
      const { addDoc, updateDoc, increment } = await import('firebase/firestore');
      
      jest.clearAllMocks();
      
      (addDoc as any).mockResolvedValue({ id: 'comment456' });
      (updateDoc as any).mockResolvedValue(undefined);
      (increment as any).mockImplementation((val) => val);

      const commentData = {
        userId: currentUserId,
        userDisplayName: currentUserName,
        userPhotoURL: currentUserPhoto,
        text: 'Amazing content!'
      };

      await MomentsService.addComment(mockMoments[1].id, commentData);

      // Verify that updateDoc was called
      expect(updateDoc).toHaveBeenCalled();
      
      // Verify the call includes commentsCount update
      const updateDocCalls = (updateDoc as jest.Mock).mock.calls;
      const hasCommentsCountUpdate = updateDocCalls.some(call => 
        call[1] && call[1]['engagement.commentsCount'] !== undefined
      );
      expect(hasCommentsCountUpdate).toBe(true);
    });

    it('should retrieve comments for videos from different users', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockComments = [
        {
          id: 'comment1',
          momentId: mockMoments[2].id,
          userId: 'user4',
          userName: 'Dave Wilson',
          userPhotoURL: 'https://example.com/dave.jpg',
          text: 'Incredible!',
          timestamp: new Date(),
          likes: [],
          replies: [],
          likesCount: 0
        },
        {
          id: 'comment2',
          momentId: mockMoments[2].id,
          userId: currentUserId,
          userName: currentUserName,
          userPhotoURL: currentUserPhoto,
          text: 'Love this!',
          timestamp: new Date(),
          likes: [],
          replies: [],
          likesCount: 0
        }
      ];

      (getDocs as any).mockResolvedValue({
        forEach: (callback: any) => mockComments.forEach((comment) => {
          callback({
            id: comment.id,
            data: () => comment
          });
        })
      });

      const comments = await MomentsService.getComments(mockMoments[2].id);

      expect(comments).toHaveLength(2);
      expect(comments[0].text).toBe('Incredible!');
      expect(comments[1].text).toBe('Love this!');
    });

    it('should allow multiple users to comment on the same video', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      jest.clearAllMocks();
      
      (addDoc as any).mockResolvedValue({ id: 'comment789' });
      (updateDoc as any).mockResolvedValue(undefined);

      // Simulate multiple users commenting
      const users = [
        { id: 'user4', name: 'Dave Wilson', photo: 'https://example.com/dave.jpg' },
        { id: 'user5', name: 'Eve Brown', photo: 'https://example.com/eve.jpg' },
        { id: currentUserId, name: currentUserName, photo: currentUserPhoto }
      ];

      for (const user of users) {
        const commentData = {
          userId: user.id,
          userDisplayName: user.name,
          userPhotoURL: user.photo,
          text: `Comment from ${user.name}`
        };

        await MomentsService.addComment(mockMoments[0].id, commentData);
      }

      // Each comment triggers 2 addDoc calls: one for the comment, one for interaction tracking
      expect(addDoc).toHaveBeenCalledTimes(users.length * 2);
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Share Functionality (Requirement 4.3, 4.4)', () => {
    it('should track share interactions for videos from other users', async () => {
      const { addDoc, updateDoc, increment } = await import('firebase/firestore');
      
      jest.clearAllMocks();
      
      (addDoc as any).mockResolvedValue({ id: 'interaction123' });
      (updateDoc as any).mockResolvedValue(undefined);
      (increment as any).mockImplementation((val) => val);

      await MomentsService.trackInteraction({
        momentId: mockMoments[0].id,
        userId: currentUserId,
        type: 'share',
        timestamp: new Date(),
        metadata: {
          platform: 'twitter'
        }
      });

      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
      
      // Verify the call includes sharesCount update
      const updateDocCalls = (updateDoc as jest.Mock).mock.calls;
      const hasSharesCountUpdate = updateDocCalls.some(call => 
        call[1] && call[1]['engagement.sharesCount'] !== undefined
      );
      expect(hasSharesCountUpdate).toBe(true);
    });

    it('should update share count correctly across all users videos', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      (addDoc as any).mockResolvedValue({ id: 'interaction456' });
      (updateDoc as any).mockResolvedValue(undefined);

      // Share multiple videos from different users
      for (const moment of mockMoments) {
        await MomentsService.trackInteraction({
          momentId: moment.id,
          userId: currentUserId,
          type: 'share',
          timestamp: new Date(),
          metadata: {
            platform: 'facebook'
          }
        });
      }

      expect(addDoc).toHaveBeenCalledTimes(mockMoments.length);
      expect(updateDoc).toHaveBeenCalledTimes(mockMoments.length);
    });

    it('should track different share platforms for the same video', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      
      (addDoc as any).mockResolvedValue({ id: 'interaction789' });
      (updateDoc as any).mockResolvedValue(undefined);

      const platforms = ['twitter', 'facebook', 'whatsapp', 'copy-link'];

      for (const platform of platforms) {
        await MomentsService.trackInteraction({
          momentId: mockMoments[1].id,
          userId: currentUserId,
          type: 'share',
          timestamp: new Date(),
          metadata: {
            platform
          }
        });
      }

      expect(addDoc).toHaveBeenCalledTimes(platforms.length);
    });
  });

  describe('Engagement State Consistency (Requirement 4.5)', () => {
    it('should maintain correct engagement state when switching between videos', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      // Mock moments with different engagement states
      const momentsWithEngagement = [
        {
          ...mockMoments[0],
          engagement: {
            ...mockMoments[0].engagement,
            likes: [{
              userId: currentUserId,
              userName: currentUserName,
              userPhotoURL: currentUserPhoto,
              timestamp: new Date().toISOString()
            }],
            likesCount: 1
          }
        },
        {
          ...mockMoments[1],
          engagement: {
            ...mockMoments[1].engagement,
            likes: [],
            likesCount: 5
          }
        },
        {
          ...mockMoments[2],
          engagement: {
            ...mockMoments[2].engagement,
            likes: [{
              userId: currentUserId,
              userName: currentUserName,
              userPhotoURL: currentUserPhoto,
              timestamp: new Date().toISOString()
            }],
            likesCount: 16
          }
        }
      ];

      (getDocs as any).mockResolvedValue({
        docs: momentsWithEngagement.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: momentsWithEngagement.length
      });

      const result = await MomentsService.getMoments({
        currentUserId,
        includeEngagementMetrics: true,
        limit: 10
      });

      // Verify each video has correct isLiked state
      expect(result.moments[0].isLiked).toBe(true);
      expect(result.moments[0].engagement.likesCount).toBe(1);
      
      expect(result.moments[1].isLiked).toBe(false);
      expect(result.moments[1].engagement.likesCount).toBe(5);
      
      expect(result.moments[2].isLiked).toBe(true);
      expect(result.moments[2].engagement.likesCount).toBe(16);
    });

    it('should handle engagement actions without authentication gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => mockMoments[0]
      });

      // Attempt to like without userId should still work (service handles it)
      // In real implementation, UI would prevent this
      const result = await MomentsService.toggleLike(
        mockMoments[0].id,
        '', // Empty userId
        '',
        null
      );

      // Service should handle this gracefully
      expect(result).toBeDefined();
    });

    it('should preserve engagement counts when fetching moments multiple times', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const momentsWithCounts = mockMoments.map(moment => ({
        ...moment,
        engagement: {
          ...moment.engagement,
          likesCount: 10,
          commentsCount: 5,
          sharesCount: 2
        }
      }));

      (getDocs as any).mockResolvedValue({
        docs: momentsWithCounts.map((moment) => ({
          id: moment.id,
          data: () => moment
        })),
        size: momentsWithCounts.length
      });

      // Fetch moments twice
      const result1 = await MomentsService.getMoments({ limit: 10 });
      const result2 = await MomentsService.getMoments({ limit: 10 });

      // Verify counts are consistent
      expect(result1.moments[0].engagement.likesCount).toBe(10);
      expect(result2.moments[0].engagement.likesCount).toBe(10);
      
      expect(result1.moments[1].engagement.commentsCount).toBe(5);
      expect(result2.moments[1].engagement.commentsCount).toBe(5);
    });
  });

  describe('Error Handling for Engagement Actions', () => {
    it('should handle like errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      (getDoc as any).mockRejectedValue(new Error('Network error'));

      await expect(
        MomentsService.toggleLike(
          mockMoments[0].id,
          currentUserId,
          currentUserName,
          currentUserPhoto
        )
      ).rejects.toThrow('Failed to toggle like');
    });

    it('should handle comment errors gracefully', async () => {
      const { addDoc } = await import('firebase/firestore');
      
      (addDoc as any).mockRejectedValue(new Error('Permission denied'));

      const commentData = {
        userId: currentUserId,
        userDisplayName: currentUserName,
        userPhotoURL: currentUserPhoto,
        text: 'Test comment'
      };

      await expect(
        MomentsService.addComment(mockMoments[0].id, commentData)
      ).rejects.toThrow('Failed to add comment');
    });

    it('should handle moment not found error when liking', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      jest.clearAllMocks();
      
      (getDoc as any).mockResolvedValue({
        exists: () => false
      });

      await expect(
        MomentsService.toggleLike(
          'nonexistent',
          currentUserId,
          currentUserName,
          currentUserPhoto
        )
      ).rejects.toThrow('Failed to toggle like');
    });
  });
});

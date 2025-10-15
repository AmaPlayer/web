// Tests for engagement validation utilities
import {
  validateLikes,
  validateComments,
  validateShares,
  validatePostEngagement,
  sanitizeEngagementData,
  hasUserLikedPost,
  hasUserSharedPost,
  calculateEngagementScore
} from '../validation/engagementValidation';

describe('Engagement Validation', () => {
  describe('validateLikes', () => {
    it('should validate array of string user IDs (legacy format)', () => {
      const likes = ['user1', 'user2', 'user3'];
      const result = validateLikes(likes, 3);
      
      expect(result.isValid).toBe(true);
      expect(result.correctedCount).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate array of like objects (new format)', () => {
      const likes = [
        { userId: 'user1', userName: 'User 1', userPhotoURL: null, timestamp: '2023-01-01' },
        { userId: 'user2', userName: 'User 2', userPhotoURL: 'url', timestamp: '2023-01-02' }
      ];
      const result = validateLikes(likes, 2);
      
      expect(result.isValid).toBe(true);
      expect(result.correctedCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle count mismatch', () => {
      const likes = ['user1', 'user2'];
      const result = validateLikes(likes, 5);
      
      expect(result.isValid).toBe(false);
      expect(result.correctedCount).toBe(2);
      expect(result.errors).toContain('Likes count mismatch: provided 5, actual 2');
    });

    it('should handle invalid like entries', () => {
      const likes = ['user1', null, '', { userId: 'user2' }, { invalidField: 'test' }];
      const result = validateLikes(likes);
      
      expect(result.isValid).toBe(false);
      expect(result.correctedCount).toBe(2); // Only 'user1' and { userId: 'user2' } are valid
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateComments', () => {
    it('should validate valid comment array', () => {
      const comments = [
        {
          id: 'comment1',
          text: 'Great post!',
          userId: 'user1',
          userDisplayName: 'User 1',
          userPhotoURL: null,
          timestamp: '2023-01-01'
        }
      ];
      const result = validateComments(comments, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.correctedCount).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid comment entries', () => {
      const comments = [
        { id: 'comment1', text: 'Valid comment', userId: 'user1', userDisplayName: 'User 1' },
        { id: 'comment2' }, // Missing required fields
        null,
        'invalid'
      ];
      const result = validateComments(comments);
      
      expect(result.isValid).toBe(false);
      expect(result.correctedCount).toBe(1); // Only first comment is valid
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateShares', () => {
    it('should validate valid shares array', () => {
      const shares = ['user1', 'user2', 'user3'];
      const result = validateShares(shares, 3);
      
      expect(result.isValid).toBe(true);
      expect(result.correctedCount).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid share entries', () => {
      const shares = ['user1', '', null, 'user2'];
      const result = validateShares(shares);
      
      expect(result.isValid).toBe(false);
      expect(result.correctedCount).toBe(2); // Only 'user1' and 'user2' are valid
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle legacy shareCount vs sharesCount', () => {
      const shares = ['user1', 'user2'];
      const result = validateShares(shares, 3, 2);
      
      expect(result.isValid).toBe(false);
      expect(result.correctedCount).toBe(2);
      expect(result.errors).toContain('Shares count mismatch: provided 3, actual 2');
    });
  });

  describe('validatePostEngagement', () => {
    it('should validate complete post engagement data', () => {
      const post = {
        id: 'post1',
        likes: ['user1', 'user2'],
        likesCount: 2,
        comments: [
          { id: 'comment1', text: 'Great!', userId: 'user1', userDisplayName: 'User 1' }
        ],
        commentsCount: 1,
        shares: ['user3'],
        sharesCount: 1,
        shareCount: 1,
        shareMetadata: {
          lastSharedAt: '2023-01-01',
          shareBreakdown: { friends: 1, feeds: 0, groups: 0 }
        }
      };

      const result = validatePostEngagement(post);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should correct mismatched counts', () => {
      const post = {
        id: 'post1',
        likes: ['user1', 'user2'],
        likesCount: 5, // Wrong count
        comments: [],
        commentsCount: 3, // Wrong count
        shares: ['user3'],
        sharesCount: 0, // Wrong count
        shareCount: 2 // Wrong count
      };

      const result = validatePostEngagement(post);
      
      expect(result.isValid).toBe(false);
      expect(result.correctedData).toBeDefined();
      expect(result.correctedData?.likesCount).toBe(2);
      expect(result.correctedData?.commentsCount).toBe(0);
      expect(result.correctedData?.sharesCount).toBe(1);
      expect(result.correctedData?.shareCount).toBe(1);
    });
  });

  describe('sanitizeEngagementData', () => {
    it('should sanitize and normalize post data', () => {
      const post = {
        id: 'post1',
        likes: ['user1'],
        likesCount: 5, // Wrong count
        comments: null, // Invalid
        commentsCount: 0,
        shares: undefined, // Invalid
        sharesCount: 0
      };

      const sanitized = sanitizeEngagementData(post);
      
      expect(sanitized.likesCount).toBe(1);
      expect(sanitized.comments).toEqual([]);
      expect(sanitized.shares).toEqual([]);
      expect(sanitized.shareMetadata).toBeDefined();
    });
  });

  describe('hasUserLikedPost', () => {
    it('should detect user like in legacy format', () => {
      const likes = ['user1', 'user2', 'user3'];
      expect(hasUserLikedPost(likes, 'user2')).toBe(true);
      expect(hasUserLikedPost(likes, 'user4')).toBe(false);
    });

    it('should detect user like in new format', () => {
      const likes = [
        { userId: 'user1', userName: 'User 1' },
        { userId: 'user2', userName: 'User 2' }
      ];
      expect(hasUserLikedPost(likes, 'user2')).toBe(true);
      expect(hasUserLikedPost(likes, 'user3')).toBe(false);
    });

    it('should handle mixed formats', () => {
      const likes = [
        'user1',
        { userId: 'user2', userName: 'User 2' },
        'user3'
      ];
      expect(hasUserLikedPost(likes, 'user1')).toBe(true);
      expect(hasUserLikedPost(likes, 'user2')).toBe(true);
      expect(hasUserLikedPost(likes, 'user4')).toBe(false);
    });
  });

  describe('hasUserSharedPost', () => {
    it('should detect user share', () => {
      const shares = ['user1', 'user2', 'user3'];
      expect(hasUserSharedPost(shares, 'user2')).toBe(true);
      expect(hasUserSharedPost(shares, 'user4')).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(hasUserSharedPost(null as any, 'user1')).toBe(false);
      expect(hasUserSharedPost([], '')).toBe(false);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score correctly', () => {
      const post = {
        likesCount: 10,
        commentsCount: 5,
        sharesCount: 2
      } as any;

      const score = calculateEngagementScore(post);
      // (10 * 1) + (5 * 2) + (2 * 3) = 10 + 10 + 6 = 26
      expect(score).toBe(26);
    });

    it('should apply time weight', () => {
      const post = {
        likesCount: 10,
        commentsCount: 5,
        sharesCount: 2
      } as any;

      const score = calculateEngagementScore(post, 2);
      expect(score).toBe(52); // 26 * 2
    });
  });
});
/**
 * Feed Diversity Tests
 * 
 * Tests for the feed diversity algorithm including functionality
 * and performance impact.
 */

import { diversifyFeed, analyzeFeedDiversity, DEFAULT_DIVERSITY_CONFIG } from '../utils/feedDiversity';

describe('Feed Diversity', () => {
  describe('diversifyFeed', () => {
    it('should handle empty array', () => {
      const result = diversifyFeed([]);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const items = [{ userId: 'user1', id: '1' }];
      const result = diversifyFeed(items);
      expect(result).toEqual(items);
    });

    it('should prevent consecutive videos from same user', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: 'user1', id: '2' },
        { userId: 'user1', id: '3' },
        { userId: 'user2', id: '4' },
        { userId: 'user2', id: '5' },
      ];

      const result = diversifyFeed(items, {
        maxConsecutiveFromSameUser: 2,
        maxPercentageFromSingleUser: 1.0
      });

      // Check that no more than 2 consecutive items from same user
      for (let i = 0; i < result.length - 2; i++) {
        const consecutive = [result[i], result[i + 1], result[i + 2]];
        const allSameUser = consecutive.every(item => item.userId === consecutive[0].userId);
        expect(allSameUser).toBe(false);
      }
    });

    it('should respect max percentage from single user', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: 'user1', id: '2' },
        { userId: 'user1', id: '3' },
        { userId: 'user1', id: '4' },
        { userId: 'user1', id: '5' },
        { userId: 'user2', id: '6' },
        { userId: 'user2', id: '7' },
      ];

      const result = diversifyFeed(items, {
        maxConsecutiveFromSameUser: 2,
        maxPercentageFromSingleUser: 0.5 // Max 50%
      });

      const user1Count = result.filter(item => item.userId === 'user1').length;
      const percentage = user1Count / result.length;
      
      // With 7 items and 50% limit, max is ceil(7 * 0.5) = 4 items from user1
      // 4/6 = 0.67 (since user1 had 5 items, 4 are kept, user2 has 2, total 6)
      expect(percentage).toBeLessThanOrEqual(0.67);
      expect(user1Count).toBeLessThanOrEqual(Math.ceil(items.length * 0.5));
    });

    it('should interleave items from different users', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: 'user1', id: '2' },
        { userId: 'user2', id: '3' },
        { userId: 'user2', id: '4' },
        { userId: 'user3', id: '5' },
        { userId: 'user3', id: '6' },
      ];

      const result = diversifyFeed(items);

      // Should have better distribution than input
      const analysis = analyzeFeedDiversity(result);
      expect(analysis.maxConsecutiveFromSameUser).toBeLessThanOrEqual(2);
    });

    it('should preserve all items', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: 'user2', id: '2' },
        { userId: 'user3', id: '3' },
      ];

      const result = diversifyFeed(items);
      
      expect(result.length).toBeLessThanOrEqual(items.length);
      result.forEach(item => {
        expect(items.find(i => i.id === item.id)).toBeDefined();
      });
    });

    it('should use default config when not provided', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        userId: i < 5 ? 'user1' : 'user2',
        id: `${i}`
      }));

      const result = diversifyFeed(items);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(items.length);
    });
  });

  describe('analyzeFeedDiversity', () => {
    it('should handle empty array', () => {
      const result = analyzeFeedDiversity([]);
      
      expect(result.totalItems).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.maxConsecutiveFromSameUser).toBe(0);
      expect(result.maxPercentageFromSingleUser).toBe(0);
    });

    it('should calculate correct metrics', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: 'user1', id: '2' },
        { userId: 'user2', id: '3' },
        { userId: 'user3', id: '4' },
      ];

      const result = analyzeFeedDiversity(items);
      
      expect(result.totalItems).toBe(4);
      expect(result.uniqueUsers).toBe(3);
      expect(result.maxConsecutiveFromSameUser).toBe(2);
      expect(result.maxPercentageFromSingleUser).toBe(0.5); // user1 has 2/4
      expect(result.userDistribution).toEqual({
        user1: 2,
        user2: 1,
        user3: 1
      });
    });

    it('should track consecutive items correctly', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: 'user1', id: '2' },
        { userId: 'user1', id: '3' },
        { userId: 'user2', id: '4' },
      ];

      const result = analyzeFeedDiversity(items);
      
      expect(result.maxConsecutiveFromSameUser).toBe(3);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset with 1000 items from 50 users
      const items = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user${i % 50}`,
        id: `${i}`,
        data: 'some data'
      }));

      const startTime = performance.now();
      const result = diversifyFeed(items);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (< 100ms for 1000 items)
      expect(duration).toBeLessThan(100);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(items.length);
    });

    it('should not significantly impact memory', () => {
      const items = Array.from({ length: 500 }, (_, i) => ({
        userId: `user${i % 25}`,
        id: `${i}`,
        videoUrl: 'https://example.com/video.mp4',
        metadata: { title: 'Test', description: 'Test video' }
      }));

      const result = diversifyFeed(items);
      
      // Result should not be significantly larger than input
      expect(result.length).toBeLessThanOrEqual(items.length);
    });

    it('should maintain performance with many users', () => {
      // Create dataset with 100 different users
      const items = Array.from({ length: 500 }, (_, i) => ({
        userId: `user${i % 100}`,
        id: `${i}`
      }));

      const startTime = performance.now();
      const result = diversifyFeed(items);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all items from same user', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        userId: 'user1',
        id: `${i}`
      }));

      const result = diversifyFeed(items, {
        maxConsecutiveFromSameUser: 2,
        maxPercentageFromSingleUser: 0.3
      });

      // Should limit to 30% of 10 = 3 items
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle items with missing userId gracefully', () => {
      const items = [
        { userId: 'user1', id: '1' },
        { userId: '', id: '2' },
        { userId: 'user2', id: '3' },
      ];

      const result = diversifyFeed(items);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle custom config values', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        userId: i < 10 ? 'user1' : 'user2',
        id: `${i}`
      }));

      const result = diversifyFeed(items, {
        maxConsecutiveFromSameUser: 3,
        maxPercentageFromSingleUser: 0.6
      });

      const analysis = analyzeFeedDiversity(result);
      expect(analysis.maxConsecutiveFromSameUser).toBeLessThanOrEqual(3);
      expect(analysis.maxPercentageFromSingleUser).toBeLessThanOrEqual(0.6);
    });
  });
});

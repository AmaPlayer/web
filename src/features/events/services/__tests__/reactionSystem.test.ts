import { describe, it, expect, beforeEach } from 'vitest';
import { ReactionSystem } from '@features/events/services/reactionSystem';
import { EmojiCategory } from '@features/events/types/social.types';

describe('ReactionSystem', () => {
  let reactionSystem: ReactionSystem;

  beforeEach(() => {
    reactionSystem = new ReactionSystem();
  });

  describe('addReaction', () => {
    it('should add a reaction to a target', async () => {
      const reaction = await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar.jpg',
        'event',
        '🔥',
        false
      );

      expect(reaction).toBeDefined();
      expect(reaction.targetId).toBe('event_1');
      expect(reaction.userId).toBe('user_1');
      expect(reaction.userName).toBe('John Doe');
      expect(reaction.reactionType).toBe('🔥');
      expect(reaction.targetType).toBe('event');
    });

    it('should replace existing reaction from same user', async () => {
      // Add first reaction
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar.jpg',
        'event',
        '🔥'
      );

      // Add second reaction from same user
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar.jpg',
        'event',
        '❤️'
      );

      const reactions = await reactionSystem.getDetailedReactions('event_1');
      expect(reactions).toHaveLength(1);
      expect(reactions[0].reactionType).toBe('❤️');
    });

    it('should allow multiple users to react to same target', async () => {
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar1.jpg',
        'event',
        '🔥'
      );

      await reactionSystem.addReaction(
        'event_1',
        'user_2',
        'Jane Smith',
        'avatar2.jpg',
        'event',
        '❤️'
      );

      const reactions = await reactionSystem.getDetailedReactions('event_1');
      expect(reactions).toHaveLength(2);
    });
  });

  describe('removeReaction', () => {
    it('should remove user reaction from target', async () => {
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar.jpg',
        'event',
        '🔥'
      );

      await reactionSystem.removeReaction('event_1', 'user_1');

      const reactions = await reactionSystem.getDetailedReactions('event_1');
      expect(reactions).toHaveLength(0);
    });

    it('should not affect other users reactions', async () => {
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar1.jpg',
        'event',
        '🔥'
      );

      await reactionSystem.addReaction(
        'event_1',
        'user_2',
        'Jane Smith',
        'avatar2.jpg',
        'event',
        '❤️'
      );

      await reactionSystem.removeReaction('event_1', 'user_1');

      const reactions = await reactionSystem.getDetailedReactions('event_1');
      expect(reactions).toHaveLength(1);
      expect(reactions[0].userId).toBe('user_2');
    });
  });

  describe('getReactions', () => {
    it('should return reaction summary with counts', async () => {
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar1.jpg',
        'event',
        '🔥'
      );

      await reactionSystem.addReaction(
        'event_1',
        'user_2',
        'Jane Smith',
        'avatar2.jpg',
        'event',
        '🔥'
      );

      await reactionSystem.addReaction(
        'event_1',
        'user_3',
        'Bob Johnson',
        'avatar3.jpg',
        'event',
        '❤️'
      );

      const summary = await reactionSystem.getReactions('event_1');
      expect(summary.reactions['🔥']).toBe(2);
      expect(summary.reactions['❤️']).toBe(1);
      expect(summary.total).toBe(3);
    });

    it('should include user reaction when currentUserId provided', async () => {
      await reactionSystem.addReaction(
        'event_1',
        'user_1',
        'John Doe',
        'avatar.jpg',
        'event',
        '🔥'
      );

      const summary = await reactionSystem.getReactions('event_1', 'user_1');
      expect(summary.userReaction).toBe('🔥');
    });

    it('should return empty summary for target with no reactions', async () => {
      const summary = await reactionSystem.getReactions('event_nonexistent');
      expect(summary.reactions).toEqual({});
      expect(summary.total).toBe(0);
      expect(summary.userReaction).toBeUndefined();
    });
  });

  describe('getCustomEmojis', () => {
    it('should return sport-specific emojis', async () => {
      const basketballEmojis = await reactionSystem.getCustomEmojis('basketball');
      expect(basketballEmojis.length).toBeGreaterThan(0);
      expect(basketballEmojis.every(emoji => emoji.sport === 'basketball')).toBe(true);
    });

    it('should return all emojis when no sport specified', async () => {
      const allEmojis = await reactionSystem.getCustomEmojis();
      expect(allEmojis.length).toBeGreaterThan(0);
      
      const sports = new Set(allEmojis.map(emoji => emoji.sport));
      expect(sports.size).toBeGreaterThan(1); // Should have multiple sports
    });

    it('should return empty array for unknown sport', async () => {
      const unknownEmojis = await reactionSystem.getCustomEmojis('unknown_sport');
      expect(unknownEmojis).toEqual([]);
    });
  });

  describe('getCelebrationGifs', () => {
    it('should return sport-specific celebration GIFs', async () => {
      const basketballGifs = await reactionSystem.getCelebrationGifs('basketball');
      expect(basketballGifs.length).toBeGreaterThan(0);
      expect(basketballGifs.every(gif => gif.includes('basketball'))).toBe(true);
    });

    it('should return general GIFs for unknown sport', async () => {
      const unknownGifs = await reactionSystem.getCelebrationGifs('unknown_sport');
      expect(unknownGifs.length).toBeGreaterThan(0);
      expect(unknownGifs.every(gif => gif.includes('general'))).toBe(true);
    });
  });

  describe('addCelebrationGif', () => {
    it('should add custom celebration GIF for sport', async () => {
      const customGif = '/custom/basketball-celebration.gif';
      await reactionSystem.addCelebrationGif('basketball', customGif);

      const basketballGifs = await reactionSystem.getCelebrationGifs('basketball');
      expect(basketballGifs).toContain(customGif);
    });
  });

  describe('getTrendingReactions', () => {
    it('should return trending reactions sorted by usage', async () => {
      // Add multiple reactions to increase usage count
      await reactionSystem.addReaction('event_1', 'user_1', 'User 1', undefined, 'event', '🔥');
      await reactionSystem.addReaction('event_2', 'user_2', 'User 2', undefined, 'event', '🔥');
      await reactionSystem.addReaction('event_3', 'user_3', 'User 3', undefined, 'event', '❤️');

      const trending = await reactionSystem.getTrendingReactions('general', 5);
      expect(trending.length).toBeGreaterThan(0);
      
      // Should be sorted by usage count (descending)
      for (let i = 1; i < trending.length; i++) {
        expect(trending[i - 1].usage_count).toBeGreaterThanOrEqual(trending[i].usage_count);
      }
    });

    it('should limit results to specified count', async () => {
      const trending = await reactionSystem.getTrendingReactions('general', 3);
      expect(trending.length).toBeLessThanOrEqual(3);
    });
  });

  describe('emoji categories', () => {
    it('should have emojis with correct categories', async () => {
      const basketballEmojis = await reactionSystem.getCustomEmojis('basketball');
      const categories = basketballEmojis.map(emoji => emoji.category);
      
      expect(categories).toContain(EmojiCategory.SPORT_SPECIFIC);
      expect(categories).toContain(EmojiCategory.CELEBRATION);
    });
  });
});
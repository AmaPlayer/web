import {
  EnhancedReaction,
  CustomEmoji,
  EmojiCategory
} from '../types/social.types';
import { ReactionSummary } from '../types/event.types';
import { Timestamp } from 'firebase/firestore';

/**
 * Enhanced Reaction System Service
 * Handles sport-specific emojis, animated reactions, and custom celebration GIFs
 */
export class ReactionSystem {
  private reactions: Map<string, EnhancedReaction[]> = new Map();
  private customEmojis: Map<string, CustomEmoji[]> = new Map();
  private celebrationGifs: Map<string, string[]> = new Map();

  constructor() {
    this.initializeSportEmojis();
    this.initializeCelebrationGifs();
  }

  /**
   * Add a reaction to a target (event, comment, submission, challenge)
   */
  async addReaction(
    targetId: string, 
    userId: string, 
    userName: string,
    userAvatar: string | undefined,
    targetType: 'event' | 'comment' | 'submission' | 'challenge',
    reactionType: string,
    animated: boolean = false
  ): Promise<EnhancedReaction> {
    // Remove existing reaction from this user if any
    await this.removeReaction(targetId, userId);

    const reaction: EnhancedReaction = {
      id: `${targetId}_${userId}_${Date.now()}`,
      userId,
      userName,
      userAvatar,
      targetType,
      targetId,
      reactionType,
      timestamp: Timestamp.now(),
      animated
    };

    const targetReactions = this.reactions.get(targetId) || [];
    targetReactions.push(reaction);
    this.reactions.set(targetId, targetReactions);

    // Update emoji usage count
    this.updateEmojiUsage(reactionType);

    return reaction;
  }

  /**
   * Remove a user's reaction from a target
   */
  async removeReaction(targetId: string, userId: string): Promise<void> {
    const targetReactions = this.reactions.get(targetId) || [];
    const filteredReactions = targetReactions.filter(r => r.userId !== userId);
    this.reactions.set(targetId, filteredReactions);
  }

  /**
   * Get reaction summary for a target
   */
  async getReactions(targetId: string, currentUserId?: string): Promise<ReactionSummary> {
    const targetReactions = this.reactions.get(targetId) || [];
    
    const reactionCounts: { [reactionType: string]: number } = {};
    let userReaction: string | undefined;

    targetReactions.forEach(reaction => {
      reactionCounts[reaction.reactionType] = (reactionCounts[reaction.reactionType] || 0) + 1;
      
      if (currentUserId && reaction.userId === currentUserId) {
        userReaction = reaction.reactionType;
      }
    });

    return {
      reactions: reactionCounts,
      total: targetReactions.length,
      userReaction
    };
  }

  /**
   * Get all reactions for a target with user details
   */
  async getDetailedReactions(targetId: string): Promise<EnhancedReaction[]> {
    return this.reactions.get(targetId) || [];
  }

  /**
   * Get sport-specific custom emojis
   */
  async getCustomEmojis(sport?: string): Promise<CustomEmoji[]> {
    if (sport) {
      return this.customEmojis.get(sport) || [];
    }
    
    // Return all emojis if no sport specified
    const allEmojis: CustomEmoji[] = [];
    this.customEmojis.forEach(emojis => allEmojis.push(...emojis));
    return allEmojis;
  }

  /**
   * Get celebration GIFs for a sport
   */
  async getCelebrationGifs(sport: string): Promise<string[]> {
    return this.celebrationGifs.get(sport) || this.celebrationGifs.get('general') || [];
  }

  /**
   * Add custom celebration GIF
   */
  async addCelebrationGif(sport: string, gifUrl: string): Promise<void> {
    const sportGifs = this.celebrationGifs.get(sport) || [];
    sportGifs.push(gifUrl);
    this.celebrationGifs.set(sport, sportGifs);
  }

  /**
   * Get trending reactions for a sport
   */
  async getTrendingReactions(sport: string, limit: number = 10): Promise<CustomEmoji[]> {
    const sportEmojis = this.customEmojis.get(sport) || [];
    return sportEmojis
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }

  /**
   * Initialize sport-specific emojis
   */
  private initializeSportEmojis(): void {
    const sportsEmojis = {
      basketball: [
        { id: 'bb_fire', name: 'On Fire', url: '🔥', sport: 'basketball', animated: false, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'bb_dunk', name: 'Slam Dunk', url: '🏀', sport: 'basketball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'bb_swish', name: 'Nothing But Net', url: '🎯', sport: 'basketball', animated: false, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'bb_clutch', name: 'Clutch', url: '💎', sport: 'basketball', animated: true, category: EmojiCategory.CELEBRATION, usage_count: 0 }
      ],
      football: [
        { id: 'fb_touchdown', name: 'Touchdown', url: '🏈', sport: 'football', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'fb_tackle', name: 'Great Tackle', url: '💥', sport: 'football', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'fb_field_goal', name: 'Field Goal', url: '🎯', sport: 'football', animated: false, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'fb_beast', name: 'Beast Mode', url: '🦁', sport: 'football', animated: true, category: EmojiCategory.MOTIVATION, usage_count: 0 }
      ],
      soccer: [
        { id: 'sc_goal', name: 'Goal!', url: '⚽', sport: 'soccer', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'sc_save', name: 'Amazing Save', url: '🧤', sport: 'soccer', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'sc_skill', name: 'Skill Move', url: '✨', sport: 'soccer', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'sc_celebration', name: 'Celebration', url: '🎉', sport: 'soccer', animated: true, category: EmojiCategory.CELEBRATION, usage_count: 0 }
      ],
      tennis: [
        { id: 'tn_ace', name: 'Ace!', url: '🎾', sport: 'tennis', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'tn_winner', name: 'Winner', url: '🏆', sport: 'tennis', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'tn_power', name: 'Power Shot', url: '⚡', sport: 'tennis', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'tn_finesse', name: 'Finesse', url: '💫', sport: 'tennis', animated: false, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 }
      ],
      baseball: [
        { id: 'bb_homerun', name: 'Home Run', url: '⚾', sport: 'baseball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'bb_strikeout', name: 'Strikeout', url: '🔥', sport: 'baseball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'bb_catch', name: 'Great Catch', url: '🥎', sport: 'baseball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'bb_steal', name: 'Stolen Base', url: '💨', sport: 'baseball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 }
      ],
      volleyball: [
        { id: 'vb_spike', name: 'Spike', url: '🏐', sport: 'volleyball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'vb_block', name: 'Block', url: '🛡️', sport: 'volleyball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'vb_dig', name: 'Great Dig', url: '💪', sport: 'volleyball', animated: false, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 },
        { id: 'vb_serve', name: 'Ace Serve', url: '🎯', sport: 'volleyball', animated: true, category: EmojiCategory.SPORT_SPECIFIC, usage_count: 0 }
      ],
      general: [
        { id: 'gen_fire', name: 'Fire', url: '🔥', sport: 'general', animated: true, category: EmojiCategory.REACTION, usage_count: 0 },
        { id: 'gen_strong', name: 'Strong', url: '💪', sport: 'general', animated: false, category: EmojiCategory.MOTIVATION, usage_count: 0 },
        { id: 'gen_clap', name: 'Applause', url: '👏', sport: 'general', animated: true, category: EmojiCategory.REACTION, usage_count: 0 },
        { id: 'gen_heart', name: 'Love', url: '❤️', sport: 'general', animated: true, category: EmojiCategory.REACTION, usage_count: 0 },
        { id: 'gen_lightning', name: 'Lightning', url: '⚡', sport: 'general', animated: true, category: EmojiCategory.REACTION, usage_count: 0 },
        { id: 'gen_trophy', name: 'Champion', url: '🏆', sport: 'general', animated: true, category: EmojiCategory.CELEBRATION, usage_count: 0 },
        { id: 'gen_star', name: 'Star', url: '⭐', sport: 'general', animated: true, category: EmojiCategory.CELEBRATION, usage_count: 0 },
        { id: 'gen_rocket', name: 'Rocket', url: '🚀', sport: 'general', animated: true, category: EmojiCategory.MOTIVATION, usage_count: 0 }
      ]
    };

    Object.entries(sportsEmojis).forEach(([sport, emojis]) => {
      this.customEmojis.set(sport, emojis);
    });
  }

  /**
   * Initialize celebration GIFs
   */
  private initializeCelebrationGifs(): void {
    const celebrationGifs = {
      basketball: [
        '/gifs/basketball/dunk-celebration.gif',
        '/gifs/basketball/three-pointer-celebration.gif',
        '/gifs/basketball/team-celebration.gif'
      ],
      football: [
        '/gifs/football/touchdown-dance.gif',
        '/gifs/football/spike-celebration.gif',
        '/gifs/football/team-huddle.gif'
      ],
      soccer: [
        '/gifs/soccer/goal-celebration.gif',
        '/gifs/soccer/team-celebration.gif',
        '/gifs/soccer/victory-dance.gif'
      ],
      tennis: [
        '/gifs/tennis/ace-celebration.gif',
        '/gifs/tennis/match-point.gif',
        '/gifs/tennis/victory-pose.gif'
      ],
      baseball: [
        '/gifs/baseball/homerun-celebration.gif',
        '/gifs/baseball/team-celebration.gif',
        '/gifs/baseball/victory-dance.gif'
      ],
      volleyball: [
        '/gifs/volleyball/spike-celebration.gif',
        '/gifs/volleyball/team-celebration.gif',
        '/gifs/volleyball/victory-jump.gif'
      ],
      general: [
        '/gifs/general/victory-dance.gif',
        '/gifs/general/celebration.gif',
        '/gifs/general/confetti.gif',
        '/gifs/general/fireworks.gif'
      ]
    };

    Object.entries(celebrationGifs).forEach(([sport, gifs]) => {
      this.celebrationGifs.set(sport, gifs);
    });
  }

  /**
   * Update emoji usage count
   */
  private updateEmojiUsage(reactionType: string): void {
    this.customEmojis.forEach(emojis => {
      const emoji = emojis.find(e => e.url === reactionType || e.name === reactionType);
      if (emoji) {
        emoji.usage_count++;
      }
    });
  }
}

// Export singleton instance
export const reactionSystem = new ReactionSystem();
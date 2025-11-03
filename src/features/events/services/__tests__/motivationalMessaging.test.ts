import { describe, it, expect, beforeEach } from 'vitest';
import { MotivationalMessagingSystem } from '@features/events/services/motivationalMessaging';
import { MessageCategory } from '@features/events/types/social.types';
import { Achievement } from '@features/events/types/engagement.types';

describe('MotivationalMessagingSystem', () => {
  let messagingSystem: MotivationalMessagingSystem;

  beforeEach(() => {
    messagingSystem = new MotivationalMessagingSystem();
  });

  describe('getMessageTemplates', () => {
    it('should return templates for specific category', async () => {
      const encouragementTemplates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      expect(encouragementTemplates.length).toBeGreaterThan(0);
      expect(encouragementTemplates.every(t => t.category === MessageCategory.ENCOURAGEMENT)).toBe(true);
    });

    it('should return sport-specific templates when sport provided', async () => {
      const basketballTemplates = await messagingSystem.getMessageTemplates(
        MessageCategory.ENCOURAGEMENT, 
        'basketball'
      );
      expect(basketballTemplates.length).toBeGreaterThan(0);
      expect(basketballTemplates.every(t => !t.sport || t.sport === 'basketball')).toBe(true);
    });

    it('should return all templates when no category specified', async () => {
      const allTemplates = await messagingSystem.getMessageTemplates();
      expect(allTemplates.length).toBeGreaterThan(0);
      
      const categories = new Set(allTemplates.map(t => t.category));
      expect(categories.size).toBeGreaterThan(1); // Should have multiple categories
    });

    it('should filter by sport across all categories', async () => {
      const soccerTemplates = await messagingSystem.getMessageTemplates(undefined, 'soccer');
      expect(soccerTemplates.length).toBeGreaterThan(0);
      expect(soccerTemplates.every(t => !t.sport || t.sport === 'soccer')).toBe(true);
    });
  });

  describe('sendMotivationalMessage', () => {
    it('should send personalized message using template', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      const template = templates[0];

      const message = await messagingSystem.sendMotivationalMessage(
        'sender_1',
        'recipient_1',
        template.id,
        { type: 'participation', eventId: 'event_1' },
        { sport: 'basketball' }
      );

      expect(message).toBeDefined();
      expect(message.fromUserId).toBe('sender_1');
      expect(message.toUserId).toBe('recipient_1');
      expect(message.templateId).toBe(template.id);
      expect(message.content).toContain('Athlete'); // Should contain personalized userName
      expect(message.context.type).toBe('participation');
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        messagingSystem.sendMotivationalMessage(
          'sender_1',
          'recipient_1',
          'non_existent_template',
          { type: 'support' }
        )
      ).rejects.toThrow('Template not found');
    });

    it('should replace template variables with custom values', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      const template = templates.find(t => t.variables.includes('sport'));
      
      if (template) {
        const message = await messagingSystem.sendMotivationalMessage(
          'sender_1',
          'recipient_1',
          template.id,
          { type: 'participation' },
          { sport: 'tennis' }
        );

        expect(message.content).toContain('tennis');
      }
    });

    it('should increment template usage count', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      const template = templates[0];
      const initialUsage = template.usage_count;

      await messagingSystem.sendMotivationalMessage(
        'sender_1',
        'recipient_1',
        template.id,
        { type: 'participation' }
      );

      expect(template.usage_count).toBe(initialUsage + 1);
    });
  });

  describe('getUserMessages', () => {
    it('should return messages for user in chronological order', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      const template = templates[0];

      // Send multiple messages
      await messagingSystem.sendMotivationalMessage(
        'sender_1',
        'recipient_1',
        template.id,
        { type: 'participation' }
      );

      await messagingSystem.sendMotivationalMessage(
        'sender_2',
        'recipient_1',
        template.id,
        { type: 'support' }
      );

      const messages = await messagingSystem.getUserMessages('recipient_1');
      expect(messages).toHaveLength(2);
      
      // Should be sorted by sentAt (newest first)
      expect(messages[0].sentAt.getTime()).toBeGreaterThanOrEqual(messages[1].sentAt.getTime());
    });

    it('should limit results when limit provided', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      const template = templates[0];

      // Send multiple messages
      for (let i = 0; i < 5; i++) {
        await messagingSystem.sendMotivationalMessage(
          'sender_1',
          'recipient_1',
          template.id,
          { type: 'participation' }
        );
      }

      const messages = await messagingSystem.getUserMessages('recipient_1', 3);
      expect(messages).toHaveLength(3);
    });

    it('should return empty array for user with no messages', async () => {
      const messages = await messagingSystem.getUserMessages('nonexistent_user');
      expect(messages).toEqual([]);
    });
  });

  describe('generateAchievementMessage', () => {
    it('should generate congratulations message for achievement', async () => {
      const achievement: Achievement = {
        id: 'ach_1',
        name: 'First Step',
        description: 'Joined your first event',
        iconUrl: '/icons/first-step.png',
        rarity: 'common',
        points: 10,
        unlockedAt: new Date()
      };

      const message = await messagingSystem.generateAchievementMessage(
        'sender_1',
        'recipient_1',
        achievement
      );

      expect(message.context.type).toBe('achievement');
      expect(message.context.achievementId).toBe('ach_1');
      expect(message.content).toContain('First Step');
      // The content should contain either the achievement name or description
      expect(message.content.includes('First Step') || message.content.includes('Joined your first event')).toBe(true);
    });
  });

  describe('generateParticipationMessage', () => {
    it('should generate encouragement message for participation', async () => {
      const message = await messagingSystem.generateParticipationMessage(
        'sender_1',
        'recipient_1',
        'event_1',
        'basketball'
      );

      expect(message.context.type).toBe('participation');
      expect(message.context.eventId).toBe('event_1');
      expect(message.content).toBeDefined();
    });

    it('should work without sport specification', async () => {
      const message = await messagingSystem.generateParticipationMessage(
        'sender_1',
        'recipient_1',
        'event_1'
      );

      expect(message.context.type).toBe('participation');
      expect(message.context.eventId).toBe('event_1');
    });
  });

  describe('generateSupportMessage', () => {
    it('should generate support message', async () => {
      const message = await messagingSystem.generateSupportMessage(
        'sender_1',
        'recipient_1',
        'event_1',
        'challenge_1'
      );

      expect(message.context.type).toBe('support');
      expect(message.context.eventId).toBe('event_1');
      expect(message.context.challengeId).toBe('challenge_1');
    });

    it('should work with only eventId', async () => {
      const message = await messagingSystem.generateSupportMessage(
        'sender_1',
        'recipient_1',
        'event_1'
      );

      expect(message.context.type).toBe('support');
      expect(message.context.eventId).toBe('event_1');
      expect(message.context.challengeId).toBeUndefined();
    });
  });

  describe('getTrendingTemplates', () => {
    it('should return templates sorted by usage count', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      
      // Use some templates to increase usage count
      await messagingSystem.sendMotivationalMessage(
        'sender_1',
        'recipient_1',
        templates[0].id,
        { type: 'participation' }
      );
      
      await messagingSystem.sendMotivationalMessage(
        'sender_1',
        'recipient_2',
        templates[0].id,
        { type: 'participation' }
      );

      const trending = await messagingSystem.getTrendingTemplates(5);
      expect(trending.length).toBeGreaterThan(0);
      
      // Should be sorted by usage count (descending)
      for (let i = 1; i < trending.length; i++) {
        expect(trending[i - 1].usage_count).toBeGreaterThanOrEqual(trending[i].usage_count);
      }
    });

    it('should limit results to specified count', async () => {
      const trending = await messagingSystem.getTrendingTemplates(3);
      expect(trending.length).toBeLessThanOrEqual(3);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read', async () => {
      const templates = await messagingSystem.getMessageTemplates(MessageCategory.ENCOURAGEMENT);
      const template = templates[0];

      const message = await messagingSystem.sendMotivationalMessage(
        'sender_1',
        'recipient_1',
        template.id,
        { type: 'participation' }
      );

      expect(message.readAt).toBeUndefined();

      await messagingSystem.markMessageAsRead(message.id, 'recipient_1');

      const messages = await messagingSystem.getUserMessages('recipient_1');
      const updatedMessage = messages.find(m => m.id === message.id);
      expect(updatedMessage?.readAt).toBeDefined();
    });

    it('should not affect non-existent message', async () => {
      // Should not throw error
      await messagingSystem.markMessageAsRead('nonexistent_message', 'user_1');
    });
  });

  describe('message categories', () => {
    it('should have templates for all message categories', async () => {
      const categories = Object.values(MessageCategory);
      
      for (const category of categories) {
        const templates = await messagingSystem.getMessageTemplates(category);
        expect(templates.length).toBeGreaterThan(0);
      }
    });

    it('should have proper template structure', async () => {
      const allTemplates = await messagingSystem.getMessageTemplates();
      
      allTemplates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.template).toBeDefined();
        expect(template.category).toBeDefined();
        expect(Array.isArray(template.variables)).toBe(true);
        expect(typeof template.usage_count).toBe('number');
      });
    });
  });
});
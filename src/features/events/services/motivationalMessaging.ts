import {
  MotivationalMessage,
  MessageCategory,
  PersonalizedMessage,
  MessageContext
} from '@features/events/types/social.types';
import { Achievement } from '@features/events/types/engagement.types';
import { Timestamp } from 'firebase/firestore';

/**
 * Motivational Messaging System Service
 * Handles pre-defined templates, personalization, and encouraging message sending
 */
export class MotivationalMessagingSystem {
  private messageTemplates: Map<MessageCategory, MotivationalMessage[]> = new Map();
  private sentMessages: Map<string, PersonalizedMessage[]> = new Map();

  constructor() {
    this.initializeMessageTemplates();
  }

  /**
   * Get motivational message templates by category
   */
  async getMessageTemplates(category?: MessageCategory, sport?: string): Promise<MotivationalMessage[]> {
    if (category) {
      const templates = this.messageTemplates.get(category) || [];
      return sport ? templates.filter(t => !t.sport || t.sport === sport) : templates;
    }

    // Return all templates
    const allTemplates: MotivationalMessage[] = [];
    this.messageTemplates.forEach(templates => allTemplates.push(...templates));
    return sport ? allTemplates.filter(t => !t.sport || t.sport === sport) : allTemplates;
  }

  /**
   * Send personalized motivational message
   */
  async sendMotivationalMessage(
    fromUserId: string,
    toUserId: string,
    templateId: string,
    context: MessageContext,
    customVariables?: { [key: string]: string }
  ): Promise<PersonalizedMessage> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Personalize the message
    const personalizedContent = await this.personalizeMessage(
      template,
      toUserId,
      context,
      customVariables
    );

    const message: PersonalizedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      fromUserId,
      toUserId,
      templateId,
      content: personalizedContent,
      context,
      sentAt: Timestamp.now()
    };

    // Store the message
    const userMessages = this.sentMessages.get(toUserId) || [];
    userMessages.push(message);
    this.sentMessages.set(toUserId, userMessages);

    // Update template usage count
    template.usage_count++;

    return message;
  }

  /**
   * Get personalized messages for a user
   */
  async getUserMessages(userId: string, limit?: number): Promise<PersonalizedMessage[]> {
    const messages = this.sentMessages.get(userId) || [];
    const sortedMessages = messages.sort((a, b) => b.sentAt.toMillis() - a.sentAt.toMillis());
    return limit ? sortedMessages.slice(0, limit) : sortedMessages;
  }

  /**
   * Generate achievement-based motivational message
   */
  async generateAchievementMessage(
    fromUserId: string,
    toUserId: string,
    achievement: Achievement
  ): Promise<PersonalizedMessage> {
    const templates = await this.getMessageTemplates(MessageCategory.CONGRATULATIONS);
    const template = templates[Math.floor(Math.random() * templates.length)];

    const context: MessageContext = {
      achievementId: achievement.id,
      type: 'achievement'
    };

    return this.sendMotivationalMessage(
      fromUserId,
      toUserId,
      template.id,
      context,
      {
        achievementName: achievement.name,
        achievementDescription: achievement.description
      }
    );
  }

  /**
   * Generate participation encouragement message
   */
  async generateParticipationMessage(
    fromUserId: string,
    toUserId: string,
    eventId: string,
    sport?: string
  ): Promise<PersonalizedMessage> {
    const templates = await this.getMessageTemplates(MessageCategory.ENCOURAGEMENT, sport);
    const template = templates[Math.floor(Math.random() * templates.length)];

    const context: MessageContext = {
      eventId,
      type: 'participation'
    };

    return this.sendMotivationalMessage(fromUserId, toUserId, template.id, context);
  }

  /**
   * Generate support message
   */
  async generateSupportMessage(
    fromUserId: string,
    toUserId: string,
    eventId?: string,
    challengeId?: string
  ): Promise<PersonalizedMessage> {
    const templates = await this.getMessageTemplates(MessageCategory.SUPPORT);
    const template = templates[Math.floor(Math.random() * templates.length)];

    const context: MessageContext = {
      eventId,
      challengeId,
      type: 'support'
    };

    return this.sendMotivationalMessage(fromUserId, toUserId, template.id, context);
  }

  /**
   * Get trending message templates
   */
  async getTrendingTemplates(limit: number = 10): Promise<MotivationalMessage[]> {
    const allTemplates: MotivationalMessage[] = [];
    this.messageTemplates.forEach(templates => allTemplates.push(...templates));

    return allTemplates
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const userMessages = this.sentMessages.get(userId) || [];
    const message = userMessages.find(m => m.id === messageId);
    if (message) {
      message.readAt = Timestamp.now();
    }
  }

  /**
   * Get template by ID
   */
  private async getTemplateById(templateId: string): Promise<MotivationalMessage | null> {
    for (const templates of this.messageTemplates.values()) {
      const template = templates.find(t => t.id === templateId);
      if (template) return template;
    }
    return null;
  }

  /**
   * Personalize message content with variables
   */
  private async personalizeMessage(
    template: MotivationalMessage,
    toUserId: string,
    context: MessageContext,
    customVariables?: { [key: string]: string }
  ): Promise<string> {
    let content = template.template;

    // Default variables
    const variables: { [key: string]: string } = {
      userName: await this.getUserName(toUserId),
      sport: template.sport || 'sport',
      ...customVariables
    };

    // Replace template variables
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      content = content.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    return content;
  }

  /**
   * Get user name (mock implementation)
   */
  private async getUserName(userId: string): Promise<string> {
    // In a real implementation, this would fetch from user service
    return `Athlete${userId.slice(-4)}`;
  }

  /**
   * Initialize message templates
   */
  private initializeMessageTemplates(): void {
    const templates = {
      [MessageCategory.ENCOURAGEMENT]: [
        {
          id: 'enc_001',
          template: "Hey {userName}! 🌟 You've got this! Every champion started with a single step. Keep pushing forward in {sport}!",
          category: MessageCategory.ENCOURAGEMENT,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'enc_002',
          template: "Don't give up, {userName}! 💪 Your dedication to {sport} is inspiring. Remember, progress isn't always visible, but it's always happening!",
          category: MessageCategory.ENCOURAGEMENT,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'enc_003',
          template: "{userName}, you're stronger than you think! 🔥 Every training session in {sport} is building the champion within you!",
          category: MessageCategory.ENCOURAGEMENT,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'enc_basketball',
          template: "Shoot for the stars, {userName}! 🏀 Every missed shot is just practice for the game-winner. Keep hooping!",
          category: MessageCategory.ENCOURAGEMENT,
          sport: 'basketball',
          variables: ['userName'],
          usage_count: 0
        },
        {
          id: 'enc_soccer',
          template: "Keep running, {userName}! ⚽ The beautiful game rewards those who never stop believing. Your breakthrough is coming!",
          category: MessageCategory.ENCOURAGEMENT,
          sport: 'soccer',
          variables: ['userName'],
          usage_count: 0
        }
      ],
      [MessageCategory.CONGRATULATIONS]: [
        {
          id: 'cong_001',
          template: "🎉 Incredible work, {userName}! You've earned the '{achievementName}' achievement! {achievementDescription} - you should be proud!",
          category: MessageCategory.CONGRATULATIONS,
          variables: ['userName', 'achievementName', 'achievementDescription'],
          usage_count: 0
        },
        {
          id: 'cong_002',
          template: "🏆 Amazing achievement, {userName}! '{achievementName}' is well-deserved. Your hard work is paying off!",
          category: MessageCategory.CONGRATULATIONS,
          variables: ['userName', 'achievementName'],
          usage_count: 0
        },
        {
          id: 'cong_003',
          template: "🌟 Congratulations {userName}! You've unlocked '{achievementName}' - that's the mark of a true athlete!",
          category: MessageCategory.CONGRATULATIONS,
          variables: ['userName', 'achievementName'],
          usage_count: 0
        }
      ],
      [MessageCategory.MOTIVATION]: [
        {
          id: 'mot_001',
          template: "Remember {userName}, champions aren't made in comfort zones! 🚀 Push your limits in {sport} and watch yourself soar!",
          category: MessageCategory.MOTIVATION,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'mot_002',
          template: "The only impossible journey is the one you never begin, {userName}! 💫 Your {sport} journey is just getting started!",
          category: MessageCategory.MOTIVATION,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'mot_003',
          template: "Success in {sport} isn't about being perfect, {userName}. It's about being persistent! Keep going! 🔥",
          category: MessageCategory.MOTIVATION,
          variables: ['userName', 'sport'],
          usage_count: 0
        }
      ],
      [MessageCategory.SUPPORT]: [
        {
          id: 'sup_001',
          template: "We're all rooting for you, {userName}! 🤝 The community believes in your potential. You're not alone in this journey!",
          category: MessageCategory.SUPPORT,
          variables: ['userName'],
          usage_count: 0
        },
        {
          id: 'sup_002',
          template: "Tough times don't last, but tough athletes do, {userName}! 💪 We're here to support you every step of the way!",
          category: MessageCategory.SUPPORT,
          variables: ['userName'],
          usage_count: 0
        },
        {
          id: 'sup_003',
          template: "Hey {userName}, remember that every pro was once an amateur. Every expert was once a beginner. You've got this! 🌟",
          category: MessageCategory.SUPPORT,
          variables: ['userName'],
          usage_count: 0
        }
      ],
      [MessageCategory.CELEBRATION]: [
        {
          id: 'cel_001',
          template: "🎊 Party time, {userName}! Your success deserves to be celebrated! You've made the entire {sport} community proud!",
          category: MessageCategory.CELEBRATION,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'cel_002',
          template: "🥳 What an incredible moment, {userName}! This is what dedication looks like! Time to celebrate your {sport} success!",
          category: MessageCategory.CELEBRATION,
          variables: ['userName', 'sport'],
          usage_count: 0
        },
        {
          id: 'cel_003',
          template: "🎉 Victory tastes sweet, doesn't it {userName}? You've earned every bit of this celebration! Keep shining in {sport}!",
          category: MessageCategory.CELEBRATION,
          variables: ['userName', 'sport'],
          usage_count: 0
        }
      ]
    };

    Object.entries(templates).forEach(([category, templateList]) => {
      this.messageTemplates.set(category as MessageCategory, templateList);
    });
  }
}

// Export singleton instance
export const motivationalMessagingSystem = new MotivationalMessagingSystem();
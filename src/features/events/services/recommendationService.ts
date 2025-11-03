import { Timestamp } from 'firebase/firestore';
import { Event, EnhancedEvent } from '@features/events/types/event.types';
import { AthleteProfile, UserPreferences, UserInsights, Goal, PredictedAchievement, SkillPrediction, PerformanceTrend, EngagementPattern, TimeSlot, NetworkMetric } from '@features/events/types/user.types';
import { eventService } from '@features/events/services/eventService';

// User interaction tracking types
export interface UserInteraction {
  userId: string;
  eventId: string;
  type: InteractionType;
  timestamp: Timestamp;
  duration?: number; // in seconds
  metadata?: any;
}

export enum InteractionType {
  VIEW = 'view',
  PARTICIPATE = 'participate',
  REACT = 'react',
  COMMENT = 'comment',
  SHARE = 'share',
  BOOKMARK = 'bookmark',
  SKIP = 'skip',
  COMPLETE = 'complete'
}

// Recommendation types
export interface EventRecommendation {
  event: Event;
  score: number;
  reasons: RecommendationReason[];
  confidence: number;
}

export interface RecommendationReason {
  type: ReasonType;
  description: string;
  weight: number;
}

export enum ReasonType {
  SPORT_PREFERENCE = 'sport_preference',
  SKILL_LEVEL_MATCH = 'skill_level_match',
  LOCATION_PROXIMITY = 'location_proximity',
  PAST_PARTICIPATION = 'past_participation',
  SOCIAL_CONNECTION = 'social_connection',
  TRENDING = 'trending',
  TIME_PREFERENCE = 'time_preference',
  ACHIEVEMENT_OPPORTUNITY = 'achievement_opportunity',
  SIMILAR_USERS = 'similar_users'
}

// Learning system types
export interface UserPreferenceProfile {
  userId: string;
  sportPreferences: { [sport: string]: number }; // sport -> preference score (0-1)
  locationPreferences: { [location: string]: number };
  timePreferences: TimeSlot[];
  skillLevelPreferences: { [level: string]: number };
  eventTypePreferences: { [type: string]: number };
  socialPreferences: {
    mentorshipInterest: number;
    teamParticipation: number;
    competitiveEvents: number;
  };
  lastUpdated: Timestamp;
}

// Storage keys
const INTERACTIONS_KEY = 'user_interactions';
const PREFERENCES_KEY = 'user_preferences';
const RECOMMENDATIONS_KEY = 'cached_recommendations';

class RecommendationService {
  private interactionWeights = {
    [InteractionType.VIEW]: 0.1,
    [InteractionType.PARTICIPATE]: 1.0,
    [InteractionType.REACT]: 0.3,
    [InteractionType.COMMENT]: 0.5,
    [InteractionType.SHARE]: 0.7,
    [InteractionType.BOOKMARK]: 0.8,
    [InteractionType.SKIP]: -0.2,
    [InteractionType.COMPLETE]: 1.2
  };

  /**
   * Track user interaction with events
   */
  async trackUserInteraction(interaction: UserInteraction): Promise<void> {
    try {
      const interactions = this.getStoredInteractions();
      interactions.push(interaction);
      
      // Keep only last 1000 interactions per user to manage storage
      const userInteractions = interactions.filter(i => i.userId === interaction.userId);
      if (userInteractions.length > 1000) {
        const otherInteractions = interactions.filter(i => i.userId !== interaction.userId);
        const recentUserInteractions = userInteractions
          .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
          .slice(0, 1000);
        localStorage.setItem(INTERACTIONS_KEY, JSON.stringify([...otherInteractions, ...recentUserInteractions]));
      } else {
        localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
      }

      // Update user preferences based on interaction
      await this.updateUserPreferences(interaction);
    } catch (error) {
      console.error('Failed to track user interaction:', error);
    }
  }

  /**
   * Get personalized event recommendations for a user
   */
  async getPersonalizedEvents(userId: string, limit: number = 10): Promise<EventRecommendation[]> {
    try {
      // Check cache first
      const cached = this.getCachedRecommendations(userId);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.recommendations.slice(0, limit);
      }

      // Get user profile and preferences
      const userProfile = await this.getUserPreferenceProfile(userId);
      const allEvents = await eventService.getEvents({ category: 'upcoming' as any });

      // Calculate recommendation scores for each event
      const recommendations: EventRecommendation[] = [];

      for (const event of allEvents) {
        const score = await this.calculateRecommendationScore(userId, event, userProfile);
        const reasons = this.generateRecommendationReasons(event, userProfile, score);
        const confidence = this.calculateConfidence(reasons, userProfile);

        recommendations.push({
          event,
          score,
          reasons,
          confidence
        });
      }

      // Sort by score and return top recommendations
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache recommendations
      this.cacheRecommendations(userId, sortedRecommendations);

      return sortedRecommendations;
    } catch (error) {
      console.error('Failed to get personalized events:', error);
      // Fallback to trending events
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Update user preferences based on interactions
   */
  async updateUserPreferences(interaction: UserInteraction): Promise<void> {
    try {
      const event = await eventService.getEventById(interaction.eventId);
      const userProfile = await this.getUserPreferenceProfile(interaction.userId);

      const weight = this.interactionWeights[interaction.type];
      const learningRate = 0.1; // How quickly preferences adapt

      // Update sport preferences
      const currentSportPref = userProfile.sportPreferences[event.sport] || 0.5;
      userProfile.sportPreferences[event.sport] = Math.max(0, Math.min(1, 
        currentSportPref + (weight * learningRate)
      ));

      // Update location preferences
      const currentLocationPref = userProfile.locationPreferences[event.location] || 0.5;
      userProfile.locationPreferences[event.location] = Math.max(0, Math.min(1,
        currentLocationPref + (weight * learningRate)
      ));

      // Update event type preferences
      const currentTypePref = userProfile.eventTypePreferences[event.eventType] || 0.5;
      userProfile.eventTypePreferences[event.eventType] = Math.max(0, Math.min(1,
        currentTypePref + (weight * learningRate)
      ));

      // Update time preferences based on event timing
      this.updateTimePreferences(userProfile, event, weight);

      userProfile.lastUpdated = Timestamp.now();
      this.saveUserPreferenceProfile(userProfile);
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }

  /**
   * Generate user insights and analytics
   */
  async generateUserInsights(userId: string): Promise<UserInsights> {
    try {
      const interactions = this.getUserInteractions(userId);
      const userProfile = await this.getUserPreferenceProfile(userId);
      
      return {
        userId,
        generatedAt: Timestamp.now(),
        performanceTrends: this.analyzePerformanceTrends(interactions),
        strengthAreas: this.identifyStrengthAreas(userProfile),
        improvementAreas: this.identifyImprovementAreas(userProfile),
        engagementPatterns: this.analyzeEngagementPatterns(interactions),
        peakActivityTimes: this.identifyPeakActivityTimes(interactions),
        preferredEventTypes: this.getPreferredEventTypes(userProfile),
        networkGrowth: this.analyzeNetworkGrowth(userId),
        influenceScore: this.calculateInfluenceScore(interactions),
        collaborationStyle: this.determineCollaborationStyle(interactions),
        suggestedGoals: await this.generateGoalSuggestions(userId, userProfile),
        recommendedEvents: (await this.getPersonalizedEvents(userId, 5)).map(r => r.event.id),
        potentialMentors: await this.findPotentialMentors(userId),
        nextAchievements: this.predictNextAchievements(userId, interactions),
        skillProgression: this.predictSkillProgression(userId, userProfile)
      };
    } catch (error) {
      console.error('Failed to generate user insights:', error);
      throw error;
    }
  }

  /**
   * Calculate recommendation score for an event
   */
  private async calculateRecommendationScore(
    userId: string, 
    event: Event, 
    userProfile: UserPreferenceProfile
  ): Promise<number> {
    let score = 0;

    // Sport preference (30% weight)
    const sportPref = userProfile.sportPreferences[event.sport] || 0.5;
    score += sportPref * 0.3;

    // Location preference (20% weight)
    const locationPref = userProfile.locationPreferences[event.location] || 0.5;
    score += locationPref * 0.2;

    // Event type preference (15% weight)
    const typePref = userProfile.eventTypePreferences[event.eventType] || 0.5;
    score += typePref * 0.15;

    // Time preference (10% weight)
    const timePref = this.calculateTimePreference(userProfile, event);
    score += timePref * 0.1;

    // Social factors (15% weight)
    const socialScore = this.calculateSocialScore(userId, event);
    score += socialScore * 0.15;

    // Trending factor (5% weight)
    const trendingScore = event.isTrending ? 1 : 0.5;
    score += trendingScore * 0.05;

    // Novelty factor (5% weight) - prefer events user hasn't seen
    const noveltyScore = await this.calculateNoveltyScore(userId, event);
    score += noveltyScore * 0.05;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate reasons for recommendation
   */
  private generateRecommendationReasons(
    event: Event, 
    userProfile: UserPreferenceProfile, 
    score: number
  ): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];

    // Sport preference reason
    const sportPref = userProfile.sportPreferences[event.sport] || 0.5;
    if (sportPref > 0.7) {
      reasons.push({
        type: ReasonType.SPORT_PREFERENCE,
        description: `You frequently engage with ${event.sport} events`,
        weight: sportPref
      });
    }

    // Location reason
    const locationPref = userProfile.locationPreferences[event.location] || 0.5;
    if (locationPref > 0.6) {
      reasons.push({
        type: ReasonType.LOCATION_PROXIMITY,
        description: `You often participate in events at ${event.location}`,
        weight: locationPref
      });
    }

    // Trending reason
    if (event.isTrending) {
      reasons.push({
        type: ReasonType.TRENDING,
        description: 'This event is currently trending',
        weight: 0.8
      });
    }

    // Time preference reason
    const timePref = this.calculateTimePreference(userProfile, event);
    if (timePref > 0.7) {
      reasons.push({
        type: ReasonType.TIME_PREFERENCE,
        description: 'This event is scheduled at your preferred time',
        weight: timePref
      });
    }

    return reasons;
  }

  /**
   * Calculate confidence in recommendation
   */
  private calculateConfidence(reasons: RecommendationReason[], userProfile: UserPreferenceProfile): number {
    if (reasons.length === 0) return 0.3;

    const avgWeight = reasons.reduce((sum, reason) => sum + reason.weight, 0) / reasons.length;
    const dataQuality = this.assessDataQuality(userProfile);
    
    return Math.min(1, avgWeight * dataQuality);
  }

  /**
   * Get user preference profile
   */
  private async getUserPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    const profiles = stored ? JSON.parse(stored) : {};
    
    if (profiles[userId]) {
      const stored = profiles[userId];
      return {
        ...stored,
        lastUpdated: stored.lastUpdated?.seconds
          ? new Timestamp(stored.lastUpdated.seconds, stored.lastUpdated.nanoseconds)
          : Timestamp.fromMillis(new Date(stored.lastUpdated).getTime())
      };
    }

    // Create default profile
    const defaultProfile: UserPreferenceProfile = {
      userId,
      sportPreferences: {},
      locationPreferences: {},
      timePreferences: [],
      skillLevelPreferences: {},
      eventTypePreferences: {},
      socialPreferences: {
        mentorshipInterest: 0.5,
        teamParticipation: 0.5,
        competitiveEvents: 0.5
      },
      lastUpdated: Timestamp.now()
    };

    profiles[userId] = defaultProfile;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(profiles));
    
    return defaultProfile;
  }

  /**
   * Save user preference profile
   */
  private saveUserPreferenceProfile(profile: UserPreferenceProfile): void {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    const profiles = stored ? JSON.parse(stored) : {};
    profiles[profile.userId] = profile;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(profiles));
  }

  /**
   * Get stored interactions
   */
  private getStoredInteractions(): UserInteraction[] {
    const stored = localStorage.getItem(INTERACTIONS_KEY);
    if (!stored) return [];

    return JSON.parse(stored).map((interaction: any) => ({
      ...interaction,
      timestamp: interaction.timestamp?.seconds
        ? new Timestamp(interaction.timestamp.seconds, interaction.timestamp.nanoseconds)
        : Timestamp.fromMillis(new Date(interaction.timestamp).getTime())
    }));
  }

  /**
   * Get user interactions
   */
  private getUserInteractions(userId: string): UserInteraction[] {
    return this.getStoredInteractions().filter(i => i.userId === userId);
  }

  /**
   * Update time preferences
   */
  private updateTimePreferences(profile: UserPreferenceProfile, event: Event, weight: number): void {
    const eventDate = event.startDate.toDate();
    const eventHour = eventDate.getHours();
    const eventDay = eventDate.getDay();

    // Find existing time slot or create new one
    let timeSlot = profile.timePreferences.find(t => t.hour === eventHour && t.dayOfWeek === eventDay);
    
    if (!timeSlot) {
      timeSlot = { hour: eventHour, dayOfWeek: eventDay, activityLevel: 0.5 };
      profile.timePreferences.push(timeSlot);
    }

    // Update activity level
    const learningRate = 0.1;
    timeSlot.activityLevel = Math.max(0, Math.min(1, 
      timeSlot.activityLevel + (weight * learningRate)
    ));
  }

  /**
   * Calculate time preference for an event
   */
  private calculateTimePreference(profile: UserPreferenceProfile, event: Event): number {
    const eventDate = event.startDate.toDate();
    const eventHour = eventDate.getHours();
    const eventDay = eventDate.getDay();

    const timeSlot = profile.timePreferences.find(t => t.hour === eventHour && t.dayOfWeek === eventDay);
    return timeSlot ? timeSlot.activityLevel : 0.5;
  }

  /**
   * Calculate social score for an event
   */
  private calculateSocialScore(userId: string, event: Event): number {
    // This would integrate with social features like friends attending, mentorship opportunities, etc.
    // For now, return a base score
    return 0.5;
  }

  /**
   * Calculate novelty score
   */
  private async calculateNoveltyScore(userId: string, event: Event): Promise<number> {
    const interactions = this.getUserInteractions(userId);
    const hasInteracted = interactions.some(i => i.eventId === event.id);
    return hasInteracted ? 0.3 : 1.0;
  }

  /**
   * Cache recommendations
   */
  private cacheRecommendations(userId: string, recommendations: EventRecommendation[]): void {
    const cached = {
      userId,
      recommendations,
      timestamp: Timestamp.now()
    };
    
    const stored = localStorage.getItem(RECOMMENDATIONS_KEY);
    const cache = stored ? JSON.parse(stored) : {};
    cache[userId] = cached;
    localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(cache));
  }

  /**
   * Get cached recommendations
   */
  private getCachedRecommendations(userId: string): { recommendations: EventRecommendation[], timestamp: Timestamp } | null {
    const stored = localStorage.getItem(RECOMMENDATIONS_KEY);
    if (!stored) return null;
    
    const cache = JSON.parse(stored);
    const cached = cache[userId];

    if (!cached) return null;

    return {
      ...cached,
      timestamp: cached.timestamp?.seconds
        ? new Timestamp(cached.timestamp.seconds, cached.timestamp.nanoseconds)
        : Timestamp.fromMillis(new Date(cached.timestamp).getTime())
    };
  }

  /**
   * Check if cache is valid (30 minutes)
   */
  private isCacheValid(timestamp: Timestamp): boolean {
    const now = Timestamp.now();
    const diffMinutes = (now.toMillis() - timestamp.toMillis()) / (1000 * 60);
    return diffMinutes < 30;
  }

  /**
   * Get fallback recommendations
   */
  private async getFallbackRecommendations(limit: number): Promise<EventRecommendation[]> {
    try {
      const events = await eventService.getEvents({ category: 'upcoming' as any });
      return events.slice(0, limit).map(event => ({
        event,
        score: 0.5,
        reasons: [{ type: ReasonType.TRENDING, description: 'Popular event', weight: 0.5 }],
        confidence: 0.3
      }));
    } catch (error) {
      return [];
    }
  }

  // Analytics and insights methods
  private analyzePerformanceTrends(interactions: UserInteraction[]): PerformanceTrend[] {
    // Analyze user engagement trends over time
    const trends: PerformanceTrend[] = [];
    
    // Group interactions by week
    const weeklyData = this.groupInteractionsByWeek(interactions);
    
    if (weeklyData.length >= 2) {
      const recent = weeklyData[weeklyData.length - 1];
      const previous = weeklyData[weeklyData.length - 2];
      
      const changePercentage = ((recent.count - previous.count) / previous.count) * 100;
      
      trends.push({
        metric: 'engagement',
        period: 'week',
        trend: changePercentage > 5 ? 'improving' : changePercentage < -5 ? 'declining' : 'stable',
        changePercentage,
        insights: [
          changePercentage > 10 ? 'Your engagement is significantly increasing' :
          changePercentage < -10 ? 'Your engagement has decreased recently' :
          'Your engagement level is stable'
        ]
      });
    }
    
    return trends;
  }

  private identifyStrengthAreas(profile: UserPreferenceProfile): string[] {
    const strengths: string[] = [];
    
    // Find sports with high preference scores
    Object.entries(profile.sportPreferences).forEach(([sport, score]) => {
      if (score > 0.7) {
        strengths.push(sport);
      }
    });
    
    return strengths;
  }

  private identifyImprovementAreas(profile: UserPreferenceProfile): string[] {
    const improvements: string[] = [];
    
    // Find areas with low engagement
    if (profile.socialPreferences.mentorshipInterest < 0.3) {
      improvements.push('Mentorship engagement');
    }
    
    if (profile.socialPreferences.teamParticipation < 0.3) {
      improvements.push('Team collaboration');
    }
    
    return improvements;
  }

  private analyzeEngagementPatterns(interactions: UserInteraction[]): EngagementPattern[] {
    const patterns: EngagementPattern[] = [];
    
    // Analyze interaction types
    const typeFrequency = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(typeFrequency).forEach(([type, frequency]) => {
      if (frequency > 5) {
        patterns.push({
          pattern: `Frequent ${type} interactions`,
          frequency,
          impact: frequency > 20 ? 'high' : frequency > 10 ? 'medium' : 'low',
          recommendation: `Continue engaging through ${type} to maintain momentum`
        });
      }
    });
    
    return patterns;
  }

  private identifyPeakActivityTimes(interactions: UserInteraction[]): TimeSlot[] {
    const timeSlots: { [key: string]: number } = {};

    interactions.forEach(interaction => {
      const date = interaction.timestamp.toDate();
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${day}-${hour}`;
      timeSlots[key] = (timeSlots[key] || 0) + 1;
    });
    
    return Object.entries(timeSlots)
      .map(([key, count]) => {
        const [day, hour] = key.split('-').map(Number);
        return {
          hour,
          dayOfWeek: day,
          activityLevel: count
        };
      })
      .sort((a, b) => b.activityLevel - a.activityLevel)
      .slice(0, 5);
  }

  private getPreferredEventTypes(profile: UserPreferenceProfile): string[] {
    return Object.entries(profile.eventTypePreferences)
      .filter(([_, score]) => score > 0.6)
      .sort(([_, a], [__, b]) => b - a)
      .map(([type, _]) => type);
  }

  private analyzeNetworkGrowth(userId: string): NetworkMetric[] {
    // Mock network growth data - in real implementation, this would come from social features
    const now = Timestamp.now();
    return Array.from({ length: 30 }, (_, i) => ({
      date: Timestamp.fromMillis(now.toMillis() - (29 - i) * 24 * 60 * 60 * 1000),
      followers: Math.floor(Math.random() * 10) + i,
      following: Math.floor(Math.random() * 5) + i,
      connections: Math.floor(Math.random() * 3) + i,
      influence: Math.random() * 100
    }));
  }

  private calculateInfluenceScore(interactions: UserInteraction[]): number {
    const shareWeight = 3;
    const commentWeight = 2;
    const reactionWeight = 1;
    
    const score = interactions.reduce((total, interaction) => {
      switch (interaction.type) {
        case InteractionType.SHARE: return total + shareWeight;
        case InteractionType.COMMENT: return total + commentWeight;
        case InteractionType.REACT: return total + reactionWeight;
        default: return total;
      }
    }, 0);
    
    return Math.min(100, score);
  }

  private determineCollaborationStyle(interactions: UserInteraction[]): string {
    const participateCount = interactions.filter(i => i.type === InteractionType.PARTICIPATE).length;
    const commentCount = interactions.filter(i => i.type === InteractionType.COMMENT).length;
    const shareCount = interactions.filter(i => i.type === InteractionType.SHARE).length;
    
    if (shareCount > participateCount && shareCount > commentCount) {
      return 'Connector - You love sharing and connecting others';
    } else if (commentCount > participateCount) {
      return 'Communicator - You engage through discussions';
    } else {
      return 'Participant - You prefer direct involvement';
    }
  }

  private async generateGoalSuggestions(userId: string, profile: UserPreferenceProfile): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    // Suggest goals based on preferences and activity
    const topSports = Object.entries(profile.sportPreferences)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);
    
    topSports.forEach(([sport, score], index) => {
      goals.push({
        id: `goal_${userId}_${sport}_${index}`,
        title: `Participate in 5 ${sport} events`,
        description: `Join 5 ${sport} events this month to improve your skills`,
        category: 'participation',
        targetValue: 5,
        currentValue: 0,
        deadline: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
        estimatedTime: '1 month'
      });
    });
    
    return goals;
  }

  private async findPotentialMentors(userId: string): Promise<string[]> {
    // Mock mentor suggestions - in real implementation, this would use mentorship system
    return ['mentor_1', 'mentor_2', 'mentor_3'];
  }

  private predictNextAchievements(userId: string, interactions: UserInteraction[]): PredictedAchievement[] {
    const predictions: PredictedAchievement[] = [];
    
    const participationCount = interactions.filter(i => i.type === InteractionType.PARTICIPATE).length;
    
    if (participationCount >= 8) {
      predictions.push({
        achievementId: 'participation_10',
        name: 'Event Enthusiast',
        probability: 0.8,
        estimatedDate: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requiredActions: ['Participate in 2 more events']
      });
    }
    
    return predictions;
  }

  private predictSkillProgression(userId: string, profile: UserPreferenceProfile): SkillPrediction[] {
    const predictions: SkillPrediction[] = [];
    
    Object.entries(profile.sportPreferences).forEach(([sport, score]) => {
      if (score > 0.7) {
        predictions.push({
          sport,
          currentLevel: 'intermediate' as any,
          predictedLevel: 'advanced' as any,
          timeframe: '3 months',
          confidence: score,
          factors: ['High engagement', 'Consistent participation']
        });
      }
    });
    
    return predictions;
  }

  private groupInteractionsByWeek(interactions: UserInteraction[]): { week: number, count: number }[] {
    const weeklyData: { [week: number]: number } = {};

    interactions.forEach(interaction => {
      const week = this.getWeekNumber(interaction.timestamp.toDate());
      weeklyData[week] = (weeklyData[week] || 0) + 1;
    });
    
    return Object.entries(weeklyData).map(([week, count]) => ({
      week: parseInt(week),
      count
    }));
  }

  private getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  }

  private assessDataQuality(profile: UserPreferenceProfile): number {
    let quality = 0;
    
    // Check if we have enough data points
    const sportCount = Object.keys(profile.sportPreferences).length;
    const locationCount = Object.keys(profile.locationPreferences).length;
    const timeSlotCount = profile.timePreferences.length;
    
    quality += Math.min(1, sportCount / 5) * 0.4; // Up to 40% for sport data
    quality += Math.min(1, locationCount / 3) * 0.3; // Up to 30% for location data
    quality += Math.min(1, timeSlotCount / 10) * 0.3; // Up to 30% for time data
    
    return quality;
  }

  /**
   * Clear all stored data (for testing)
   */
  clearAllData(): void {
    localStorage.removeItem(INTERACTIONS_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(RECOMMENDATIONS_KEY);
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
export default recommendationService;
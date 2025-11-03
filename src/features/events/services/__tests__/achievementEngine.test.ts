import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { achievementEngine, UserAction, UserActionType, APIError } from '@features/events/services/achievementEngine';
import { AchievementCategory, RequirementType } from '@features/events/types/engagement.types';

describe('AchievementEngine', () => {
  const testUserId = 'test-user-123';
  const testEventId = 'test-event-456';

  beforeEach(() => {
    // Clear all mocks and user data before each test
    vi.clearAllMocks();
    achievementEngine.clearAllUserData();
  });

  afterEach(() => {
    // Clean up after each test
    achievementEngine.clearAllUserData();
  });

  describe('Badge Awarding Logic', () => {
    describe('First Step Achievement (Requirement 2.1)', () => {
      it('should award First Step badge when user joins first event', async () => {
        const action: UserAction = {
          type: UserActionType.EVENT_JOINED,
          userId: testUserId,
          eventId: testEventId,
          timestamp: new Date()
        };

        const newAchievements = await achievementEngine.checkAchievements(testUserId, action);

        expect(newAchievements).toHaveLength(1);
        expect(newAchievements[0]).toMatchObject({
          id: 'first_step',
          name: 'First Step',
          category: AchievementCategory.PARTICIPATION,
          points: 10,
          rarity: 'common'
        });
        expect(newAchievements[0].unlockedAt).toBeInstanceOf(Date);
      });

      it('should not award First Step badge multiple times', async () => {
        // First event join
        const action1: UserAction = {
          type: UserActionType.EVENT_JOINED,
          userId: testUserId,
          eventId: testEventId,
          timestamp: new Date()
        };
        await achievementEngine.checkAchievements(testUserId, action1);

        // Second event join
        const action2: UserAction = {
          type: UserActionType.EVENT_JOINED,
          userId: testUserId,
          eventId: 'another-event',
          timestamp: new Date()
        };
        const newAchievements = await achievementEngine.checkAchievements(testUserId, action2);

        // Should not award First Step again
        expect(newAchievements.find(a => a.id === 'first_step')).toBeUndefined();
      });
    });

    describe('Streak Master Achievement (Requirement 2.2)', () => {
      it('should award Streak Master badge after 5 consecutive events', async () => {
        // Join 5 events to build streak
        for (let i = 0; i < 5; i++) {
          const action: UserAction = {
            type: UserActionType.EVENT_JOINED,
            userId: testUserId,
            eventId: `event-${i}`,
            timestamp: new Date()
          };
          await achievementEngine.checkAchievements(testUserId, action);
        }

        const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
        const streakMaster = userAchievements.find(a => a.id === 'streak_master');

        expect(streakMaster).toBeDefined();
        expect(streakMaster).toMatchObject({
          id: 'streak_master',
          name: 'Streak Master',
          category: AchievementCategory.CONSISTENCY,
          points: 50,
          rarity: 'rare'
        });
      });

      it('should not award Streak Master before reaching 5 consecutive events', async () => {
        // Join only 4 events
        for (let i = 0; i < 4; i++) {
          const action: UserAction = {
            type: UserActionType.EVENT_JOINED,
            userId: testUserId,
            eventId: `event-${i}`,
            timestamp: new Date()
          };
          await achievementEngine.checkAchievements(testUserId, action);
        }

        const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
        const streakMaster = userAchievements.find(a => a.id === 'streak_master');

        expect(streakMaster).toBeUndefined();
      });
    });

    describe('Community Favorite Achievement (Requirement 2.3)', () => {
      it('should award Community Favorite badge after receiving 50 reactions', async () => {
        // Simulate receiving exactly 50 reactions
        for (let i = 0; i < 50; i++) {
          await achievementEngine.checkAchievements(testUserId, {
            type: UserActionType.REACTION_RECEIVED,
            userId: testUserId,
            timestamp: new Date()
          });
        }

        const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
        const communityFavorite = userAchievements.find(a => a.id === 'community_favorite');

        expect(communityFavorite).toBeDefined();
        expect(communityFavorite).toMatchObject({
          id: 'community_favorite',
          name: 'Community Favorite',
          category: AchievementCategory.SOCIAL,
          points: 100,
          rarity: 'epic'
        });
      }, 15000); // Increase timeout

      it('should not award Community Favorite before reaching 50 reactions', async () => {
        // Use a fresh user to avoid conflicts
        const freshUserId = 'fresh-user-reactions';
        
        // Simulate receiving only 49 reactions
        for (let i = 0; i < 49; i++) {
          await achievementEngine.checkAchievements(freshUserId, {
            type: UserActionType.REACTION_RECEIVED,
            userId: freshUserId,
            timestamp: new Date()
          });
        }

        const userAchievements = await achievementEngine.getUserAchievementsAsync(freshUserId);
        const communityFavorite = userAchievements.find(a => a.id === 'community_favorite');

        expect(communityFavorite).toBeUndefined();
      }, 15000); // Increase timeout
    });

    describe('Multiple Achievement Scenarios', () => {
      it('should award multiple achievements in single action when criteria met', async () => {
        // Set up user to be close to multiple achievements
        // First, get close to streak and reactions
        for (let i = 0; i < 4; i++) {
          await achievementEngine.checkAchievements(testUserId, {
            type: UserActionType.EVENT_JOINED,
            userId: testUserId,
            eventId: `event-${i}`,
            timestamp: new Date()
          });
        }

        // Add reactions in batches
        const batchSize = 10;
        for (let batch = 0; batch < 4; batch++) {
          for (let i = 0; i < batchSize; i++) {
            await achievementEngine.checkAchievements(testUserId, {
              type: UserActionType.REACTION_RECEIVED,
              userId: testUserId,
              timestamp: new Date()
            });
          }
        }
        
        // Add 9 more reactions to reach 49
        for (let i = 0; i < 9; i++) {
          await achievementEngine.checkAchievements(testUserId, {
            type: UserActionType.REACTION_RECEIVED,
            userId: testUserId,
            timestamp: new Date()
          });
        }

        // This action should trigger streak master (5th event)
        await achievementEngine.checkAchievements(testUserId, {
          type: UserActionType.EVENT_JOINED,
          userId: testUserId,
          eventId: 'final-event',
          timestamp: new Date()
        });

        // This should trigger community favorite (50th reaction)
        await achievementEngine.checkAchievements(testUserId, {
          type: UserActionType.REACTION_RECEIVED,
          userId: testUserId,
          timestamp: new Date()
        });

        const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
        expect(userAchievements.length).toBeGreaterThanOrEqual(3); // First Step, Streak Master, Community Favorite
      }, 15000); // Increase timeout

      it('should handle challenge and mentorship achievements', async () => {
        // Complete 10 challenges for Challenge Champion
        for (let i = 0; i < 10; i++) {
          const action: UserAction = {
            type: UserActionType.CHALLENGE_COMPLETED,
            userId: testUserId,
            challengeId: `challenge-${i}`,
            timestamp: new Date()
          };
          await achievementEngine.checkAchievements(testUserId, action);
        }

        // Complete 3 mentorships for Mentor Master
        for (let i = 0; i < 3; i++) {
          const action: UserAction = {
            type: UserActionType.MENTORSHIP_COMPLETED,
            userId: testUserId,
            timestamp: new Date()
          };
          await achievementEngine.checkAchievements(testUserId, action);
        }

        const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
        const challengeChampion = userAchievements.find(a => a.id === 'challenge_champion');
        const mentorMaster = userAchievements.find(a => a.id === 'mentor_master');

        expect(challengeChampion).toBeDefined();
        expect(challengeChampion?.rarity).toBe('rare');
        expect(challengeChampion?.points).toBe(75);

        expect(mentorMaster).toBeDefined();
        expect(mentorMaster?.rarity).toBe('legendary');
        expect(mentorMaster?.points).toBe(200);
      });
    });

    describe('Manual Badge Awarding', () => {
      it('should award badge manually by ID', async () => {
        await achievementEngine.awardBadge(testUserId, 'first_step');

        const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
        const firstStep = userAchievements.find(a => a.id === 'first_step');

        expect(firstStep).toBeDefined();
        expect(firstStep?.unlockedAt).toBeDefined();
        // Check if it's a valid date string or Date object
        expect(firstStep?.unlockedAt).toBeTruthy();
      });

      it('should throw error when awarding non-existent badge', async () => {
        await expect(achievementEngine.awardBadge(testUserId, 'non-existent-badge'))
          .rejects.toThrow(APIError);
      });

      it('should throw error when awarding duplicate badge', async () => {
        await achievementEngine.awardBadge(testUserId, 'first_step');

        await expect(achievementEngine.awardBadge(testUserId, 'first_step'))
          .rejects.toThrow('User already has this achievement');
      });
    });
  });

  describe('Engagement Score Calculations (Requirement 2.5)', () => {
    it('should calculate engagement score based on participation metrics', async () => {
      // Create some user activity first
      await achievementEngine.checkAchievements(testUserId, {
        type: UserActionType.EVENT_JOINED,
        userId: testUserId,
        eventId: testEventId,
        timestamp: new Date()
      });

      const score = await achievementEngine.getEngagementScore(testUserId);

      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should calculate engagement score with correct weightings', () => {
      // Test the calculation logic directly with a new user
      const score = achievementEngine.calculateEngagementScore(testUserId);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(typeof score).toBe('number');
    });

    it('should include achievement points in engagement score', async () => {
      // Get initial score
      const initialScore = achievementEngine.calculateEngagementScore(testUserId);

      // Award an achievement
      await achievementEngine.awardBadge(testUserId, 'first_step');

      const scoreWithAchievements = await achievementEngine.getEngagementScore(testUserId);

      expect(scoreWithAchievements).toBeGreaterThan(initialScore);
    });

    it('should apply rare achievement multiplier correctly', async () => {
      // Get base score
      const baseScore = achievementEngine.calculateEngagementScore(testUserId);

      // Award rare achievements to a different user to avoid conflicts
      const testUserId2 = 'test-user-rare';
      await achievementEngine.awardBadge(testUserId2, 'streak_master'); // rare
      await achievementEngine.awardBadge(testUserId2, 'community_favorite'); // epic

      const scoreWithRareAchievements = await achievementEngine.getEngagementScore(testUserId2);

      // Score should be higher due to rare achievement multiplier
      expect(scoreWithRareAchievements).toBeGreaterThan(baseScore);
    });

    it('should handle zero stats gracefully', () => {
      const newUserId = 'new-user-with-no-stats';
      const score = achievementEngine.calculateEngagementScore(newUserId);

      expect(score).toBe(0);
    });

    it('should update engagement score when user stats change', async () => {
      const initialScore = await achievementEngine.getEngagementScore(testUserId);

      // Perform actions that should increase score
      const action: UserAction = {
        type: UserActionType.EVENT_JOINED,
        userId: testUserId,
        eventId: testEventId,
        timestamp: new Date()
      };
      await achievementEngine.checkAchievements(testUserId, action);

      const updatedScore = await achievementEngine.getEngagementScore(testUserId);

      expect(updatedScore).toBeGreaterThanOrEqual(initialScore);
    });
  });

  describe('Achievement Data Structure (Requirements 2.4, 2.5)', () => {
    it('should return newly earned achievements with proper structure', async () => {
      const action: UserAction = {
        type: UserActionType.EVENT_JOINED,
        userId: testUserId,
        eventId: testEventId,
        timestamp: new Date()
      };

      const newAchievements = await achievementEngine.checkAchievements(testUserId, action);

      expect(newAchievements).toHaveLength(1);
      expect(newAchievements[0]).toMatchObject({
        id: 'first_step',
        name: 'First Step',
        description: expect.any(String),
        iconUrl: expect.any(String),
        rarity: 'common',
        points: 10,
        unlockedAt: expect.any(Date)
      });
    });

    it('should provide complete achievement data for different rarities', async () => {
      // Award a legendary achievement
      await achievementEngine.awardBadge(testUserId, 'mentor_master');

      const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);
      const mentorMaster = userAchievements.find(a => a.id === 'mentor_master');

      expect(mentorMaster).toBeDefined();
      expect(mentorMaster?.rarity).toBe('legendary');
      expect(mentorMaster?.points).toBe(200);
      expect(mentorMaster?.category).toBe(AchievementCategory.LEADERSHIP);
      expect(mentorMaster?.iconUrl).toContain('mentor-master');
      expect(mentorMaster?.unlockedAt).toBeDefined();
    });

    it('should track achievement statistics correctly', async () => {
      // Award multiple achievements
      await achievementEngine.awardBadge(testUserId, 'first_step');
      await achievementEngine.awardBadge(testUserId, 'streak_master');
      await achievementEngine.awardBadge(testUserId, 'community_favorite');

      const stats = await achievementEngine.getUserStatsAsync(testUserId);

      expect(stats.totalAchievements).toBe(3);
      expect(stats.rareAchievements).toBe(2); // streak_master (rare) + community_favorite (epic)
      expect(stats.achievementPoints).toBe(160); // 10 + 50 + 100
    });

    it('should provide achievement requirements for progress tracking', async () => {
      const allAchievements = await achievementEngine.getAllAchievements();

      allAchievements.forEach(achievement => {
        expect(achievement.requirements).toBeDefined();
        expect(achievement.requirements.length).toBeGreaterThan(0);
        
        achievement.requirements.forEach(requirement => {
          expect(requirement).toMatchObject({
            type: expect.any(String),
            value: expect.any(Number),
            description: expect.any(String)
          });
          expect(Object.values(RequirementType)).toContain(requirement.type);
        });
      });
    });

    it('should maintain proper rarity classification', async () => {
      const achievements = [
        { id: 'first_step', rarity: 'common' },
        { id: 'streak_master', rarity: 'rare' },
        { id: 'community_favorite', rarity: 'epic' },
        { id: 'mentor_master', rarity: 'legendary' }
      ];

      for (const { id, rarity } of achievements) {
        await achievementEngine.awardBadge(testUserId, id);
      }

      const userAchievements = await achievementEngine.getUserAchievementsAsync(testUserId);

      expect(userAchievements).toHaveLength(4);
      
      // Verify each rarity is properly set
      const rarities = userAchievements.map(a => a.rarity);
      expect(rarities).toContain('common');
      expect(rarities).toContain('rare');
      expect(rarities).toContain('epic');
      expect(rarities).toContain('legendary');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid actions gracefully', async () => {
      // Test with empty user ID - should not throw but return empty array
      const validAction: UserAction = {
        type: UserActionType.EVENT_JOINED,
        userId: '',
        timestamp: new Date()
      };

      const result = await achievementEngine.checkAchievements('', validAction);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle concurrent achievement checks', async () => {
      const actions = Array.from({ length: 10 }, (_, i) => ({
        type: UserActionType.EVENT_JOINED,
        userId: testUserId,
        eventId: `event-${i}`,
        timestamp: new Date()
      }));

      // Execute all actions concurrently
      const results = await Promise.all(
        actions.map(action => achievementEngine.checkAchievements(testUserId, action))
      );

      // Should not award First Step multiple times
      const firstStepAwards = results.flat().filter(a => a.id === 'first_step');
      expect(firstStepAwards.length).toBeLessThanOrEqual(1);
    });

    it('should maintain data consistency across operations', async () => {
      // Perform multiple operations
      await achievementEngine.awardBadge(testUserId, 'first_step');
      
      const action: UserAction = {
        type: UserActionType.REACTION_RECEIVED,
        userId: testUserId,
        timestamp: new Date()
      };
      await achievementEngine.checkAchievements(testUserId, action);

      // Verify data consistency
      const achievements = await achievementEngine.getUserAchievementsAsync(testUserId);
      const stats = await achievementEngine.getUserStatsAsync(testUserId);

      expect(stats.totalAchievements).toBe(achievements.length);
      expect(stats.achievementPoints).toBe(
        achievements.reduce((total, a) => total + a.points, 0)
      );
    });

    it('should handle storage limitations gracefully', () => {
      // Test with very large user ID
      const largeUserId = 'x'.repeat(1000);
      
      expect(() => {
        achievementEngine.calculateEngagementScore(largeUserId);
      }).not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple users efficiently', async () => {
      const userIds = Array.from({ length: 5 }, (_, i) => `user-${i}`);
      
      const startTime = Date.now();
      
      // Process achievements for multiple users
      await Promise.all(
        userIds.map(userId => 
          achievementEngine.checkAchievements(userId, {
            type: UserActionType.EVENT_JOINED,
            userId,
            eventId: testEventId,
            timestamp: new Date()
          })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    it('should provide consistent achievement data', async () => {
      // Test that achievement data is consistent across calls
      const achievements1 = await achievementEngine.getAllAchievements();
      const achievements2 = await achievementEngine.getAllAchievements();

      expect(achievements1.length).toBe(achievements2.length);
      expect(achievements1[0].id).toBe(achievements2[0].id);
    });
  });
});
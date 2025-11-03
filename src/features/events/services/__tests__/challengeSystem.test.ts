import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { challengeSystem, APIError, ChallengeResult } from '@features/events/services/challengeSystem';
import { teamSystem } from '@features/events/services/teamSystem';
import { 
  ChallengeType, 
  ChallengeStatus, 
  RewardType,
  Challenge,
  ChallengeSubmission
} from '@features/events/types/engagement.types';

describe('ChallengeSystem', () => {
  const testEventId = 'test-event-123';
  const testUserId1 = 'test-user-1';
  const testUserId2 = 'test-user-2';
  const testUserId3 = 'test-user-3';

  beforeEach(() => {
    // Clear all data before each test
    challengeSystem.clearAllChallengeData();
    teamSystem.clearAllTeamData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    challengeSystem.clearAllChallengeData();
    teamSystem.clearAllTeamData();
  });

  describe('Challenge Generation for Different Sports (Requirement 3.1)', () => {
    it('should generate sport-specific challenges for Basketball', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');

      expect(challenges).toHaveLength(3);
      expect(challenges.every(c => c.eventId === testEventId)).toBe(true);
      expect(challenges.every(c => c.sport === 'Basketball')).toBe(true);

      // Basketball should have skill showcase, creativity, and photo contest
      const challengeTypes = challenges.map(c => c.type);
      expect(challengeTypes).toContain(ChallengeType.SKILL_SHOWCASE);
      expect(challengeTypes).toContain(ChallengeType.CREATIVITY);
      expect(challengeTypes).toContain(ChallengeType.PHOTO_CONTEST);

      // Verify challenge content is basketball-specific
      const skillChallenge = challenges.find(c => c.type === ChallengeType.SKILL_SHOWCASE);
      expect(skillChallenge?.title).toContain('Basketball');
      expect(skillChallenge?.description).toContain('basketball');
    });

    it('should generate sport-specific challenges for Soccer', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Soccer');

      expect(challenges).toHaveLength(3);
      
      // Soccer should have skill showcase, endurance, and team collaboration
      const challengeTypes = challenges.map(c => c.type);
      expect(challengeTypes).toContain(ChallengeType.SKILL_SHOWCASE);
      expect(challengeTypes).toContain(ChallengeType.ENDURANCE);
      expect(challengeTypes).toContain(ChallengeType.TEAM_COLLABORATION);

      // Verify soccer-specific content
      const enduranceChallenge = challenges.find(c => c.type === ChallengeType.ENDURANCE);
      expect(enduranceChallenge?.title).toContain('Soccer');
      expect(enduranceChallenge?.description).toContain('soccer');
    });

    it('should generate challenges for unknown sports with default types', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'UnknownSport');

      expect(challenges).toHaveLength(3);
      
      // Should default to skill showcase, creativity, and photo contest
      const challengeTypes = challenges.map(c => c.type);
      expect(challengeTypes).toContain(ChallengeType.SKILL_SHOWCASE);
      expect(challengeTypes).toContain(ChallengeType.CREATIVITY);
      expect(challengeTypes).toContain(ChallengeType.PHOTO_CONTEST);
    });

    it('should generate challenges with proper rewards based on type', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Tennis');

      challenges.forEach(challenge => {
        expect(challenge.rewards).toHaveLength(2); // Base points + type-specific reward
        
        // All should have base points reward
        const pointsReward = challenge.rewards.find(r => r.type === RewardType.POINTS);
        expect(pointsReward).toBeDefined();
        expect(pointsReward?.value).toBe(50);

        // Check type-specific rewards
        if (challenge.type === ChallengeType.SKILL_SHOWCASE) {
          const badgeReward = challenge.rewards.find(r => r.type === RewardType.BADGE);
          expect(badgeReward?.description).toBe('Skill Master badge');
        }
      });
    });

    it('should set proper challenge timing and status', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');

      challenges.forEach((challenge, index) => {
        expect(challenge.status).toBe(ChallengeStatus.UPCOMING);
        expect(challenge.startDate).toBeInstanceOf(Date);
        expect(challenge.endDate).toBeInstanceOf(Date);
        expect(challenge.endDate.getTime()).toBeGreaterThan(challenge.startDate.getTime());
        
        // Challenges should be staggered
        if (index > 0) {
          expect(challenge.startDate.getTime()).toBeGreaterThan(challenges[index - 1].startDate.getTime());
        }
      });
    });

    it('should handle multiple events generating challenges', async () => {
      const event1Challenges = await challengeSystem.generateChallenges('event-1', 'Basketball');
      const event2Challenges = await challengeSystem.generateChallenges('event-2', 'Soccer');

      expect(event1Challenges).toHaveLength(3);
      expect(event2Challenges).toHaveLength(3);

      // Challenges should be separate for different events
      expect(event1Challenges.every(c => c.eventId === 'event-1')).toBe(true);
      expect(event2Challenges.every(c => c.eventId === 'event-2')).toBe(true);

      // Should have different IDs
      const allIds = [...event1Challenges, ...event2Challenges].map(c => c.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(6);
    });
  });

  describe('Challenge Participation and Submission (Requirement 3.2)', () => {
    let testChallenge: Challenge;

    beforeEach(async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');
      testChallenge = challenges[0];
      
      // Make challenge active for testing by setting current dates
      const storedChallenges = JSON.parse(localStorage.getItem('challenges_data') || '[]');
      const challengeIndex = storedChallenges.findIndex((c: Challenge) => c.id === testChallenge.id);
      if (challengeIndex !== -1) {
        const now = new Date();
        storedChallenges[challengeIndex].startDate = new Date(now.getTime() - 1000); // 1 second ago
        storedChallenges[challengeIndex].endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        storedChallenges[challengeIndex].status = 'active';
        localStorage.setItem('challenges_data', JSON.stringify(storedChallenges));
        testChallenge = storedChallenges[challengeIndex];
      }
    });

    it('should allow users to submit challenge entries', async () => {
      const submissionData = {
        userName: 'Test User 1',
        userAvatar: '/avatars/user1.jpg',
        content: 'This is my basketball skills showcase submission!',
        mediaUrl: '/videos/basketball-skills.mp4'
      };

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, submissionData);

      const updatedChallenge = await challengeSystem.getChallengeById(testChallenge.id);
      expect(updatedChallenge.participants).toContain(testUserId1);
      expect(updatedChallenge.submissions).toHaveLength(1);
      
      const submission = updatedChallenge.submissions[0];
      expect(submission.userId).toBe(testUserId1);
      expect(submission.userName).toBe(submissionData.userName);
      expect(submission.content).toBe(submissionData.content);
      expect(submission.mediaUrl).toBe(submissionData.mediaUrl);
      expect(submission.votes).toBe(0);
      expect(submission.voterIds).toEqual([]);
    });

    it('should prevent duplicate participation from same user', async () => {
      const submissionData = {
        userName: 'Test User 1',
        content: 'First submission'
      };

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, submissionData);

      await expect(
        challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, submissionData)
      ).rejects.toThrow('User already participated in this challenge');
    });

    it('should enforce maximum participants limit', async () => {
      // Create a challenge with low max participants for testing
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');
      const challenge = challenges[0];
      
      // Manually set max participants to 2 and make active for testing
      const storedChallenges = JSON.parse(localStorage.getItem('challenges_data') || '[]');
      const challengeIndex = storedChallenges.findIndex((c: Challenge) => c.id === challenge.id);
      const now = new Date();
      storedChallenges[challengeIndex].maxParticipants = 2;
      storedChallenges[challengeIndex].startDate = new Date(now.getTime() - 1000);
      storedChallenges[challengeIndex].endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      storedChallenges[challengeIndex].status = 'active';
      localStorage.setItem('challenges_data', JSON.stringify(storedChallenges));

      // Add 2 participants
      await challengeSystem.submitChallengeEntry(challenge.id, testUserId1, { userName: 'User 1' });
      await challengeSystem.submitChallengeEntry(challenge.id, testUserId2, { userName: 'User 2' });

      // Third participant should be rejected
      await expect(
        challengeSystem.submitChallengeEntry(challenge.id, testUserId3, { userName: 'User 3' })
      ).rejects.toThrow('Challenge has reached maximum participants');
    });

    it('should handle voting on submissions', async () => {
      // Submit an entry
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'Test User 1',
        content: 'Great submission!'
      });

      const challenge = await challengeSystem.getChallengeById(testChallenge.id);
      const submissionId = challenge.submissions[0].id;

      // Vote on the submission
      await challengeSystem.voteOnSubmission(submissionId, testUserId2);

      const updatedChallenge = await challengeSystem.getChallengeById(testChallenge.id);
      const submission = updatedChallenge.submissions[0];
      
      expect(submission.votes).toBe(1);
      expect(submission.voterIds).toContain(testUserId2);
    });

    it('should prevent duplicate voting from same user', async () => {
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'Test User 1',
        content: 'Great submission!'
      });

      const challenge = await challengeSystem.getChallengeById(testChallenge.id);
      const submissionId = challenge.submissions[0].id;

      await challengeSystem.voteOnSubmission(submissionId, testUserId2);

      await expect(
        challengeSystem.voteOnSubmission(submissionId, testUserId2)
      ).rejects.toThrow('User already voted on this submission');
    });
  });

  describe('Leaderboard Calculations and Updates (Requirement 3.3)', () => {
    let testChallenge: Challenge;

    beforeEach(async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');
      testChallenge = challenges[0];
      
      // Make challenge active for testing
      const storedChallenges = JSON.parse(localStorage.getItem('challenges_data') || '[]');
      const challengeIndex = storedChallenges.findIndex((c: Challenge) => c.id === testChallenge.id);
      if (challengeIndex !== -1) {
        const now = new Date();
        storedChallenges[challengeIndex].startDate = new Date(now.getTime() - 1000);
        storedChallenges[challengeIndex].endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        storedChallenges[challengeIndex].status = 'active';
        localStorage.setItem('challenges_data', JSON.stringify(storedChallenges));
        testChallenge = storedChallenges[challengeIndex];
      }
    });

    it('should calculate leaderboard scores based on votes and timing', async () => {
      // Add multiple submissions with different vote counts
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'User 1',
        content: 'First submission with good content and media',
        mediaUrl: '/video1.mp4'
      });

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId2, {
        userName: 'User 2',
        content: 'Second submission'
      });

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId3, {
        userName: 'User 3',
        content: 'Third submission with detailed content that is longer than fifty characters',
        mediaUrl: '/video3.mp4'
      });

      // Add votes to create score differences
      const challenge = await challengeSystem.getChallengeById(testChallenge.id);
      const submission1Id = challenge.submissions.find(s => s.userId === testUserId1)?.id;
      const submission3Id = challenge.submissions.find(s => s.userId === testUserId3)?.id;

      if (submission1Id) {
        await challengeSystem.voteOnSubmission(submission1Id, testUserId2);
        await challengeSystem.voteOnSubmission(submission1Id, testUserId3);
      }

      if (submission3Id) {
        await challengeSystem.voteOnSubmission(submission3Id, testUserId1);
      }

      const leaderboard = await challengeSystem.getChallengeLeaderboard(testChallenge.id);

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].rank).toBe(3);

      // User with more votes should rank higher
      expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);
      expect(leaderboard[1].score).toBeGreaterThan(leaderboard[2].score);
    });

    it('should include content quality bonuses in scoring', async () => {
      // Submission with media and long content should get bonuses
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'User 1',
        content: 'This is a very detailed submission with lots of content that exceeds fifty characters',
        mediaUrl: '/video1.mp4'
      });

      // Submission with minimal content
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId2, {
        userName: 'User 2',
        content: 'Short'
      });

      const leaderboard = await challengeSystem.getChallengeLeaderboard(testChallenge.id);

      // User 1 should have higher score due to content bonuses
      const user1Entry = leaderboard.find(e => e.userId === testUserId1);
      const user2Entry = leaderboard.find(e => e.userId === testUserId2);

      expect(user1Entry?.score).toBeGreaterThan(user2Entry?.score || 0);
    });

    it('should handle empty leaderboard gracefully', async () => {
      const leaderboard = await challengeSystem.getChallengeLeaderboard(testChallenge.id);

      expect(leaderboard).toEqual([]);
    });

    it('should throw error for non-existent challenge', async () => {
      await expect(
        challengeSystem.getChallengeLeaderboard('non-existent-challenge')
      ).rejects.toThrow('Challenge not found');
    });

    it('should calculate user levels based on scores', async () => {
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'User 1',
        content: 'Great submission!'
      });

      // Add many votes to increase score
      const challenge = await challengeSystem.getChallengeById(testChallenge.id);
      const submissionId = challenge.submissions[0].id;

      // Simulate multiple votes (in real app, would be from different users)
      for (let i = 0; i < 10; i++) {
        try {
          await challengeSystem.voteOnSubmission(submissionId, `voter-${i}`);
        } catch (error) {
          // Ignore duplicate vote errors for testing
        }
      }

      const leaderboard = await challengeSystem.getChallengeLeaderboard(testChallenge.id);
      const userEntry = leaderboard[0];

      expect(userEntry.level).toBeGreaterThan(1);
      expect(userEntry.level).toBe(Math.floor(userEntry.score / 100) + 1);
    });
  });

  describe('Challenge Completion and Winners (Requirement 3.4)', () => {
    let testChallenge: Challenge;

    beforeEach(async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');
      testChallenge = challenges[0];
      
      // Make challenge active for testing
      const storedChallenges = JSON.parse(localStorage.getItem('challenges_data') || '[]');
      const challengeIndex = storedChallenges.findIndex((c: Challenge) => c.id === testChallenge.id);
      if (challengeIndex !== -1) {
        const now = new Date();
        storedChallenges[challengeIndex].startDate = new Date(now.getTime() - 1000);
        storedChallenges[challengeIndex].endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        storedChallenges[challengeIndex].status = 'active';
        localStorage.setItem('challenges_data', JSON.stringify(storedChallenges));
        testChallenge = storedChallenges[challengeIndex];
      }
    });

    it('should determine winners when challenge ends', async () => {
      // Add submissions with different scores
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'Winner User',
        content: 'Winning submission with great content and media',
        mediaUrl: '/winner-video.mp4'
      });

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId2, {
        userName: 'Second Place',
        content: 'Good submission'
      });

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId3, {
        userName: 'Third Place',
        content: 'Basic submission'
      });

      // Add votes to create clear winner
      const challenge = await challengeSystem.getChallengeById(testChallenge.id);
      const winnerSubmissionId = challenge.submissions.find(s => s.userId === testUserId1)?.id;
      
      if (winnerSubmissionId) {
        await challengeSystem.voteOnSubmission(winnerSubmissionId, testUserId2);
        await challengeSystem.voteOnSubmission(winnerSubmissionId, testUserId3);
      }

      const results = await challengeSystem.endChallenge(testChallenge.id);

      expect(results).toHaveLength(3); // Top 3 winners
      expect(results[0].winnerId).toBe(testUserId1);
      expect(results[0].winnerName).toBe('Winner User');
      expect(results[0].totalParticipants).toBe(3);
      expect(results[0].completedAt).toBeInstanceOf(Date);

      // Verify challenge status is updated
      const completedChallenge = await challengeSystem.getChallengeById(testChallenge.id);
      expect(completedChallenge.status).toBe(ChallengeStatus.COMPLETED);
    });

    it('should handle challenge with no participants', async () => {
      await expect(
        challengeSystem.endChallenge(testChallenge.id)
      ).rejects.toThrow('No participants to determine winners');
    });

    it('should prevent ending already completed challenge', async () => {
      // Add a participant and end the challenge
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'Test User',
        content: 'Test submission'
      });

      await challengeSystem.endChallenge(testChallenge.id);

      // Try to end again
      await expect(
        challengeSystem.endChallenge(testChallenge.id)
      ).rejects.toThrow('Challenge already completed');
    });

    it('should update submission ranks after challenge completion', async () => {
      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId1, {
        userName: 'User 1',
        content: 'First submission'
      });

      await challengeSystem.submitChallengeEntry(testChallenge.id, testUserId2, {
        userName: 'User 2',
        content: 'Second submission'
      });

      await challengeSystem.endChallenge(testChallenge.id);

      // Check that submissions have ranks assigned
      const completedChallenge = await challengeSystem.getChallengeById(testChallenge.id);
      completedChallenge.submissions.forEach(submission => {
        expect(submission.rank).toBeDefined();
        expect(submission.score).toBeDefined();
      });
    });
  });

  describe('Team Formation and Competition Logic (Requirements 9.1, 9.2, 9.3)', () => {
    it('should create teams for team-based challenges', async () => {
      const team1 = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Thunder Dunkers',
        description: 'Elite basketball team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      const team2 = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Court Kings',
        description: 'Experienced players',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId2
      });

      expect(team1.id).toBeDefined();
      expect(team1.captainId).toBe(testUserId1);
      expect(team1.memberIds).toContain(testUserId1);
      expect(team1.sport).toBe('Basketball');

      expect(team2.id).toBeDefined();
      expect(team2.captainId).toBe(testUserId2);
      expect(team2.memberIds).toContain(testUserId2);
    });

    it('should handle team invitations and membership', async () => {
      const team = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Test Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      // Captain invites another user
      await teamSystem.inviteToTeam(team.id, testUserId1, testUserId2, 'User 2');

      // Check invitation was created
      const invitations = await teamSystem.getUserInvitations(testUserId2);
      expect(invitations).toHaveLength(1);
      expect(invitations[0].teamId).toBe(team.id);
      expect(invitations[0].inviteeId).toBe(testUserId2);

      // Accept invitation
      await teamSystem.acceptInvitation(invitations[0].id);

      // Verify user is now team member
      const updatedTeam = await teamSystem.getTeamById(team.id);
      expect(updatedTeam.memberIds).toContain(testUserId2);
      expect(updatedTeam.memberIds).toHaveLength(2);
    });

    it('should prevent duplicate team names for same sport', async () => {
      await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Unique Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      await expect(
        teamSystem.createTeam({
          eventId: testEventId,
          sport: 'Basketball',
          teamName: 'Unique Team',
          maxMembers: 5,
          isPublic: true,
          captainId: testUserId2
        })
      ).rejects.toThrow('Team name already exists for this sport');
    });

    it('should allow same team name for different sports', async () => {
      const basketballTeam = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Champions',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      const soccerTeam = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Soccer',
        teamName: 'Champions',
        maxMembers: 11,
        isPublic: true,
        captainId: testUserId2
      });

      expect(basketballTeam.id).toBeDefined();
      expect(soccerTeam.id).toBeDefined();
      expect(basketballTeam.id).not.toBe(soccerTeam.id);
    });

    it('should enforce team member limits', async () => {
      const team = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Small Team',
        maxMembers: 2,
        isPublic: true,
        captainId: testUserId1
      });

      // Add one member (team already has captain)
      await teamSystem.inviteToTeam(team.id, testUserId1, testUserId2, 'User 2');
      const invitations = await teamSystem.getUserInvitations(testUserId2);
      await teamSystem.acceptInvitation(invitations[0].id);

      // Try to add third member (should fail)
      await expect(
        teamSystem.inviteToTeam(team.id, testUserId1, testUserId3, 'User 3')
      ).rejects.toThrow('Team is already at maximum capacity');
    });

    it('should track team statistics and achievements', async () => {
      const team = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Stats Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      // Update team stats
      await teamSystem.updateTeamStats(team.id, {
        eventsParticipated: 5,
        challengesWon: 3,
        totalScore: 1500,
        averageEngagement: 85
      });

      const updatedTeam = await teamSystem.getTeamById(team.id);
      expect(updatedTeam.stats.eventsParticipated).toBe(5);
      expect(updatedTeam.stats.challengesWon).toBe(3);
      expect(updatedTeam.stats.totalScore).toBe(1500);
      expect(updatedTeam.stats.winRate).toBe(60); // 3/5 * 100

      // Award team achievement
      await teamSystem.awardTeamAchievement(team.id, {
        id: 'team_player',
        name: 'Team Player',
        description: 'Excellent teamwork',
        iconUrl: '/icons/team-player.svg',
        memberIds: [testUserId1]
      });

      const teamWithAchievement = await teamSystem.getTeamById(team.id);
      expect(teamWithAchievement.achievements).toHaveLength(1);
      expect(teamWithAchievement.achievements[0].name).toBe('Team Player');
    });

    it('should generate team leaderboards', async () => {
      // Create multiple teams with different stats
      const team1 = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Top Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      const team2 = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Second Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId2
      });

      // Update stats to create ranking
      await teamSystem.updateTeamStats(team1.id, {
        eventsParticipated: 10,
        challengesWon: 8,
        totalScore: 2000,
        averageEngagement: 90
      });

      await teamSystem.updateTeamStats(team2.id, {
        eventsParticipated: 8,
        challengesWon: 4,
        totalScore: 1200,
        averageEngagement: 75
      });

      const leaderboard = await teamSystem.getTeamLeaderboard('Basketball', 'totalScore');

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].id).toBe(team1.id); // Higher score should be first
      expect(leaderboard[1].id).toBe(team2.id);
      expect(leaderboard[0].stats.totalScore).toBeGreaterThan(leaderboard[1].stats.totalScore);
    });

    it('should handle team captain transfer when captain leaves', async () => {
      const team = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Transfer Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      // Add a member
      await teamSystem.inviteToTeam(team.id, testUserId1, testUserId2, 'User 2');
      const invitations = await teamSystem.getUserInvitations(testUserId2);
      await teamSystem.acceptInvitation(invitations[0].id);

      // Captain leaves
      await teamSystem.leaveTeam(team.id, testUserId1);

      const updatedTeam = await teamSystem.getTeamById(team.id);
      expect(updatedTeam.captainId).toBe(testUserId2); // Captaincy transferred
      expect(updatedTeam.memberIds).not.toContain(testUserId1);
      expect(updatedTeam.memberIds).toContain(testUserId2);
    });

    it('should disband team when last member leaves', async () => {
      const team = await teamSystem.createTeam({
        eventId: testEventId,
        sport: 'Basketball',
        teamName: 'Solo Team',
        maxMembers: 5,
        isPublic: true,
        captainId: testUserId1
      });

      // Captain (only member) leaves
      await teamSystem.leaveTeam(team.id, testUserId1);

      // Team should no longer exist
      await expect(
        teamSystem.getTeamById(team.id)
      ).rejects.toThrow('Team not found');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent challenge operations gracefully', async () => {
      await expect(
        challengeSystem.submitChallengeEntry('non-existent', testUserId1, {})
      ).rejects.toThrow('Challenge not found');

      await expect(
        challengeSystem.getChallengeLeaderboard('non-existent')
      ).rejects.toThrow('Challenge not found');

      await expect(
        challengeSystem.endChallenge('non-existent')
      ).rejects.toThrow('Challenge not found');
    });

    it('should handle concurrent operations safely', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');
      const challenge = challenges[0];

      // Make challenge active for testing
      const storedChallenges = JSON.parse(localStorage.getItem('challenges_data') || '[]');
      const challengeIndex = storedChallenges.findIndex((c: Challenge) => c.id === challenge.id);
      if (challengeIndex !== -1) {
        const now = new Date();
        storedChallenges[challengeIndex].startDate = new Date(now.getTime() - 1000);
        storedChallenges[challengeIndex].endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        storedChallenges[challengeIndex].status = 'active';
        localStorage.setItem('challenges_data', JSON.stringify(storedChallenges));
      }

      // Simulate concurrent submissions
      const submissions = Promise.all([
        challengeSystem.submitChallengeEntry(challenge.id, testUserId1, { userName: 'User 1' }),
        challengeSystem.submitChallengeEntry(challenge.id, testUserId2, { userName: 'User 2' }),
        challengeSystem.submitChallengeEntry(challenge.id, testUserId3, { userName: 'User 3' })
      ]);

      await expect(submissions).resolves.toBeDefined();

      const updatedChallenge = await challengeSystem.getChallengeById(challenge.id);
      expect(updatedChallenge.participants).toHaveLength(3);
      expect(updatedChallenge.submissions).toHaveLength(3);
    });

    it('should maintain data consistency across operations', async () => {
      const challenges = await challengeSystem.generateChallenges(testEventId, 'Basketball');
      const challenge = challenges[0];

      // Make challenge active for testing
      const storedChallenges = JSON.parse(localStorage.getItem('challenges_data') || '[]');
      const challengeIndex = storedChallenges.findIndex((c: Challenge) => c.id === challenge.id);
      if (challengeIndex !== -1) {
        const now = new Date();
        storedChallenges[challengeIndex].startDate = new Date(now.getTime() - 1000);
        storedChallenges[challengeIndex].endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        storedChallenges[challengeIndex].status = 'active';
        localStorage.setItem('challenges_data', JSON.stringify(storedChallenges));
      }

      await challengeSystem.submitChallengeEntry(challenge.id, testUserId1, {
        userName: 'Test User',
        content: 'Test content'
      });

      // Verify data consistency
      const updatedChallenge = await challengeSystem.getChallengeById(challenge.id);
      expect(updatedChallenge.participants.length).toBe(updatedChallenge.submissions.length);
      expect(updatedChallenge.participants[0]).toBe(updatedChallenge.submissions[0].userId);
    });
  });
});
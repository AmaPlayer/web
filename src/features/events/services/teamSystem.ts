import { Timestamp } from 'firebase/firestore';
import { 
  Team, 
  TeamAchievement, 
  TeamStats, 
  TeamMembership, 
  TeamRole 
} from '@features/events/types/engagement.types';

// API Error class for typed error responses
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Team invitation interface
export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
  status: InvitationStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

// Team formation request interface
export interface TeamFormationRequest {
  eventId: string;
  challengeId?: string;
  sport: string;
  teamName: string;
  description?: string;
  maxMembers: number;
  isPublic: boolean;
  captainId: string;
}

// LocalStorage keys
const TEAMS_STORAGE_KEY = 'teams_data';
const TEAM_INVITATIONS_STORAGE_KEY = 'team_invitations_data';
const TEAM_COUNTER_KEY = 'team_counter';

class TeamSystem {
  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize localStorage with default data
   */
  private initializeStorage(): void {
    if (!localStorage.getItem(TEAMS_STORAGE_KEY)) {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(TEAM_INVITATIONS_STORAGE_KEY)) {
      localStorage.setItem(TEAM_INVITATIONS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(TEAM_COUNTER_KEY)) {
      localStorage.setItem(TEAM_COUNTER_KEY, '1');
    }
  }

  /**
   * Generate next team ID
   */
  private getNextId(): string {
    const counter = parseInt(localStorage.getItem(TEAM_COUNTER_KEY) || '1');
    localStorage.setItem(TEAM_COUNTER_KEY, (counter + 1).toString());
    return `team_${counter}`;
  }

  /**
   * Get stored teams
   */
  private getStoredTeams(): Team[] {
    const data = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!data) return [];

    const teams = JSON.parse(data);
    return teams.map((team: any) => ({
      ...team,
      createdAt: new Date(team.createdAt),
      achievements: team.achievements.map((achievement: any) => ({
        ...achievement,
        earnedAt: new Date(achievement.earnedAt)
      }))
    }));
  }

  /**
   * Save teams to storage
   */
  private saveTeams(teams: Team[]): void {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  }

  /**
   * Get stored team invitations
   */
  private getStoredInvitations(): TeamInvitation[] {
    const data = localStorage.getItem(TEAM_INVITATIONS_STORAGE_KEY);
    if (!data) return [];

    const invitations = JSON.parse(data);
    return invitations.map((invitation: any) => ({
      ...invitation,
      createdAt: new Date(invitation.createdAt),
      expiresAt: new Date(invitation.expiresAt)
    }));
  }

  /**
   * Save team invitations to storage
   */
  private saveInvitations(invitations: TeamInvitation[]): void {
    localStorage.setItem(TEAM_INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
  }

  /**
   * Create a new team
   * Requirements: 9.1 - Team formation and management system
   */
  async createTeam(request: TeamFormationRequest): Promise<Team> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const teams = this.getStoredTeams();

      // Check if captain is already in a team for this sport
      const existingTeam = teams.find(team => 
        team.sport === request.sport && 
        (team.captainId === request.captainId || team.memberIds.includes(request.captainId))
      );

      if (existingTeam) {
        throw new APIError(400, 'User is already part of a team for this sport');
      }

      // Validate team name uniqueness
      const nameExists = teams.some(team => 
        team.name.toLowerCase() === request.teamName.toLowerCase() && 
        team.sport === request.sport
      );

      if (nameExists) {
        throw new APIError(400, 'Team name already exists for this sport');
      }

      const newTeam: Team = {
        id: this.getNextId(),
        name: request.teamName,
        description: request.description,
        sport: request.sport,
        captainId: request.captainId,
        memberIds: [request.captainId], // Captain is automatically a member
        maxMembers: Math.min(Math.max(request.maxMembers, 2), 20), // Between 2-20 members
        isPublic: request.isPublic,
        achievements: [],
        stats: {
          eventsParticipated: 0,
          challengesWon: 0,
          totalScore: 0,
          averageEngagement: 0,
          winRate: 0
        },
        createdAt: Timestamp.fromDate(new Date())
      };

      teams.push(newTeam);
      this.saveTeams(teams);

      return newTeam;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to create team', error);
    }
  }

  /**
   * Invite a user to join a team
   * Requirements: 9.2 - Team collaboration tools
   */
  async inviteToTeam(teamId: string, inviterId: string, inviteeId: string, inviteeName: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const teams = this.getStoredTeams();
      const team = teams.find(t => t.id === teamId);

      if (!team) {
        throw new APIError(404, 'Team not found');
      }

      // Check if inviter is captain or member
      if (team.captainId !== inviterId && !team.memberIds.includes(inviterId)) {
        throw new APIError(403, 'Only team members can invite others');
      }

      // Check if invitee is already a member
      if (team.memberIds.includes(inviteeId)) {
        throw new APIError(400, 'User is already a team member');
      }

      // Check if team is full
      if (team.memberIds.length >= team.maxMembers) {
        throw new APIError(400, 'Team is already at maximum capacity');
      }

      // Check for existing pending invitation
      const invitations = this.getStoredInvitations();
      const existingInvitation = invitations.find(inv => 
        inv.teamId === teamId && 
        inv.inviteeId === inviteeId && 
        inv.status === InvitationStatus.PENDING
      );

      if (existingInvitation) {
        throw new APIError(400, 'Invitation already sent to this user');
      }

      // Create invitation
      const invitation: TeamInvitation = {
        id: `invitation_${Date.now()}_${inviteeId}`,
        teamId,
        teamName: team.name,
        inviterId,
        inviterName: `User ${inviterId}`, // In real app, would fetch actual name
        inviteeId,
        inviteeName,
        status: InvitationStatus.PENDING,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      invitations.push(invitation);
      this.saveInvitations(invitations);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to send team invitation', error);
    }
  }

  /**
   * Accept a team invitation
   * Requirements: 9.2 - Team collaboration tools
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const invitations = this.getStoredInvitations();
      const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);

      if (invitationIndex === -1) {
        throw new APIError(404, 'Invitation not found');
      }

      const invitation = invitations[invitationIndex];

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new APIError(400, 'Invitation is no longer pending');
      }

      if (Timestamp.now().toMillis() > invitation.expiresAt.toMillis()) {
        invitation.status = InvitationStatus.EXPIRED;
        invitations[invitationIndex] = invitation;
        this.saveInvitations(invitations);
        throw new APIError(400, 'Invitation has expired');
      }

      // Add user to team
      const teams = this.getStoredTeams();
      const teamIndex = teams.findIndex(t => t.id === invitation.teamId);

      if (teamIndex === -1) {
        throw new APIError(404, 'Team not found');
      }

      const team = teams[teamIndex];

      // Check if team is still not full
      if (team.memberIds.length >= team.maxMembers) {
        throw new APIError(400, 'Team is now at maximum capacity');
      }

      // Add member to team
      team.memberIds.push(invitation.inviteeId);
      teams[teamIndex] = team;
      this.saveTeams(teams);

      // Update invitation status
      invitation.status = InvitationStatus.ACCEPTED;
      invitations[invitationIndex] = invitation;
      this.saveInvitations(invitations);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to accept invitation', error);
    }
  }

  /**
   * Decline a team invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const invitations = this.getStoredInvitations();
      const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);

      if (invitationIndex === -1) {
        throw new APIError(404, 'Invitation not found');
      }

      const invitation = invitations[invitationIndex];
      invitation.status = InvitationStatus.DECLINED;
      invitations[invitationIndex] = invitation;
      this.saveInvitations(invitations);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to decline invitation', error);
    }
  }

  /**
   * Leave a team
   */
  async leaveTeam(teamId: string, userId: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const teams = this.getStoredTeams();
      const teamIndex = teams.findIndex(t => t.id === teamId);

      if (teamIndex === -1) {
        throw new APIError(404, 'Team not found');
      }

      const team = teams[teamIndex];

      if (!team.memberIds.includes(userId)) {
        throw new APIError(400, 'User is not a member of this team');
      }

      // If captain is leaving, transfer captaincy or disband team
      if (team.captainId === userId) {
        if (team.memberIds.length > 1) {
          // Transfer captaincy to another member
          const newCaptain = team.memberIds.find(id => id !== userId);
          if (newCaptain) {
            team.captainId = newCaptain;
          }
        } else {
          // Disband team if captain is the only member
          teams.splice(teamIndex, 1);
          this.saveTeams(teams);
          return;
        }
      }

      // Remove user from team
      team.memberIds = team.memberIds.filter(id => id !== userId);
      teams[teamIndex] = team;
      this.saveTeams(teams);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to leave team', error);
    }
  }

  /**
   * Get teams for a user
   */
  async getUserTeams(userId: string): Promise<TeamMembership[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const teams = this.getStoredTeams();
      const userTeams = teams.filter(team => 
        team.memberIds.includes(userId) || team.captainId === userId
      );

      return userTeams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        role: team.captainId === userId ? TeamRole.CAPTAIN : TeamRole.MEMBER,
        joinedAt: team.createdAt, // Simplified - in real app would track actual join date
        isActive: true
      }));

    } catch (error) {
      throw new APIError(500, 'Failed to get user teams', error);
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<Team> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const teams = this.getStoredTeams();
      const team = teams.find(t => t.id === teamId);

      if (!team) {
        throw new APIError(404, 'Team not found');
      }

      return team;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to get team', error);
    }
  }

  /**
   * Get public teams for a sport (for joining)
   */
  async getPublicTeams(sport: string): Promise<Team[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const teams = this.getStoredTeams();
      return teams.filter(team => 
        team.sport === sport && 
        team.isPublic && 
        team.memberIds.length < team.maxMembers
      );

    } catch (error) {
      throw new APIError(500, 'Failed to get public teams', error);
    }
  }

  /**
   * Get pending invitations for a user
   */
  async getUserInvitations(userId: string): Promise<TeamInvitation[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const invitations = this.getStoredInvitations();
      return invitations.filter(inv => 
        inv.inviteeId === userId && 
        inv.status === InvitationStatus.PENDING &&
        Timestamp.now().toMillis() <= inv.expiresAt.toMillis()
      );

    } catch (error) {
      throw new APIError(500, 'Failed to get user invitations', error);
    }
  }

  /**
   * Award team achievement
   * Requirements: 9.4 - Team achievement and badge system
   */
  async awardTeamAchievement(teamId: string, achievement: Omit<TeamAchievement, 'earnedAt'>): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const teams = this.getStoredTeams();
      const teamIndex = teams.findIndex(t => t.id === teamId);

      if (teamIndex === -1) {
        throw new APIError(404, 'Team not found');
      }

      const team = teams[teamIndex];

      // Check if team already has this achievement
      const hasAchievement = team.achievements.some(a => a.id === achievement.id);
      if (hasAchievement) {
        throw new APIError(400, 'Team already has this achievement');
      }

      const teamAchievement: TeamAchievement = {
        ...achievement,
        earnedAt: Timestamp.fromDate(new Date())
      };

      team.achievements.push(teamAchievement);
      teams[teamIndex] = team;
      this.saveTeams(teams);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to award team achievement', error);
    }
  }

  /**
   * Update team statistics
   * Requirements: 9.3 - Team leaderboards and collaboration tools
   */
  async updateTeamStats(teamId: string, statsUpdate: Partial<TeamStats>): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const teams = this.getStoredTeams();
      const teamIndex = teams.findIndex(t => t.id === teamId);

      if (teamIndex === -1) {
        throw new APIError(404, 'Team not found');
      }

      const team = teams[teamIndex];
      team.stats = { ...team.stats, ...statsUpdate };

      // Recalculate win rate
      if (team.stats.eventsParticipated > 0) {
        team.stats.winRate = (team.stats.challengesWon / team.stats.eventsParticipated) * 100;
      }

      teams[teamIndex] = team;
      this.saveTeams(teams);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to update team stats', error);
    }
  }

  /**
   * Get team leaderboard for a sport
   * Requirements: 9.3 - Team leaderboards
   */
  async getTeamLeaderboard(sport: string, sortBy: 'totalScore' | 'challengesWon' | 'winRate' = 'totalScore'): Promise<Team[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const teams = this.getStoredTeams();
      const sportTeams = teams.filter(team => team.sport === sport);

      // Sort teams based on criteria
      return sportTeams.sort((a, b) => {
        switch (sortBy) {
          case 'totalScore':
            return b.stats.totalScore - a.stats.totalScore;
          case 'challengesWon':
            return b.stats.challengesWon - a.stats.challengesWon;
          case 'winRate':
            return b.stats.winRate - a.stats.winRate;
          default:
            return b.stats.totalScore - a.stats.totalScore;
        }
      });

    } catch (error) {
      throw new APIError(500, 'Failed to get team leaderboard', error);
    }
  }

  /**
   * Utility method to clear all team data (for testing)
   */
  clearAllTeamData(): void {
    localStorage.removeItem(TEAMS_STORAGE_KEY);
    localStorage.removeItem(TEAM_INVITATIONS_STORAGE_KEY);
    localStorage.removeItem(TEAM_COUNTER_KEY);
    this.initializeStorage();
  }

  /**
   * Utility method to seed sample team data (for testing)
   */
  async seedSampleTeamData(): Promise<void> {
    // Clear existing data first
    this.clearAllTeamData();

    // Create sample teams
    const sampleTeams: TeamFormationRequest[] = [
      {
        eventId: 'event_1',
        sport: 'Basketball',
        teamName: 'Thunder Dunkers',
        description: 'Elite basketball team focused on competitive play',
        maxMembers: 8,
        isPublic: true,
        captainId: 'user_1'
      },
      {
        eventId: 'event_2',
        sport: 'Soccer',
        teamName: 'Lightning Strikers',
        description: 'Fast-paced soccer team with great teamwork',
        maxMembers: 11,
        isPublic: true,
        captainId: 'user_2'
      },
      {
        eventId: 'event_3',
        sport: 'Basketball',
        teamName: 'Court Kings',
        description: 'Experienced basketball players seeking challenges',
        maxMembers: 6,
        isPublic: false,
        captainId: 'user_3'
      }
    ];

    for (const teamRequest of sampleTeams) {
      const team = await this.createTeam(teamRequest);

      // Add some sample members
      const memberIds = ['user_4', 'user_5', 'user_6'];
      for (const memberId of memberIds.slice(0, Math.floor(Math.random() * 3) + 1)) {
        try {
          await this.inviteToTeam(team.id, team.captainId, memberId, `User ${memberId}`);
          // Auto-accept for sample data
          const invitations = this.getStoredInvitations();
          const invitation = invitations.find(inv => 
            inv.teamId === team.id && inv.inviteeId === memberId
          );
          if (invitation) {
            await this.acceptInvitation(invitation.id);
          }
        } catch (error) {
          // Ignore errors for sample data
        }
      }

      // Add sample stats and achievements
      await this.updateTeamStats(team.id, {
        eventsParticipated: Math.floor(Math.random() * 10) + 1,
        challengesWon: Math.floor(Math.random() * 5),
        totalScore: Math.floor(Math.random() * 1000) + 100,
        averageEngagement: Math.floor(Math.random() * 100) + 50
      });

      // Award sample achievement
      if (Math.random() > 0.5) {
        await this.awardTeamAchievement(team.id, {
          id: 'team_player',
          name: 'Team Player',
          description: 'Excellent teamwork and collaboration',
          iconUrl: '/icons/achievements/team-player.svg',
          memberIds: team.memberIds
        });
      }
    }
  }
}

// Export singleton instance
export const teamSystem = new TeamSystem();
export default teamSystem;
import React, { useState, useEffect } from 'react';
import { Team, TeamMembership, TeamRole } from '@features/events/types/engagement.types';
import { TeamInvitation, teamSystem } from '@features/events/services/teamSystem';
import { formatDate } from '@features/events/utils/timestampHelpers';

interface TeamManagementProps {
  userId: string;
  userName: string;
  className?: string;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  userId,
  userName,
  className = ''
}) => {
  const [userTeams, setUserTeams] = useState<TeamMembership[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchUserData = async () => {
    try {
      setError(null);
      const [teams, userInvitations] = await Promise.all([
        teamSystem.getUserTeams(userId),
        teamSystem.getUserInvitations(userId)
      ]);
      
      setUserTeams(teams);
      setInvitations(userInvitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId: string) => {
    try {
      const team = await teamSystem.getTeamById(teamId);
      setSelectedTeam(team);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team details');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await teamSystem.acceptInvitation(invitationId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await teamSystem.declineInvitation(invitationId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      await teamSystem.leaveTeam(teamId, userId);
      await fetchUserData(); // Refresh data
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    }
  };

  const handleInviteMember = async (teamId: string) => {
    if (!inviteEmail.trim()) {
      setError('Please enter a user ID or email to invite');
      return;
    }

    setInviting(true);
    try {
      // In a real app, you'd resolve email to userId
      const inviteeId = inviteEmail.trim();
      await teamSystem.inviteToTeam(teamId, userId, inviteeId, inviteeId);
      setInviteEmail('');
      setError(null);
      // Refresh team details to show updated member count
      if (selectedTeam) {
        await fetchTeamDetails(selectedTeam.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className={`team-management loading ${className}`}>
        <div className="loading-spinner" aria-hidden="true"></div>
        <span>Loading your teams...</span>
      </div>
    );
  }

  return (
    <div className={`team-management ${className}`}>
      <div className="team-management-header">
        <h3>My Teams</h3>
      </div>

      {error && (
        <div className="team-error" role="alert">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="retry-button"
            onClick={fetchUserData}
            aria-label="Retry loading teams"
          >
            Retry
          </button>
        </div>
      )}

      {/* Team Invitations */}
      {invitations.length > 0 && (
        <div className="team-invitations">
          <h4 className="invitations-title">
            Team Invitations ({invitations.length})
          </h4>
          <div className="invitations-list">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-info">
                  <span className="team-name">{invitation.teamName}</span>
                  <span className="invitation-from">
                    Invited by {invitation.inviterName}
                  </span>
                  <span className="invitation-date">
                    {formatDate(invitation.createdAt)}
                  </span>
                </div>
                <div className="invitation-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    aria-label={`Accept invitation to ${invitation.teamName}`}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleDeclineInvitation(invitation.id)}
                    aria-label={`Decline invitation to ${invitation.teamName}`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Teams */}
      {userTeams.length > 0 ? (
        <div className="user-teams">
          <div className="teams-list">
            {userTeams.map((membership) => (
              <div 
                key={membership.teamId} 
                className={`team-card ${selectedTeam?.id === membership.teamId ? 'selected' : ''}`}
                onClick={() => fetchTeamDetails(membership.teamId)}
              >
                <div className="team-card-header">
                  <span className="team-name">{membership.teamName}</span>
                  <span className={`team-role ${membership.role}`}>
                    {membership.role === TeamRole.CAPTAIN ? '👑 Captain' : '👤 Member'}
                  </span>
                </div>
                <div className="team-card-meta">
                  <span className="join-date">
                    Joined {formatDate(membership.joinedAt)}
                  </span>
                  <span className={`team-status ${membership.isActive ? 'active' : 'inactive'}`}>
                    {membership.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Team Details Panel */}
          {selectedTeam && (
            <div className="team-details">
              <div className="team-details-header">
                <h4>{selectedTeam.name}</h4>
                <span className="team-sport">{selectedTeam.sport}</span>
              </div>

              {selectedTeam.description && (
                <p className="team-description">{selectedTeam.description}</p>
              )}

              <div className="team-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Members</span>
                  <span className="stat-value">
                    {selectedTeam.memberIds.length}/{selectedTeam.maxMembers}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Events</span>
                  <span className="stat-value">{selectedTeam.stats.eventsParticipated}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Wins</span>
                  <span className="stat-value">{selectedTeam.stats.challengesWon}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{selectedTeam.stats.totalScore.toLocaleString()}</span>
                </div>
              </div>

              {/* Team Achievements */}
              {selectedTeam.achievements.length > 0 && (
                <div className="team-achievements">
                  <h5>Team Achievements</h5>
                  <div className="achievements-list">
                    {selectedTeam.achievements.map((achievement, index) => (
                      <div key={index} className="achievement-item">
                        <span className="achievement-icon">
                          {achievement.iconUrl ? (
                            <img src={achievement.iconUrl} alt={achievement.name} />
                          ) : (
                            '🏆'
                          )}
                        </span>
                        <div className="achievement-info">
                          <span className="achievement-name">{achievement.name}</span>
                          <span className="achievement-date">
                            {formatDate(achievement.earnedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Actions */}
              <div className="team-actions">
                {/* Invite Members (Captain only) */}
                {selectedTeam.captainId === userId && selectedTeam.memberIds.length < selectedTeam.maxMembers && (
                  <div className="invite-section">
                    <h5>Invite Members</h5>
                    <div className="invite-form">
                      <input
                        type="text"
                        className="invite-input"
                        placeholder="Enter user ID or email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <button
                        className="btn-invite"
                        onClick={() => handleInviteMember(selectedTeam.id)}
                        disabled={inviting}
                      >
                        {inviting ? 'Inviting...' : 'Invite'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Leave Team */}
                <button
                  className="btn-leave-team"
                  onClick={() => handleLeaveTeam(selectedTeam.id)}
                >
                  {selectedTeam.captainId === userId ? 'Disband Team' : 'Leave Team'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-teams">
          <span className="no-teams-icon" aria-hidden="true">👥</span>
          <span className="no-teams-message">You're not part of any teams yet</span>
          <span className="no-teams-subtitle">
            Create a team or join public teams to start collaborating!
          </span>
        </div>
      )}
    </div>
  );
};
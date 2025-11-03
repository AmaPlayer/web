import React, { useState } from 'react';
import { TeamFormationRequest } from '@features/events/services/teamSystem';
import { teamSystem } from '@features/events/services/teamSystem';

interface TeamFormationProps {
  eventId: string;
  challengeId?: string;
  sport: string;
  userId: string;
  onTeamCreated?: (teamId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const TeamFormation: React.FC<TeamFormationProps> = ({
  eventId,
  challengeId,
  sport,
  userId,
  onTeamCreated,
  onCancel,
  className = ''
}) => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teamName: '',
    description: '',
    maxMembers: 5,
    isPublic: true
  });

  const validateForm = (): string | null => {
    if (!formData.teamName.trim()) {
      return 'Team name is required';
    }

    if (formData.teamName.length < 3) {
      return 'Team name must be at least 3 characters';
    }

    if (formData.teamName.length > 50) {
      return 'Team name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      return 'Description must be less than 200 characters';
    }

    if (formData.maxMembers < 2 || formData.maxMembers > 20) {
      return 'Team size must be between 2 and 20 members';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const teamRequest: TeamFormationRequest = {
        eventId,
        challengeId,
        sport,
        teamName: formData.teamName.trim(),
        description: formData.description.trim() || undefined,
        maxMembers: formData.maxMembers,
        isPublic: formData.isPublic,
        captainId: userId
      };

      const team = await teamSystem.createTeam(teamRequest);
      
      if (onTeamCreated) {
        onTeamCreated(team.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const getSportRecommendedSize = (sport: string): number => {
    const recommendations: Record<string, number> = {
      'Basketball': 8,
      'Soccer': 11,
      'Volleyball': 6,
      'Baseball': 9,
      'Football': 11,
      'Tennis': 4,
      'Athletics': 6
    };
    return recommendations[sport] || 5;
  };

  const recommendedSize = getSportRecommendedSize(sport);

  return (
    <div className={`team-formation ${className}`}>
      <div className="team-formation-header">
        <h3>Create Team for {sport}</h3>
        <p className="team-formation-subtitle">
          Form a team to participate in challenges and compete together
        </p>
      </div>

      <form onSubmit={handleSubmit} className="team-formation-form">
        {/* Team Name */}
        <div className="form-group">
          <label htmlFor="teamName" className="form-label">
            Team Name <span className="required">*</span>
          </label>
          <input
            id="teamName"
            type="text"
            className="form-input"
            placeholder="Enter your team name"
            value={formData.teamName}
            onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
            maxLength={50}
            required
          />
          <div className="form-hint">
            {formData.teamName.length}/50 characters
          </div>
        </div>

        {/* Team Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description (Optional)
          </label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Describe your team's goals and style"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            maxLength={200}
          />
          <div className="form-hint">
            {formData.description.length}/200 characters
          </div>
        </div>

        {/* Team Size */}
        <div className="form-group">
          <label htmlFor="maxMembers" className="form-label">
            Maximum Team Size
          </label>
          <div className="team-size-input">
            <input
              id="maxMembers"
              type="number"
              className="form-input"
              min={2}
              max={20}
              value={formData.maxMembers}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxMembers: parseInt(e.target.value) || 2 
              }))}
            />
            <div className="team-size-hint">
              <span className="recommended-size">
                Recommended for {sport}: {recommendedSize} members
              </span>
              <button
                type="button"
                className="use-recommended-btn"
                onClick={() => setFormData(prev => ({ ...prev, maxMembers: recommendedSize }))}
              >
                Use Recommended
              </button>
            </div>
          </div>
        </div>

        {/* Team Visibility */}
        <div className="form-group">
          <label className="form-label">Team Visibility</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="visibility"
                checked={formData.isPublic}
                onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
              />
              <span className="radio-label">
                <strong>Public</strong>
                <span className="radio-description">
                  Anyone can find and request to join your team
                </span>
              </span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="visibility"
                checked={!formData.isPublic}
                onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
              />
              <span className="radio-label">
                <strong>Private</strong>
                <span className="radio-description">
                  Only invited members can join your team
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Team Benefits Info */}
        <div className="team-benefits">
          <h4 className="benefits-title">Team Benefits:</h4>
          <ul className="benefits-list">
            <li>🏆 Compete in team-based challenges</li>
            <li>🤝 Collaborate with other athletes</li>
            <li>📊 Track team performance and achievements</li>
            <li>🎯 Earn exclusive team badges and rewards</li>
            <li>💬 Access to team communication tools</li>
          </ul>
        </div>

        {/* Error display */}
        {error && (
          <div className="form-error" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        {/* Form actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={creating}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={creating}
            aria-label={creating ? 'Creating team...' : 'Create team'}
          >
            {creating ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Creating Team...
              </>
            ) : (
              'Create Team'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
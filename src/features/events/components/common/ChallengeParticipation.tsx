import React, { useState } from 'react';
import { Challenge, ChallengeType, ChallengeStatus } from '@features/events/types/engagement.types';
import { challengeSystem } from '@features/events/services/challengeSystem';

interface ChallengeParticipationProps {
  challenge: Challenge;
  userId: string;
  userName: string;
  userAvatar?: string;
  onParticipationSuccess?: (challengeId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const ChallengeParticipation: React.FC<ChallengeParticipationProps> = ({
  challenge,
  userId,
  userName,
  userAvatar,
  onParticipationSuccess,
  onCancel,
  className = ''
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    mediaFile: null as File | null
  });

  const isTextRequired = [
    ChallengeType.CREATIVITY,
    ChallengeType.KNOWLEDGE_QUIZ,
    ChallengeType.TEAM_COLLABORATION
  ].includes(challenge.type);

  const isMediaRequired = [
    ChallengeType.SKILL_SHOWCASE,
    ChallengeType.PHOTO_CONTEST
  ].includes(challenge.type);

  const isMediaOptional = [
    ChallengeType.CREATIVITY,
    ChallengeType.ENDURANCE,
    ChallengeType.TEAM_COLLABORATION
  ].includes(challenge.type);

  const getPlaceholderText = (): string => {
    switch (challenge.type) {
      case ChallengeType.SKILL_SHOWCASE:
        return 'Describe your skill demonstration...';
      case ChallengeType.CREATIVITY:
        return 'Explain your creative approach...';
      case ChallengeType.KNOWLEDGE_QUIZ:
        return 'Share your knowledge or answer...';
      case ChallengeType.TEAM_COLLABORATION:
        return 'Describe your team collaboration...';
      case ChallengeType.ENDURANCE:
        return 'Share your endurance achievement...';
      case ChallengeType.PHOTO_CONTEST:
        return 'Describe your photo...';
      default:
        return 'Share your submission details...';
    }
  };

  const getMediaLabel = (): string => {
    switch (challenge.type) {
      case ChallengeType.SKILL_SHOWCASE:
        return 'Upload skill video';
      case ChallengeType.PHOTO_CONTEST:
        return 'Upload photo';
      case ChallengeType.CREATIVITY:
        return 'Upload media (optional)';
      case ChallengeType.ENDURANCE:
        return 'Upload proof (optional)';
      case ChallengeType.TEAM_COLLABORATION:
        return 'Upload team media (optional)';
      default:
        return 'Upload media';
    }
  };

  const validateForm = (): string | null => {
    if (isTextRequired && !formData.content.trim()) {
      return 'Description is required for this challenge type';
    }

    if (isMediaRequired && !formData.mediaFile) {
      return 'Media upload is required for this challenge type';
    }

    if (formData.content.length > 1000) {
      return 'Description must be less than 1000 characters';
    }

    if (formData.mediaFile) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (formData.mediaFile.size > maxSize) {
        return 'File size must be less than 50MB';
      }

      const allowedTypes = ['image/', 'video/'];
      const isValidType = allowedTypes.some(type => formData.mediaFile!.type.startsWith(type));
      if (!isValidType) {
        return 'Only image and video files are allowed';
      }
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

    setSubmitting(true);
    setError(null);

    try {
      // Convert file to base64 for storage (in real app, would upload to cloud storage)
      let mediaUrl: string | undefined;
      if (formData.mediaFile) {
        mediaUrl = await fileToBase64(formData.mediaFile);
      }

      const submissionData = {
        userName,
        userAvatar,
        content: formData.content.trim(),
        mediaUrl
      };

      await challengeSystem.submitChallengeEntry(challenge.id, userId, userName, userAvatar, submissionData);
      
      if (onParticipationSuccess) {
        onParticipationSuccess(challenge.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, mediaFile: file }));
    }
  };

  const canParticipate = challenge.status === ChallengeStatus.ACTIVE || 
                        challenge.status === ChallengeStatus.UPCOMING;

  if (!canParticipate) {
    return (
      <div className={`challenge-participation disabled ${className}`}>
        <div className="participation-header">
          <h3>Challenge Participation</h3>
        </div>
        <div className="participation-disabled">
          <span className="disabled-icon" aria-hidden="true">⏰</span>
          <span className="disabled-message">
            This challenge is no longer accepting submissions
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`challenge-participation ${className}`}>
      <div className="participation-header">
        <h3>Join Challenge: {challenge.title}</h3>
        <p className="challenge-description">{challenge.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="participation-form">
        {/* Text content input */}
        <div className="form-group">
          <label htmlFor="content" className="form-label">
            Description {isTextRequired && <span className="required">*</span>}
          </label>
          <textarea
            id="content"
            className="form-textarea"
            placeholder={getPlaceholderText()}
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            maxLength={1000}
            required={isTextRequired}
          />
          <div className="form-hint">
            {formData.content.length}/1000 characters
          </div>
        </div>

        {/* Media upload */}
        {(isMediaRequired || isMediaOptional) && (
          <div className="form-group">
            <label htmlFor="media" className="form-label">
              {getMediaLabel()} {isMediaRequired && <span className="required">*</span>}
            </label>
            <div className="file-upload-area">
              <input
                id="media"
                type="file"
                className="file-input"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required={isMediaRequired}
              />
              <div className="file-upload-hint">
                {formData.mediaFile ? (
                  <span className="file-selected">
                    📎 {formData.mediaFile.name} ({(formData.mediaFile.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                ) : (
                  <span className="file-placeholder">
                    Click to upload or drag and drop (Max 50MB)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rewards preview */}
        {challenge.rewards.length > 0 && (
          <div className="participation-rewards">
            <h4 className="rewards-title">Potential Rewards:</h4>
            <div className="rewards-list">
              {challenge.rewards.map((reward, index) => (
                <div key={index} className="reward-item">
                  <span className="reward-icon" aria-hidden="true">
                    {reward.type === 'points' ? '⭐' : 
                     reward.type === 'badge' ? '🏆' : 
                     reward.type === 'title' ? '👑' : '🎁'}
                  </span>
                  <span className="reward-text">{reward.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            aria-label={submitting ? 'Submitting entry...' : 'Submit entry'}
          >
            {submitting ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              'Submit Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
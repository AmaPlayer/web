import React, { useState } from 'react';
import { MentorProfile as MentorProfileType } from '@features/events/types/social.types';
import { SkillLevel } from '@features/events/types/user.types';

interface MentorProfileProps {
  mentor: MentorProfileType;
  currentUserId: string;
  onRequestMentorship?: (mentorId: string, sport: string, message: string, goals: string[]) => void;
  showRequestButton?: boolean;
  className?: string;
}

export const MentorProfile: React.FC<MentorProfileProps> = ({
  mentor,
  currentUserId,
  onRequestMentorship,
  showRequestButton = true,
  className = ''
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedSport, setSelectedSport] = useState(mentor.sports[0] || '');
  const [message, setMessage] = useState('');
  const [goals, setGoals] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRequestMentorship || !selectedSport || !message.trim()) return;

    const validGoals = goals.filter(goal => goal.trim().length > 0);
    if (validGoals.length === 0) return;

    setSubmitting(true);
    try {
      await onRequestMentorship(mentor.userId, selectedSport, message.trim(), validGoals);
      setShowRequestForm(false);
      setMessage('');
      setGoals(['']);
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setSubmitting(false);
    }
  };

  const addGoal = () => {
    if (goals.length < 5) {
      setGoals([...goals, '']);
    }
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  const getAvailabilityStatus = () => {
    if (!mentor.isAvailable) return { status: 'unavailable', text: 'Not Available' };
    if (mentor.menteeCount >= mentor.maxMentees) return { status: 'full', text: 'Fully Booked' };
    
    const availableSlots = mentor.maxMentees - mentor.menteeCount;
    return { 
      status: 'available', 
      text: `${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available` 
    };
  };

  const availability = getAvailabilityStatus();
  const canRequest = mentor.isAvailable && 
                    mentor.menteeCount < mentor.maxMentees && 
                    mentor.userId !== currentUserId;

  return (
    <div className={`mentor-profile ${className}`}>
      <div className="mentor-profile-header">
        <div className="mentor-avatar">
          {mentor.userAvatar ? (
            <img 
              src={mentor.userAvatar} 
              alt={`${mentor.userName}'s avatar`}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {mentor.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="mentor-info">
          <h3 className="mentor-name">{mentor.userName}</h3>
          
          <div className="mentor-rating">
            <div className="stars" aria-label={`Rating: ${mentor.rating} out of 5 stars`}>
              {renderStars(mentor.rating)}
            </div>
            <span className="rating-text">
              {mentor.rating.toFixed(1)} ({mentor.reviewCount} review{mentor.reviewCount !== 1 ? 's' : ''})
            </span>
          </div>

          <div className={`availability-status ${availability.status}`}>
            <span className="status-indicator" aria-hidden="true"></span>
            <span className="status-text">{availability.text}</span>
          </div>
        </div>

        <div className="mentor-meta">
          <div className="response-time">
            <span className="meta-icon" aria-hidden="true">⏱️</span>
            <span className="meta-text">{mentor.responseTime}</span>
          </div>
          <div className="timezone">
            <span className="meta-icon" aria-hidden="true">🌍</span>
            <span className="meta-text">{mentor.timezone}</span>
          </div>
        </div>
      </div>

      <div className="mentor-profile-body">
        <div className="mentor-bio">
          <p>{mentor.bio}</p>
        </div>

        <div className="mentor-details">
          <div className="detail-section">
            <h4 className="detail-title">Sports</h4>
            <div className="sports-list">
              {mentor.sports.map((sport, index) => (
                <span key={index} className="sport-tag">
                  {sport}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h4 className="detail-title">Experience</h4>
            <p className="experience-text">{mentor.experience}</p>
          </div>

          {mentor.specialties.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-title">Specialties</h4>
              <div className="specialties-list">
                {mentor.specialties.map((specialty, index) => (
                  <span key={index} className="specialty-tag">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mentor.achievements.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-title">Achievements</h4>
              <ul className="achievements-list">
                {mentor.achievements.map((achievement, index) => (
                  <li key={index} className="achievement-item">
                    <span className="achievement-icon" aria-hidden="true">🏆</span>
                    <span className="achievement-text">{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mentor.languages.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-title">Languages</h4>
              <div className="languages-list">
                {mentor.languages.map((language, index) => (
                  <span key={index} className="language-tag">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRequestButton && canRequest && (
        <div className="mentor-profile-footer">
          {!showRequestForm ? (
            <button
              className="btn-request-mentorship"
              onClick={() => setShowRequestForm(true)}
              aria-label={`Request mentorship from ${mentor.userName}`}
            >
              Request Mentorship
            </button>
          ) : (
            <form className="mentorship-request-form" onSubmit={handleRequestSubmit}>
              <h4 className="form-title">Request Mentorship</h4>
              
              <div className="form-group">
                <label htmlFor="sport-select" className="form-label">
                  Sport <span className="required">*</span>
                </label>
                <select
                  id="sport-select"
                  className="form-select"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  required
                >
                  {mentor.sports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message-input" className="form-label">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  id="message-input"
                  className="form-textarea"
                  placeholder="Tell the mentor about yourself and why you'd like their guidance..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                  required
                />
                <span className="character-count">
                  {message.length}/500
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Goals <span className="required">*</span>
                </label>
                <div className="goals-list">
                  {goals.map((goal, index) => (
                    <div key={index} className="goal-input-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder={`Goal ${index + 1}`}
                        value={goal}
                        onChange={(e) => updateGoal(index, e.target.value)}
                        maxLength={100}
                        required={index === 0}
                      />
                      {goals.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-goal"
                          onClick={() => removeGoal(index)}
                          aria-label={`Remove goal ${index + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {goals.length < 5 && (
                  <button
                    type="button"
                    className="btn-add-goal"
                    onClick={addGoal}
                  >
                    + Add Goal
                  </button>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowRequestForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || !message.trim() || goals.filter(g => g.trim()).length === 0}
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!canRequest && showRequestButton && (
        <div className="mentor-profile-footer">
          <div className="unavailable-message">
            {mentor.userId === currentUserId ? (
              <span>This is your profile</span>
            ) : !mentor.isAvailable ? (
              <span>Mentor is currently not accepting new mentees</span>
            ) : (
              <span>Mentor is fully booked</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
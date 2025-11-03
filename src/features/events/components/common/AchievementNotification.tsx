import React, { useEffect, useState } from 'react';
import { Achievement } from '@features/events/types/engagement.types';

interface AchievementNotificationProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

/**
 * AchievementNotification Component
 * Popup notification for newly earned achievements with celebration animations
 * Requirements: 2.5 - Achievement notification popup component
 */
export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose,
  autoCloseDelay = 5000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Trigger animation after render
      setTimeout(() => setIsAnimating(true), 50);
      
      // Auto close after delay
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 300);
  };

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'notification-common';
      case 'rare':
        return 'notification-rare';
      case 'epic':
        return 'notification-epic';
      case 'legendary':
        return 'notification-legendary';
      default:
        return 'notification-common';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '🥉';
      case 'rare':
        return '🥈';
      case 'epic':
        return '🥇';
      case 'legendary':
        return '👑';
      default:
        return '🏅';
    }
  };

  const getCelebrationEmojis = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return ['🎉', '✨', '🌟', '💫', '🎊', '🏆'];
      case 'epic':
        return ['🎉', '✨', '🌟', '🎊'];
      case 'rare':
        return ['🎉', '✨', '🎊'];
      case 'common':
        return ['🎉', '👏'];
      default:
        return ['🎉'];
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`achievement-notification-backdrop ${isAnimating ? 'backdrop-visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Notification */}
      <div
        className={`
          achievement-notification 
          ${getRarityClass(achievement.rarity)}
          ${isAnimating ? 'notification-visible' : ''}
        `}
        role="dialog"
        aria-labelledby="achievement-title"
        aria-describedby="achievement-description"
        aria-modal="true"
      >
        {/* Celebration particles */}
        <div className="celebration-particles">
          {getCelebrationEmojis(achievement.rarity).map((emoji, index) => (
            <span
              key={index}
              className={`particle particle-${index + 1}`}
              aria-hidden="true"
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* Close button */}
        <button
          className="notification-close"
          onClick={handleClose}
          aria-label="Close achievement notification"
        >
          ✕
        </button>

        {/* Header */}
        <div className="notification-header">
          <div className="notification-badge">
            <div className="badge-glow"></div>
            <div className="badge-icon-large">
              {achievement.iconUrl ? (
                <img 
                  src={achievement.iconUrl} 
                  alt={achievement.name}
                  className="achievement-image"
                />
              ) : (
                <span className="achievement-emoji" aria-hidden="true">
                  {getRarityIcon(achievement.rarity)}
                </span>
              )}
            </div>
          </div>
          
          <div className="notification-title-section">
            <h2 className="notification-title" id="achievement-title">
              Achievement Unlocked!
            </h2>
            <div className="achievement-rarity">
              <span className={`rarity-label ${getRarityClass(achievement.rarity)}`}>
                {achievement.rarity.toUpperCase()}
              </span>
              {achievement.rarity !== 'common' && (
                <span className="rarity-stars">
                  {achievement.rarity === 'legendary' && '✨✨✨'}
                  {achievement.rarity === 'epic' && '✨✨'}
                  {achievement.rarity === 'rare' && '✨'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="notification-content">
          <h3 className="achievement-name">{achievement.name}</h3>
          <p className="achievement-description" id="achievement-description">
            {achievement.description}
          </p>
          
          <div className="achievement-details">
            <div className="achievement-points">
              <span className="points-icon">⭐</span>
              <span className="points-value">+{achievement.points} points</span>
            </div>
            <div className="achievement-category">
              <span className="category-label">{achievement.category}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="notification-actions">
          <button
            className="btn-secondary"
            onClick={handleClose}
          >
            Continue
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              // In a real app, this would navigate to achievements page
              console.log('View all achievements');
              handleClose();
            }}
          >
            View All Achievements
          </button>
        </div>

        {/* Progress indicator */}
        <div className="notification-progress">
          <div 
            className="progress-bar"
            style={{ 
              animation: `progress-fill ${autoCloseDelay}ms linear forwards` 
            }}
          ></div>
        </div>
      </div>
    </>
  );
};

export default AchievementNotification;
import React from 'react';
import { Achievement, Badge } from '@features/events/types/engagement.types';

interface BadgeDisplayProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * BadgeDisplay Component
 * Displays individual achievement badges with animations and tooltips
 * Requirements: 2.4, 2.5 - Badge display with animations
 */
export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  achievement,
  size = 'medium',
  showAnimation = true,
  showTooltip = true,
  className = '',
  onClick
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showTooltipState, setShowTooltipState] = React.useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (showTooltip) {
      setShowTooltipState(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltipState(false);
  };

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'badge-common';
      case 'rare':
        return 'badge-rare';
      case 'epic':
        return 'badge-epic';
      case 'legendary':
        return 'badge-legendary';
      default:
        return 'badge-common';
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

  return (
    <div className="badge-display-container">
      <div
        className={`
          badge-display 
          badge-${size} 
          ${getRarityClass(achievement.rarity)}
          ${showAnimation ? 'badge-animated' : ''}
          ${isHovered ? 'badge-hovered' : ''}
          ${onClick ? 'badge-clickable' : ''}
          ${className}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        role={onClick ? 'button' : 'img'}
        tabIndex={onClick ? 0 : -1}
        aria-label={`${achievement.name} badge - ${achievement.description}`}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Badge Icon */}
        <div className="badge-icon-container">
          <div className="badge-icon">
            {achievement.iconUrl ? (
              <img 
                src={achievement.iconUrl} 
                alt={achievement.name}
                className="badge-image"
              />
            ) : (
              <span className="badge-emoji" aria-hidden="true">
                {getRarityIcon(achievement.rarity)}
              </span>
            )}
          </div>
          
          {/* Rarity indicator */}
          <div className="badge-rarity-indicator">
            <span className="rarity-stars">
              {achievement.rarity === 'legendary' && '✨✨✨'}
              {achievement.rarity === 'epic' && '✨✨'}
              {achievement.rarity === 'rare' && '✨'}
            </span>
          </div>
        </div>

        {/* Badge Name (for larger sizes) */}
        {size !== 'small' && (
          <div className="badge-name">
            {achievement.name}
          </div>
        )}

        {/* Points indicator */}
        <div className="badge-points">
          +{achievement.points}
        </div>

        {/* Unlock date indicator */}
        {achievement.unlockedAt && (
          <div className="badge-unlock-date">
            {achievement.unlockedAt.toDate().toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltipState && (
        <div className="badge-tooltip" role="tooltip">
          <div className="tooltip-header">
            <h4 className="tooltip-title">{achievement.name}</h4>
            <span className={`tooltip-rarity ${getRarityClass(achievement.rarity)}`}>
              {achievement.rarity.toUpperCase()}
            </span>
          </div>
          <p className="tooltip-description">{achievement.description}</p>
          <div className="tooltip-details">
            <span className="tooltip-points">+{achievement.points} points</span>
            <span className="tooltip-category">{achievement.category}</span>
          </div>
          {achievement.unlockedAt && (
            <div className="tooltip-unlock-date">
              Unlocked: {achievement.unlockedAt.toDate().toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
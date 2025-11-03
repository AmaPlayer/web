import React from 'react';
import { EventStatus, EventType } from '@features/events/types/event.types';
import { ChallengeStatus } from '@features/events/types/engagement.types';

export type BadgeType =
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'trending'
  | 'official'
  | 'live'
  | 'near-you'
  | 'ending-soon'
  | 'attending'
  | 'featured'
  | 'talent-hunt'
  | 'community'
  | 'tournament';

interface StatusBadgeProps {
  type: BadgeType | EventStatus | EventType | ChallengeStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface BadgeConfig {
  label: string;
  icon: string;
  colorClass: string;
}

const badgeConfigs: Record<string, BadgeConfig> = {
  // Event Status
  upcoming: { label: 'Upcoming', icon: '📅', colorClass: 'badge-upcoming' },
  ongoing: { label: 'Live Now', icon: '⚡', colorClass: 'badge-ongoing' },
  completed: { label: 'Completed', icon: '✓', colorClass: 'badge-completed' },
  cancelled: { label: 'Cancelled', icon: '✕', colorClass: 'badge-cancelled' },

  // Event Type
  talent_hunt: { label: 'Talent Hunt', icon: '🏆', colorClass: 'badge-talent-hunt' },
  community: { label: 'Community', icon: '👥', colorClass: 'badge-community' },
  tournament: { label: 'Tournament', icon: '🎯', colorClass: 'badge-tournament' },

  // Special badges
  trending: { label: 'Trending', icon: '🔥', colorClass: 'badge-trending' },
  official: { label: 'Official', icon: '✓', colorClass: 'badge-official' },
  live: { label: 'Live', icon: '🔴', colorClass: 'badge-live' },
  'near-you': { label: 'Near You', icon: '📍', colorClass: 'badge-near' },
  'ending-soon': { label: 'Ending Soon', icon: '⏰', colorClass: 'badge-urgent' },
  attending: { label: 'Attending', icon: '✓', colorClass: 'badge-attending' },
  featured: { label: 'Featured', icon: '⭐', colorClass: 'badge-featured' },
};

/**
 * StatusBadge Component
 * Versatile badge component for displaying event status, type, and special indicators
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  className = '',
  showIcon = true,
  size = 'medium',
}) => {
  const config = badgeConfigs[type] || {
    label: type,
    icon: '•',
    colorClass: 'badge-default',
  };

  return (
    <span
      className={`status-badge ${config.colorClass} badge-${size} ${className}`}
      role="status"
      aria-label={config.label}
    >
      {showIcon && <span className="badge-icon" aria-hidden="true">{config.icon}</span>}
      <span className="badge-label">{config.label}</span>
    </span>
  );
};

export default StatusBadge;

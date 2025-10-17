import React from 'react';
import { Trophy, Dribbble, Award } from 'lucide-react';
import { UserRole as ProfileUserRole } from '../types/ProfileTypes';
import { UserRole as PostUserRole } from '../../../types/models/user';
import '../styles/SportBanner.css';

interface SportBannerProps {
  sport?: string;
  position?: string;
  playerType?: string;
  role: ProfileUserRole | PostUserRole;
  organizationType?: string;
  specializations?: string[];
}

// Map post UserRole to profile UserRole
const mapRoleToProfileRole = (role: ProfileUserRole | PostUserRole): ProfileUserRole => {
  if (role === 'parent') return 'parents';
  if (role === 'coach') return 'coaches';
  return role as ProfileUserRole;
};

const SportBanner: React.FC<SportBannerProps> = ({
  sport,
  position,
  playerType,
  role,
  organizationType,
  specializations
}) => {
  // Normalize role to profile role format
  const normalizedRole = mapRoleToProfileRole(role);
  
  // Get appropriate icon based on role
  const getIcon = () => {
    switch (normalizedRole) {
      case 'athlete':
        return <Dribbble size={16} />;
      case 'coaches':
        return <Award size={16} />;
      case 'organization':
        return <Trophy size={16} />;
      case 'parents':
        return <Trophy size={16} />;
      default:
        return <Dribbble size={16} />;
    }
  };

  // Format the banner content based on role
  const getBannerContent = () => {
    switch (normalizedRole) {
      case 'athlete': {
        const athleteParts = [];
        if (sport) athleteParts.push(sport);
        if (position) athleteParts.push(position);
        if (playerType && playerType !== 'Not specified') athleteParts.push(playerType);
        // If no data, show default athlete label
        return athleteParts.length > 0 ? athleteParts.join(' • ') : 'Athlete';
      }

      case 'coaches': {
        const coachParts = [];
        if (sport) coachParts.push(`${sport} Coach`);
        else coachParts.push('Coach');
        if (specializations && specializations.length > 0) {
          coachParts.push(specializations.slice(0, 2).join(', '));
        }
        return coachParts.join(' • ');
      }

      case 'organization': {
        const orgParts = [];
        if (organizationType) orgParts.push(organizationType);
        if (sport) orgParts.push(sport);
        // If no data, show default organization label
        return orgParts.length > 0 ? orgParts.join(' • ') : 'Organization';
      }

      case 'parents':
        return sport ? `Parent • ${sport}` : 'Parent';

      default:
        return 'User';
    }
  };

  const content = getBannerContent();

  return (
    <div
      className="sport-banner"
      data-role={normalizedRole}
      role="status"
      aria-label={`User profile: ${content}`}
    >
      <div className="sport-banner-icon" aria-hidden="true">
        {getIcon()}
      </div>
      <span className="sport-banner-text">{content}</span>
    </div>
  );
};

export default SportBanner;

import React from 'react';
import { UserRole, PersonalDetails, roleConfigurations } from '../types/ProfileTypes';
import OrganizationInfoSection from './OrganizationInfoSection';
import ConnectedAthletesSection from './ConnectedAthletesSection';
import CoachingInfoSection from './CoachingInfoSection';

interface RoleSpecificSectionsProps {
  currentRole: UserRole;
  personalDetails: PersonalDetails;
  isOwner: boolean;
  onEditProfile: () => void;
  onAddAthlete?: () => void;
}

const RoleSpecificSections: React.FC<RoleSpecificSectionsProps> = ({
  currentRole,
  personalDetails,
  isOwner,
  onEditProfile,
  onAddAthlete
}) => {
  const currentRoleConfig = roleConfigurations[currentRole];
  const sections = currentRoleConfig.sections;

  return (
    <>
      {/* Organization-specific sections */}
      {sections.includes('organizationInfo') && (
        <OrganizationInfoSection
          personalDetails={personalDetails}
          isOwner={isOwner}
          onEdit={onEditProfile}
        />
      )}

      {/* Parent-specific sections */}
      {sections.includes('connectedAthletes') && (
        <ConnectedAthletesSection
          personalDetails={personalDetails}
          isOwner={isOwner}
          onEdit={onEditProfile}
          onAddAthlete={onAddAthlete}
        />
      )}

      {/* Coach-specific sections */}
      {sections.includes('coachingInfo') && (
        <CoachingInfoSection
          personalDetails={personalDetails}
          isOwner={isOwner}
          onEdit={onEditProfile}
        />
      )}
    </>
  );
};

export default RoleSpecificSections;
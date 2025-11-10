// TypeScript interfaces for enhanced profile functionality
import { TalentVideo } from './TalentVideoTypes';

export type UserRole = 'athlete' | 'organization' | 'parents' | 'coaches';

export interface PersonalDetails {
  // Common fields
  name: string;
  dateOfBirth?: string;
  gender?: string;

  // Contact Details
  mobile?: string;
  email?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;

  // Athlete-specific
  playerType?: 'Amateur' | 'Professional' | 'Student Athlete';
  sport?: string;
  position?: string;

  // Organization-specific
  organizationName?: string;
  organizationType?: string;
  location?: string;
  contactEmail?: string;
  website?: string;

  // Parent-specific
  relationship?: string;
  connectedAthletes?: string[];

  // Coach-specific
  specializations?: string[];
  yearsExperience?: number;
  coachingLevel?: string;
}

export interface PhysicalAttributes {
  // Physical measurements
  height?: number; // in cm
  weight?: number; // in kg
  dominantSide?: 'Left' | 'Right';

  // Performance metrics
  personalBest?: string;
  seasonBest?: string;

  // Training details
  coachName?: string;
  coachContact?: string;
  trainingAcademy?: string;
  schoolName?: string;
  clubName?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  dateEarned: Date;
  category: string;
  imageUrl?: string;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
}

export interface Certificate {
  id: string;
  name: string;
  issuingOrganization: string;
  dateIssued: Date;
  expirationDate?: Date;
  verificationUrl?: string;
  certificateImageUrl?: string;
}

export interface Post {
  id: string;
  type: 'photo' | 'video' | 'text' | 'mixed';
  title?: string;
  content: string;
  mediaUrls: string[];
  thumbnailUrl?: string;
  createdDate: Date;
  likes: number;
  comments: number;
  isPublic: boolean;
}

export interface ProfileEnhancedState {
  currentRole: UserRole;
  isEditing: boolean;
  editingSection: string | null;
  achievements: Achievement[];
  certificates: Certificate[];
  talentVideos: TalentVideo[];
  posts: Post[];
  personalDetails: PersonalDetails;
  physicalAttributes: PhysicalAttributes;
}

export interface RoleConfig {
  role: UserRole;
  sections: ProfileSection[];
  editableFields: string[];
  displayName: string;
}

export type ProfileSection =
  | 'personal'
  | 'physicalAttributes'
  | 'achievements'
  | 'certificates'
  | 'talentVideos'
  | 'posts'
  | 'organizationInfo'
  | 'connectedAthletes'
  | 'coachingInfo';

export const roleConfigurations: Record<UserRole, RoleConfig> = {
  athlete: {
    role: 'athlete',
    sections: ['personal', 'physicalAttributes', 'achievements', 'certificates', 'talentVideos', 'posts'],
    editableFields: ['name', 'dateOfBirth', 'gender', 'mobile', 'email', 'city', 'district', 'state', 'playerType', 'sport', 'position'],
    displayName: 'Athlete'
  },
  organization: {
    role: 'organization',
    sections: ['personal', 'organizationInfo', 'certificates', 'posts'],
    editableFields: ['organizationName', 'organizationType', 'location', 'contactEmail', 'website'],
    displayName: 'Organization'
  },
  parents: {
    role: 'parents',
    sections: ['personal', 'connectedAthletes', 'posts'],
    editableFields: ['name', 'relationship', 'contactEmail'],
    displayName: 'Parent'
  },
  coaches: {
    role: 'coaches',
    sections: ['personal', 'coachingInfo', 'certificates', 'posts'],
    editableFields: ['name', 'specializations', 'yearsExperience', 'coachingLevel'],
    displayName: 'Coach'
  }
};
export interface VideoVerification {
  verifierId: string; // Can be userId or anonymous session ID
  verifierName: string;
  verifierEmail: string;
  verifierRelationship: 'coach' | 'teammate' | 'parent' | 'friend' | 'witness' | 'other';
  verifiedAt: Date;
  verificationMessage?: string; // Optional field
  deviceFingerprint: string; // Unique device identifier for anti-cheat
  ipAddress: string; // IP address for additional anti-cheat layer
  userAgent: string; // Browser/device information
}

export interface TalentVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  sport: string;
  skillCategory: string;
  uploadDate: Date;
  duration: number;
  viewCount: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationLink?: string;

  // Community verification fields
  verifications?: VideoVerification[];
  verificationThreshold?: number; // Default: 3 verifications needed
  verificationDeadline?: Date; // Optional: Deadline to collect verifications
  userId?: string; // Owner of the video
}

export interface TalentVideosSectionProps {
  videos: TalentVideo[];
  isOwner: boolean;
  onAddVideo?: () => void;
  onEditVideo?: (video: TalentVideo) => void;
  onDeleteVideo?: (videoId: string) => void;
  onVideoClick?: (video: TalentVideo) => void;
  onOpenEditModal?: (initialTab: string) => void;
}

export interface VideoModalProps {
  video: TalentVideo | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface VideoFormData {
  title: string;
  description: string;
  sport: string;
  skillCategory: string;
  videoFile?: File;
}
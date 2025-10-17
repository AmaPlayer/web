import { Timestamp } from 'firebase/firestore';
import { UserRole } from './user';

/**
 * Media type for posts
 */
export type MediaType = 'image' | 'video';

/**
 * Post visibility options
 */
export type PostVisibility = 'public' | 'friends' | 'private';

/**
 * Core Post interface representing a post in the system
 */
export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  userRole?: UserRole;
  userSport?: string;
  userPosition?: string;
  userPlayerType?: string;
  userOrganizationType?: string;
  userSpecializations?: string[];
  caption: string;
  mediaUrl?: string | null;
  mediaType?: MediaType;
  mediaMetadata?: MediaMetadata;
  timestamp: Timestamp | Date | string;
  editedAt?: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
  likes: Like[];
  likesCount: number;
  comments: Comment[];
  commentsCount: number;
  shares: string[];
  sharesCount: number;
  shareCount?: number;
  shareMetadata?: ShareMetadata;
  visibility: PostVisibility;
  location?: string;
  tags?: string[];
  isActive: boolean;
  deletedAt?: string;
  // User interaction states (computed fields)
  isLiked?: boolean;
  hasShared?: boolean;
}

/**
 * Media metadata for uploaded files
 */
export interface MediaMetadata {
  size: number;
  type: string;
  name: string;
  uploadedAt: string;
  thumbnail?: string;
  durationFormatted?: string;
}

/**
 * Like data structure
 */
export interface Like {
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  timestamp: string;
}

/**
 * Comment interface for post comments
 */
export interface Comment {
  id: string;
  text: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  timestamp: Timestamp | Date | string;
  likes: string[] | Like[];
  replies?: Comment[];
  likesCount?: number;
}

/**
 * Share metadata tracking share statistics
 */
export interface ShareMetadata {
  lastSharedAt: Date | string;
  shareBreakdown: {
    friends: number;
    feeds: number;
    groups: number;
  };
}

/**
 * Data for creating a new post
 */
export interface CreatePostData {
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  caption: string;
  mediaFile?: File;
  visibility?: PostVisibility;
  location?: string;
  tags?: string[];
  timestamp?: Timestamp | Date | string;
}

/**
 * Data for updating an existing post
 */
export interface UpdatePostData {
  caption?: string;
  visibility?: PostVisibility;
  location?: string;
  tags?: string[];
}

/**
 * Data for adding a comment to a post
 */
export interface CreateCommentData {
  text: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
}

/**
 * Data for updating a comment
 */
export interface UpdateCommentData {
  text: string;
}

/**
 * Result of like/unlike operation
 */
export interface ToggleLikeResult {
  liked: boolean;
  likesCount: number;
}

/**
 * Post with user information populated
 */
export interface PopulatedPost extends Post {
  user?: {
    id: string;
    displayName: string;
    photoURL: string | null;
    isVerified: boolean;
  };
}

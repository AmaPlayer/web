import { Timestamp } from 'firebase/firestore';

/**
 * Core User interface representing a user in the system
 */
export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
  postsCount: number;
  storiesCount: number;
  followersCount: number;
  followingCount: number;
  followers?: string[];
  following?: string[];
  isVerified: boolean;
  isActive: boolean;
  isOnline?: boolean;
  lastSeen?: Timestamp | Date | string;
  privacy?: UserPrivacy;
  settings?: UserNotificationSettings;
}

/**
 * Extended user profile with additional information
 */
export interface UserProfile extends User {
  coverPhoto?: string;
  interests?: string[];
  favoriteTeams?: string[];
  favoriteSports?: string[];
}

/**
 * User privacy settings
 */
export interface UserPrivacy {
  profileVisibility: 'public' | 'friends' | 'private';
  followingVisible: boolean;
  followersVisible: boolean;
}

/**
 * User notification settings
 */
export interface UserNotificationSettings {
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Comprehensive user settings including privacy and notifications
 */
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowMessages: 'everyone' | 'friends' | 'none';
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

/**
 * User activity summary
 */
export interface UserActivitySummary {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  storiesCount: number;
  isVerified: boolean;
  joinDate: Timestamp | Date | string;
  lastActive: Timestamp | Date | string;
}

/**
 * Data for creating a new user profile
 */
export interface CreateUserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
}

/**
 * Data for updating an existing user profile
 */
export interface UpdateUserData {
  displayName?: string;
  photoURL?: string | null;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  coverPhoto?: string;
  interests?: string[];
  favoriteTeams?: string[];
  favoriteSports?: string[];
  privacy?: Partial<UserPrivacy>;
  settings?: Partial<UserNotificationSettings>;
}

/**
 * User stats update data
 */
export interface UserStatsUpdate {
  postsCount?: number;
  storiesCount?: number;
  followersCount?: number;
  followingCount?: number;
}

/**
 * Result of follow/unfollow operation
 */
export interface ToggleFollowResult {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

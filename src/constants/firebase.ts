// Firebase collections and document paths
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  STORIES: 'stories',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  FRIEND_REQUESTS: 'friendRequests',
  FRIENDSHIPS: 'friendships',
  GROUPS: 'groups',
  SHARES: 'shares',
  FOLLOWS: 'follows',
  REPORTS: 'reports',
  ADMIN_LOGS: 'adminLogs',
  EVENTS: 'events'
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// Firebase storage paths
export const STORAGE_PATHS = {
  POSTS: 'posts',
  STORIES: 'stories',
  PROFILE_IMAGES: 'profile-images',
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  TEMP_UPLOADS: 'temp-uploads'
} as const;

export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];

// Firebase security rules constants
export const ADMIN_EMAILS: readonly string[] = [
  'admin@amaplayer.com',
  'moderator@amaplayer.com'
] as const;

// User service with business logic
import { BaseService } from './baseService';
import { COLLECTIONS } from '../../constants/firebase';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '../../types/models/user';

/**
 * User profile creation data
 */
interface CreateUserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  location?: string;
  website?: string;
}

/**
 * User profile update data
 */
type UpdateUserProfileData = Partial<Omit<User, 'id' | 'uid'>>;

/**
 * Follow toggle result
 */
interface FollowToggleResult {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

/**
 * User activity summary
 */
interface UserActivitySummary {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  storiesCount: number;
  isVerified: boolean;
  joinDate: Date | any | undefined;
  lastActive: Date | any | undefined;
}

/**
 * User stats update
 */
interface UserStatsUpdate {
  postsCount?: number;
  storiesCount?: number;
  followersCount?: number;
  followingCount?: number;
}

/**
 * User service providing business logic for user operations
 */
class UserService extends BaseService<User> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  /**
   * Create user profile
   */
  async createUserProfile(userData: CreateUserProfileData): Promise<User> {
    try {
      const userProfile: Omit<User, 'id'> = {
        ...userData,
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        storiesCount: 0,
        isVerified: false,
        isActive: true,
        privacy: {
          profileVisibility: 'public',
          followingVisible: false,
          followersVisible: true,
        },
        settings: {
          notifications: true,
          emailNotifications: false,
          pushNotifications: true,
        },
      } as Omit<User, 'id'>;

      // Use user ID as document ID
      const userRef = doc(db, COLLECTIONS.USERS, userData.uid);
      await setDoc(userRef, userProfile);
      
      console.log('✅ User profile created:', userData.uid);
      return { id: userData.uid, ...userProfile } as User;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        console.log('✅ User profile retrieved:', userId);
        return userData;
      } else {
        console.warn('⚠️ User profile not found:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: UpdateUserProfileData): Promise<Partial<User>> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('✅ User profile updated:', userId);
      return { id: userId, ...updateData };
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Search users by name or username
   */
  async searchUsers(searchTerm: string, limit: number = 20): Promise<User[]> {
    try {
      // Search by display name
      const nameResults = await this.search('displayName', searchTerm, limit);
      
      // Search by username if it exists
      let usernameResults: User[] = [];
      try {
        usernameResults = await this.search('username', searchTerm, limit);
      } catch (error) {
        console.log('Username search not available');
      }
      
      // Combine and deduplicate results
      const allResults = [...nameResults, ...usernameResults];
      const uniqueResults = allResults.filter((user, index, array) => 
        array.findIndex(u => u.id === user.id) === index
      );
      
      return uniqueResults.slice(0, limit);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw error;
    }
  }

  /**
   * Follow/unfollow user
   */
  async toggleFollow(currentUserId: string, targetUserId: string): Promise<FollowToggleResult> {
    try {
      if (currentUserId === targetUserId) {
        throw new Error('Cannot follow yourself');
      }

      // Get current user's following list
      const currentUser = await this.getUserProfile(currentUserId);
      const following = (currentUser?.following as string[]) || [];
      
      // Get target user's followers list
      const targetUser = await this.getUserProfile(targetUserId);
      const followers = (targetUser?.followers as string[]) || [];
      
      const isFollowing = following.includes(targetUserId);
      
      let updatedFollowing: string[];
      let updatedFollowers: string[];
      let followersCount: number;
      let followingCount: number;

      if (isFollowing) {
        // Unfollow
        updatedFollowing = following.filter(id => id !== targetUserId);
        updatedFollowers = followers.filter(id => id !== currentUserId);
        followersCount = Math.max(0, (targetUser?.followersCount || 0) - 1);
        followingCount = Math.max(0, (currentUser?.followingCount || 0) - 1);
        console.log('👎 Unfollowed user:', targetUserId);
      } else {
        // Follow
        updatedFollowing = [...following, targetUserId];
        updatedFollowers = [...followers, currentUserId];
        followersCount = (targetUser?.followersCount || 0) + 1;
        followingCount = (currentUser?.followingCount || 0) + 1;
        console.log('👍 Followed user:', targetUserId);
      }

      // Update current user's following
      await this.updateUserProfile(currentUserId, {
        following: updatedFollowing,
        followingCount,
      } as UpdateUserProfileData);

      // Update target user's followers
      await this.updateUserProfile(targetUserId, {
        followers: updatedFollowers,
        followersCount,
      } as UpdateUserProfileData);

      return {
        isFollowing: !isFollowing,
        followersCount,
        followingCount,
      };
    } catch (error) {
      console.error('❌ Error toggling follow:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  async getUserFollowers(userId: string, limit: number = 50): Promise<User[]> {
    try {
      const user = await this.getUserProfile(userId);
      if (!user || !(user.followers as string[])) {
        return [];
      }

      // Get follower profiles in chunks
      const followerProfiles = await this.getUserProfiles((user.followers as string[]).slice(0, limit));
      return followerProfiles;
    } catch (error) {
      console.error('❌ Error getting user followers:', error);
      throw error;
    }
  }

  /**
   * Get user's following
   */
  async getUserFollowing(userId: string, limit: number = 50): Promise<User[]> {
    try {
      const user = await this.getUserProfile(userId);
      if (!user || !(user.following as string[])) {
        return [];
      }

      // Get following profiles in chunks
      const followingProfiles = await this.getUserProfiles((user.following as string[]).slice(0, limit));
      return followingProfiles;
    } catch (error) {
      console.error('❌ Error getting user following:', error);
      throw error;
    }
  }

  /**
   * Get multiple user profiles
   */
  async getUserProfiles(userIds: string[]): Promise<User[]> {
    try {
      const profiles: User[] = [];
      
      // Process in chunks to avoid overwhelming Firestore
      const chunkSize = 10;
      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(id => this.getUserProfile(id));
        const chunkResults = await Promise.all(chunkPromises);
        
        profiles.push(...chunkResults.filter((profile): profile is User => profile !== null));
      }

      return profiles;
    } catch (error) {
      console.error('❌ Error getting user profiles:', error);
      throw error;
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats(userId: string, statsUpdate: UserStatsUpdate): Promise<UserStatsUpdate> {
    try {
      const validStats = ['postsCount', 'storiesCount', 'followersCount', 'followingCount'];
      const filteredUpdate: UserStatsUpdate = {};
      
      Object.keys(statsUpdate).forEach(key => {
        if (validStats.includes(key)) {
          filteredUpdate[key as keyof UserStatsUpdate] = Math.max(0, statsUpdate[key as keyof UserStatsUpdate] || 0);
        }
      });

      await this.updateUserProfile(userId, filteredUpdate as UpdateUserProfileData);
      console.log('📊 User stats updated:', userId, filteredUpdate);
      
      return filteredUpdate;
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<UserActivitySummary | null> {
    try {
      const user = await this.getUserProfile(userId);
      if (!user) {
        return null;
      }

      return {
        postsCount: user.postsCount || 0,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        storiesCount: user.storiesCount || 0,
        isVerified: user.isVerified || false,
        joinDate: user.createdAt,
        lastActive: user.updatedAt,
      };
    } catch (error) {
      console.error('❌ Error getting user activity summary:', error);
      throw error;
    }
  }
}

export default new UserService();

// Posts service with business logic
import { BaseService, FirestoreFilter } from './baseService';
import { COLLECTIONS } from '../../constants/firebase';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Post, CreatePostData } from '../../types/models/post';

/**
 * Media upload result
 */
interface MediaUploadResult {
  url: string;
  metadata: {
    size: number;
    type: string;
    name: string;
    uploadedAt: string;
  };
}

/**
 * Like toggle result
 */
interface LikeToggleResult {
  liked: boolean;
  likesCount: number;
}

/**
 * Comment data structure
 */
interface CommentData {
  text: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
}

/**
 * Comment with metadata
 */
interface Comment extends CommentData {
  id: string;
  timestamp: string;
  likes: unknown[];
  replies: unknown[];
}

/**
 * User info for like operations
 */
interface UserInfo {
  displayName: string;
  photoURL: string | null;
}

/**
 * Posts service providing business logic for post operations
 */
class PostsService extends BaseService<Post> {
  constructor() {
    super(COLLECTIONS.POSTS);
  }

  /**
   * Create post with optional media upload
   */
  async createPost(postData: CreatePostData, mediaFile: File | null = null): Promise<Post> {
    try {
      let mediaUrl: string | null = null;
      let mediaMetadata: MediaUploadResult['metadata'] | null = null;

      // Upload media if provided
      if (mediaFile) {
        const uploadResult = await this.uploadMedia(mediaFile);
        mediaUrl = uploadResult.url;
        mediaMetadata = uploadResult.metadata;
      }

      const postDoc = {
        ...postData,
        mediaUrl,
        mediaMetadata,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        likes: [],
        comments: [],
        shares: [],
        visibility: postData.visibility || 'public',
        isActive: true,
      };

      const result = await this.create(postDoc as Omit<Post, 'id'>);
      console.log('✅ Post created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }

  /**
   * Upload media file to Firebase Storage
   */
  async uploadMedia(file: File): Promise<MediaUploadResult> {
    try {
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `posts/${filename}`);
      
      console.log('📤 Uploading media file:', filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const metadata: MediaUploadResult['metadata'] = {
        size: file.size,
        type: file.type,
        name: file.name,
        uploadedAt: new Date().toISOString(),
      };

      console.log('✅ Media uploaded successfully:', downloadURL);
      return { url: downloadURL, metadata };
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      throw error;
    }
  }

  /**
   * Get posts by user ID
   */
  async getPostsByUser(userId: string, limit: number = 20): Promise<Post[]> {
    const filters: FirestoreFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'isActive', operator: '==', value: true }
    ];
    
    return this.getAll(filters, 'timestamp', 'desc', limit);
  }

  /**
   * Get feed posts for user (following + own posts)
   */
  async getFeedPosts(userId: string, followingList: string[] = [], limit: number = 20): Promise<Post[]> {
    try {
      // Get user's own posts
      const userPosts = await this.getPostsByUser(userId, Math.ceil(limit / 2));
      
      // Get posts from following users
      let followingPosts: Post[] = [];
      if (followingList.length > 0) {
        // Firestore 'in' query limitation - max 10 items
        const chunks = this.chunkArray(followingList, 10);
        
        for (const chunk of chunks) {
          const filters: FirestoreFilter[] = [
            { field: 'userId', operator: 'in', value: chunk },
            { field: 'isActive', operator: '==', value: true }
          ];
          const posts = await this.getAll(filters, 'timestamp', 'desc', Math.ceil(limit / 2));
          followingPosts = [...followingPosts, ...posts];
        }
      }

      // Combine and sort posts
      const allPosts = [...userPosts, ...followingPosts]
        .sort((a, b) => {
          const aTime = a.timestamp && typeof a.timestamp === 'object' && 'seconds' in a.timestamp 
            ? a.timestamp.seconds 
            : 0;
          const bTime = b.timestamp && typeof b.timestamp === 'object' && 'seconds' in b.timestamp 
            ? b.timestamp.seconds 
            : 0;
          return (bTime as number) - (aTime as number);
        })
        .slice(0, limit);

      return allPosts;
    } catch (error) {
      console.error('❌ Error getting feed posts:', error);
      throw error;
    }
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId: string, userId: string, userInfo: UserInfo): Promise<LikeToggleResult> {
    try {
      const post = await this.getById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const likes = (post.likes as unknown[]) || [];
      const isLiked = likes.some((like: any) => like.userId === userId);
      
      let updatedLikes: unknown[];
      let updatedLikesCount: number;

      if (isLiked) {
        // Unlike
        updatedLikes = likes.filter((like: any) => like.userId !== userId);
        updatedLikesCount = (post.likesCount || 0) - 1;
        console.log('👎 Post unliked by:', userId);
      } else {
        // Like
        const likeData = {
          userId,
          userName: userInfo.displayName,
          userPhotoURL: userInfo.photoURL,
          timestamp: new Date().toISOString(),
        };
        updatedLikes = [...likes, likeData];
        updatedLikesCount = (post.likesCount || 0) + 1;
        console.log('👍 Post liked by:', userId);
      }

      await this.update(postId, {
        likes: updatedLikes,
        likesCount: Math.max(0, updatedLikesCount),
      } as Partial<Post>);

      return { liked: !isLiked, likesCount: updatedLikesCount };
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Add comment to post
   */
  async addComment(postId: string, commentData: CommentData): Promise<Comment> {
    try {
      const post = await this.getById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const comment: Comment = {
        id: `comment_${Date.now()}`,
        ...commentData,
        timestamp: new Date().toISOString(),
        likes: [],
        replies: [],
      };

      const updatedComments = [...((post.comments as unknown[]) || []), comment];
      const updatedCommentsCount = (post.commentsCount || 0) + 1;

      await this.update(postId, {
        comments: updatedComments,
        commentsCount: updatedCommentsCount,
      } as Partial<Post>);

      console.log('💬 Comment added to post:', postId);
      return comment;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Delete post (soft delete)
   */
  async deletePost(postId: string, userId: string): Promise<boolean> {
    try {
      const post = await this.getById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.userId !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      // Delete associated media from storage
      if (post.mediaUrl) {
        try {
          const mediaRef = ref(storage, post.mediaUrl);
          await deleteObject(mediaRef);
          console.log('🗑️ Media deleted from storage');
        } catch (error) {
          console.warn('⚠️ Could not delete media from storage:', error);
        }
      }

      // Soft delete - mark as inactive
      await this.update(postId, {
        isActive: false,
        deletedAt: new Date().toISOString(),
      } as Partial<Post>);

      console.log('🗑️ Post deleted successfully:', postId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Utility method to chunk arrays for Firestore 'in' queries
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get posts by user ID (alias for getPostsByUser for consistency with hook expectations)
   */
  async getUserPosts(userId: string, limit: number = 20): Promise<Post[]> {
    return this.getPostsByUser(userId, limit);
  }

  /**
   * Get posts from users that the current user is following
   */
  async getFollowingPosts(userId: string, limit: number = 20): Promise<Post[]> {
    try {
      // First, we need to get the list of users that this user is following
      // For now, we'll import the userService to get the following list
      const userService = await import('./userService');
      const userProfile = await userService.default.getById(userId);
      
      if (!userProfile || !userProfile.following || userProfile.following.length === 0) {
        console.log('📭 No following users found for user:', userId);
        return [];
      }

      const followingList = userProfile.following as string[];
      
      // Get posts from following users using the existing logic from getFeedPosts
      let followingPosts: Post[] = [];
      
      // Firestore 'in' query limitation - max 10 items
      const chunks = this.chunkArray(followingList, 10);
      
      for (const chunk of chunks) {
        const filters: FirestoreFilter[] = [
          { field: 'userId', operator: 'in', value: chunk },
          { field: 'isActive', operator: '==', value: true }
        ];
        const posts = await this.getAll(filters, 'timestamp', 'desc', limit);
        followingPosts = [...followingPosts, ...posts];
      }

      // Sort by timestamp and limit results
      const sortedPosts = followingPosts
        .sort((a, b) => {
          const aTime = a.timestamp && typeof a.timestamp === 'object' && 'seconds' in a.timestamp 
            ? a.timestamp.seconds 
            : 0;
          const bTime = b.timestamp && typeof b.timestamp === 'object' && 'seconds' in b.timestamp 
            ? b.timestamp.seconds 
            : 0;
          return (bTime as number) - (aTime as number);
        })
        .slice(0, limit);

      console.log('📋 Following posts loaded:', sortedPosts.length);
      return sortedPosts;
    } catch (error) {
      console.error('❌ Error getting following posts:', error);
      throw error;
    }
  }

  /**
   * Search posts by caption
   */
  async searchPosts(searchTerm: string, limit: number = 20): Promise<Post[]> {
    return this.search('caption', searchTerm, limit);
  }

  /**
   * Get trending posts (high engagement in last 24h)
   */
  async getTrendingPosts(limit: number = 20): Promise<Post[]> {
    // Simple trending algorithm - posts with high engagement in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filters: FirestoreFilter[] = [
      { field: 'timestamp', operator: '>=', value: oneDayAgo },
      { field: 'isActive', operator: '==', value: true }
    ];
    
    const posts = await this.getAll(filters, 'likesCount', 'desc', limit);
    return posts.filter(post => (post.likesCount || 0) > 0);
  }
}

export default new PostsService();

// Posts service with business logic and enhanced engagement data fetching
import { BaseService, FirestoreFilter } from './baseService';
import { COLLECTIONS } from '../../constants/firebase';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { Post, CreatePostData, Like, Comment as PostComment } from '../../types/models/post';
import { 
  sanitizeEngagementData, 
  hasUserLikedPost, 
  hasUserSharedPost,
  validatePostEngagement 
} from '../../utils/validation/engagementValidation';

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
 * Enhanced engagement metrics interface
 */
interface EngagementMetrics {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  hasShared?: boolean;
}

/**
 * Posts query options for enhanced data fetching
 */
interface PostsQueryOptions {
  includeEngagementMetrics?: boolean;
  currentUserId?: string;
  limit?: number;
  startAfter?: DocumentSnapshot;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated posts result with engagement data
 */
interface PaginatedPostsResult {
  posts: Post[];
  lastDocument: DocumentSnapshot | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Posts service providing business logic for post operations with enhanced engagement data fetching
 */
class PostsService extends BaseService<Post> {
  constructor() {
    super(COLLECTIONS.POSTS);
  }

  /**
   * Enhance post data with accurate engagement metrics using validation utilities
   */
  private enhancePostWithEngagement(postData: any, currentUserId?: string): Post {
    // First sanitize and validate the engagement data
    const sanitizedPost = sanitizeEngagementData(postData);
    
    // Add user interaction states
    const isLiked = currentUserId ? hasUserLikedPost(sanitizedPost.likes, currentUserId) : false;
    const hasShared = currentUserId ? hasUserSharedPost(sanitizedPost.shares, currentUserId) : false;

    // Return enhanced post with user interaction states
    return {
      ...sanitizedPost,
      isLiked,
      hasShared
    } as Post;
  }

  /**
   * Get posts with enhanced engagement data fetching
   */
  async getPostsWithEngagement(options: PostsQueryOptions = {}): Promise<PaginatedPostsResult> {
    try {
      const {
        includeEngagementMetrics = true,
        currentUserId,
        limit = 20,
        startAfter: startAfterDoc,
        orderBy: orderByField = 'timestamp',
        orderDirection = 'desc'
      } = options;

      let q;
      if (startAfterDoc) {
        q = query(
          collection(db, this.collectionName),
          orderBy(orderByField, orderDirection),
          startAfter(startAfterDoc),
          firestoreLimit(limit)
        );
      } else {
        q = query(
          collection(db, this.collectionName),
          orderBy(orderByField, orderDirection),
          firestoreLimit(limit)
        );
      }
      
      // Filter out inactive posts after fetching (if isActive field exists)
      // This is more flexible than using a where clause

      const querySnapshot = await getDocs(q);

      const posts: Post[] = [];
      let lastDocument: DocumentSnapshot | null = null;

      for (const docSnapshot of querySnapshot.docs) {
        const docData = docSnapshot.data() as Record<string, any>;
        const postData = { id: docSnapshot.id, ...docData };
        
        // Skip inactive posts if isActive field exists and is false
        if ('isActive' in docData && docData.isActive === false) {
          continue;
        }
        
        if (includeEngagementMetrics) {
          const enhancedPost = this.enhancePostWithEngagement(postData, currentUserId);
          posts.push(enhancedPost);
        } else {
          posts.push(postData as Post);
        }
        
        lastDocument = docSnapshot;
      }

      const hasMore = posts.length === limit;

      console.log(`✅ Retrieved ${posts.length} posts with engagement metrics`);
      return {
        posts,
        lastDocument,
        hasMore
      };
    } catch (error) {
      console.error('❌ Error fetching posts with engagement:', error);
      throw error;
    }
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
   * Get posts by user ID with enhanced engagement metrics
   */
  async getPostsByUser(userId: string, limit: number = 20, currentUserId?: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const postData = { id: doc.id, ...doc.data() };
        const enhancedPost = this.enhancePostWithEngagement(postData, currentUserId);
        posts.push(enhancedPost);
      });

      console.log(`✅ Retrieved ${posts.length} posts for user ${userId} with engagement metrics`);
      return posts;
    } catch (error) {
      console.error('❌ Error getting user posts with engagement:', error);
      throw error;
    }
  }

  /**
   * Get feed posts for user (following + own posts) with enhanced engagement metrics
   */
  async getFeedPosts(userId: string, followingList: string[] = [], limit: number = 20): Promise<Post[]> {
    try {
      // Get user's own posts with engagement metrics
      const userPosts = await this.getPostsByUser(userId, Math.ceil(limit / 2), userId);
      
      // Get posts from following users with engagement metrics
      let followingPosts: Post[] = [];
      if (followingList.length > 0) {
        // Firestore 'in' query limitation - max 10 items
        const chunks = this.chunkArray(followingList, 10);
        
        for (const chunk of chunks) {
          const q = query(
            collection(db, this.collectionName),
            where('userId', 'in', chunk),
            where('isActive', '==', true),
            orderBy('timestamp', 'desc'),
            firestoreLimit(Math.ceil(limit / 2))
          );

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const postData = { id: doc.id, ...doc.data() };
            const enhancedPost = this.enhancePostWithEngagement(postData, userId);
            followingPosts.push(enhancedPost);
          });
        }
      }

      // Combine and sort posts by timestamp
      const allPosts = [...userPosts, ...followingPosts]
        .sort((a, b) => {
          const getTimestamp = (timestamp: any): number => {
            if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
              return timestamp.seconds;
            }
            if (timestamp instanceof Date) {
              return timestamp.getTime() / 1000;
            }
            if (typeof timestamp === 'string') {
              return new Date(timestamp).getTime() / 1000;
            }
            return 0;
          };
          
          return getTimestamp(b.timestamp) - getTimestamp(a.timestamp);
        })
        .slice(0, limit);

      console.log(`✅ Retrieved ${allPosts.length} feed posts with engagement metrics`);
      return allPosts;
    } catch (error) {
      console.error('❌ Error getting feed posts with engagement:', error);
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
  async addComment(postId: string, commentData: CommentData): Promise<PostComment> {
    try {
      const post = await this.getById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const comment: PostComment = {
        id: `comment_${Date.now()}`,
        text: commentData.text,
        userId: commentData.userId,
        userDisplayName: commentData.userDisplayName,
        userPhotoURL: commentData.userPhotoURL,
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
  async getUserPosts(userId: string, limit: number = 20, currentUserId?: string): Promise<Post[]> {
    return this.getPostsByUser(userId, limit, currentUserId);
  }

  /**
   * Get posts with pagination and enhanced engagement metrics
   */
  async getPosts(options: PostsQueryOptions = {}): Promise<PaginatedPostsResult> {
    return this.getPostsWithEngagement(options);
  }

  /**
   * Get single post by ID with enhanced engagement metrics
   */
  async getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
    try {
      const docRef = doc(db, this.collectionName, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const postData = { id: docSnap.id, ...docSnap.data() };
        const enhancedPost = this.enhancePostWithEngagement(postData, currentUserId);
        console.log(`✅ Retrieved post ${postId} with engagement metrics`);
        return enhancedPost;
      } else {
        console.warn(`⚠️ Post not found: ${postId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting post ${postId} with engagement:`, error);
      throw error;
    }
  }

  /**
   * Get posts from users that the current user is following with enhanced engagement metrics
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
      
      // Get posts from following users with engagement metrics
      let followingPosts: Post[] = [];
      
      // Firestore 'in' query limitation - max 10 items
      const chunks = this.chunkArray(followingList, 10);
      
      for (const chunk of chunks) {
        const q = query(
          collection(db, this.collectionName),
          where('userId', 'in', chunk),
          where('isActive', '==', true),
          orderBy('timestamp', 'desc'),
          firestoreLimit(limit)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const postData = { id: doc.id, ...doc.data() };
          const enhancedPost = this.enhancePostWithEngagement(postData, userId);
          followingPosts.push(enhancedPost);
        });
      }

      // Sort by timestamp and limit results
      const sortedPosts = followingPosts
        .sort((a, b) => {
          const getTimestamp = (timestamp: any): number => {
            if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
              return timestamp.seconds;
            }
            if (timestamp instanceof Date) {
              return timestamp.getTime() / 1000;
            }
            if (typeof timestamp === 'string') {
              return new Date(timestamp).getTime() / 1000;
            }
            return 0;
          };
          
          return getTimestamp(b.timestamp) - getTimestamp(a.timestamp);
        })
        .slice(0, limit);

      console.log(`✅ Retrieved ${sortedPosts.length} following posts with engagement metrics`);
      return sortedPosts;
    } catch (error) {
      console.error('❌ Error getting following posts with engagement:', error);
      throw error;
    }
  }

  /**
   * Search posts by caption with enhanced engagement metrics
   */
  async searchPosts(searchTerm: string, limit: number = 20, currentUserId?: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('caption', '>=', searchTerm),
        where('caption', '<=', searchTerm + '\uf8ff'),
        where('isActive', '==', true),
        orderBy('caption'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const postData = { id: doc.id, ...doc.data() };
        const enhancedPost = this.enhancePostWithEngagement(postData, currentUserId);
        posts.push(enhancedPost);
      });

      console.log(`🔍 Found ${posts.length} posts matching "${searchTerm}" with engagement metrics`);
      return posts;
    } catch (error) {
      console.error('❌ Error searching posts with engagement:', error);
      throw error;
    }
  }

  /**
   * Get trending posts (high engagement in last 24h) with enhanced engagement metrics
   */
  async getTrendingPosts(limit: number = 20, currentUserId?: string): Promise<Post[]> {
    try {
      // Simple trending algorithm - posts with high engagement in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneDayAgoTimestamp = Timestamp.fromDate(oneDayAgo);
      
      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '>=', oneDayAgoTimestamp),
        where('isActive', '==', true),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit * 2) // Get more to filter by engagement
      );

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const postData = { id: doc.id, ...doc.data() };
        const enhancedPost = this.enhancePostWithEngagement(postData, currentUserId);
        
        // Only include posts with some engagement
        if (enhancedPost.likesCount > 0 || enhancedPost.commentsCount > 0 || enhancedPost.sharesCount > 0) {
          posts.push(enhancedPost);
        }
      });

      // Sort by total engagement score
      const trendingPosts = posts
        .sort((a, b) => {
          const scoreA = (a.likesCount * 1) + (a.commentsCount * 2) + (a.sharesCount * 3);
          const scoreB = (b.likesCount * 1) + (b.commentsCount * 2) + (b.sharesCount * 3);
          return scoreB - scoreA;
        })
        .slice(0, limit);

      console.log(`📈 Retrieved ${trendingPosts.length} trending posts with engagement metrics`);
      return trendingPosts;
    } catch (error) {
      console.error('❌ Error getting trending posts with engagement:', error);
      throw error;
    }
  }
}

export default new PostsService();

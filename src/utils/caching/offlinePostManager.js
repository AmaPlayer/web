// Offline post creation and queuing system - Phase 3 implementation
// Handles offline post creation, queuing, and synchronization

import { idbStore } from './indexedDB';
import { queryClient } from '../../lib/queryClient';

// Offline post status constants
export const POST_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  DRAFT: 'draft'
};

// Offline post manager class
export class OfflinePostManager {
  static instance = null;

  constructor() {
    if (OfflinePostManager.instance) {
      return OfflinePostManager.instance;
    }
    OfflinePostManager.instance = this;
    this.isInitialized = false;
  }

  // Initialize the offline post manager
  async init() {
    if (this.isInitialized) return;
    
    try {
      await idbStore.init();
      this.isInitialized = true;
      console.log('OfflinePostManager initialized');
    } catch (error) {
      console.error('Failed to initialize OfflinePostManager:', error);
      throw error;
    }
  }

  // Create offline post as per documentation example
  async createOfflinePost(postData, userId) {
    try {
      await this.init();

      const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlinePost = {
        ...postData,
        id: offlineId,
        userId: userId,
        status: POST_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncPending: true,
        isOffline: true,
        retryCount: 0,
        maxRetries: 3
      };

      // Store in IndexedDB
      await idbStore.addOfflinePost(offlinePost);

      // Add to sync queue
      await this.addToSyncQueue({
        id: `sync_${offlineId}`,
        type: 'post',
        action: 'create',
        data: offlinePost,
        priority: 1, // High priority for posts
        createdAt: Date.now(),
        retryCount: 0
      });

      // Queue for background sync if supported
      await this.queueBackgroundSync('post-sync');

      // Update React Query cache optimistically
      this.updateQueryCacheOptimistically(offlinePost);

      console.log('Offline post created:', offlineId);
      return offlinePost;
    } catch (error) {
      console.error('Failed to create offline post:', error);
      throw error;
    }
  }

  // Create offline like
  async createOfflineLike(postId, userId) {
    try {
      await this.init();

      const offlineId = `like_offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineLike = {
        id: offlineId,
        postId: postId,
        userId: userId,
        status: POST_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        syncPending: true,
        isOffline: true
      };

      // Store in IndexedDB
      await idbStore.addOfflineLike(offlineLike);

      // Add to sync queue
      await this.addToSyncQueue({
        id: `sync_${offlineId}`,
        type: 'like',
        action: 'create',
        data: offlineLike,
        priority: 2, // Medium priority
        createdAt: Date.now(),
        retryCount: 0
      });

      // Queue for background sync
      await this.queueBackgroundSync('like-sync');

      console.log('Offline like created:', offlineId);
      return offlineLike;
    } catch (error) {
      console.error('Failed to create offline like:', error);
      throw error;
    }
  }

  // Create offline comment
  async createOfflineComment(postId, userId, content) {
    try {
      await this.init();

      const offlineId = `comment_offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineComment = {
        id: offlineId,
        postId: postId,
        userId: userId,
        content: content,
        status: POST_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        syncPending: true,
        isOffline: true
      };

      // Store in IndexedDB
      await idbStore.addOfflineComment(offlineComment);

      // Add to sync queue
      await this.addToSyncQueue({
        id: `sync_${offlineId}`,
        type: 'comment',
        action: 'create',
        data: offlineComment,
        priority: 2, // Medium priority
        createdAt: Date.now(),
        retryCount: 0
      });

      // Queue for background sync
      await this.queueBackgroundSync('comment-sync');

      console.log('Offline comment created:', offlineId);
      return offlineComment;
    } catch (error) {
      console.error('Failed to create offline comment:', error);
      throw error;
    }
  }

  // Create offline follow action
  async createOfflineFollow(followerId, followingId, action = 'follow') {
    try {
      await this.init();

      const offlineId = `follow_offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineFollow = {
        id: offlineId,
        followerId: followerId,
        followingId: followingId,
        action: action, // 'follow' or 'unfollow'
        status: POST_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        syncPending: true,
        isOffline: true
      };

      // Store in IndexedDB
      await idbStore.addOfflineFollow(offlineFollow);

      // Add to sync queue
      await this.addToSyncQueue({
        id: `sync_${offlineId}`,
        type: 'follow',
        action: action,
        data: offlineFollow,
        priority: 3, // Lower priority
        createdAt: Date.now(),
        retryCount: 0
      });

      // Queue for background sync
      await this.queueBackgroundSync('follow-sync');

      console.log(`Offline ${action} created:`, offlineId);
      return offlineFollow;
    } catch (error) {
      console.error(`Failed to create offline ${action}:`, error);
      throw error;
    }
  }

  // Add item to sync queue
  async addToSyncQueue(item) {
    try {
      await idbStore.addToSyncQueue(item);
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  // Queue for background sync as per documentation
  async queueBackgroundSync(tag) {
    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`Background sync queued: ${tag}`);
      } else {
        console.warn('Background sync not supported');
        // Fallback: attempt immediate sync
        await this.attemptImmediateSync();
      }
    } catch (error) {
      console.error('Failed to queue background sync:', error);
    }
  }

  // Attempt immediate sync when background sync is not available
  async attemptImmediateSync() {
    if (navigator.onLine) {
      try {
        await this.syncPendingPosts();
        await this.syncPendingLikes();
        await this.syncPendingComments();
        await this.syncPendingFollows();
      } catch (error) {
        console.error('Immediate sync failed:', error);
      }
    }
  }

  // Sync pending posts
  async syncPendingPosts() {
    try {
      const pendingPosts = await idbStore.getPendingPosts();
      console.log(`Syncing ${pendingPosts.length} pending posts`);

      for (const post of pendingPosts) {
        try {
          await this.syncSinglePost(post);
        } catch (error) {
          console.error('Failed to sync post:', post.id, error);
          await this.handleSyncError(post, 'post');
        }
      }
    } catch (error) {
      console.error('Failed to sync pending posts:', error);
    }
  }

  // Sync single post to Firebase
  async syncSinglePost(post) {
    try {
      // Update status to syncing
      await idbStore.addOfflinePost({ ...post, status: POST_STATUS.SYNCING });

      // Import Firebase service dynamically
      const { createPost } = await import('../../services/api/postsService');
      
      // Create post on server
      const serverPost = await createPost({
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        userId: post.userId
      });

      // Remove from IndexedDB after successful sync
      await idbStore.deleteOfflinePost(post.id);
      
      // Remove from sync queue
      const syncItem = await idbStore.getSyncQueueByType('post');
      const matchingItem = syncItem.find(item => item.data.id === post.id);
      if (matchingItem) {
        await idbStore.removeFromSyncQueue(matchingItem.id);
      }

      // Update React Query cache with server data
      queryClient.setQueryData(['posts', serverPost.id], serverPost);
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      console.log('Post synced successfully:', post.id, '→', serverPost.id);
      return serverPost;
    } catch (error) {
      console.error('Failed to sync single post:', error);
      throw error;
    }
  }

  // Sync pending likes
  async syncPendingLikes() {
    try {
      const pendingLikes = await idbStore.getPendingLikes();
      console.log(`Syncing ${pendingLikes.length} pending likes`);

      for (const like of pendingLikes) {
        try {
          // Import and call like service
          const { likePost } = await import('../../services/api/postsService');
          await likePost(like.postId, like.userId);
          
          // Remove from IndexedDB
          await idbStore.deleteOfflineLike(like.id);
          
          // Remove from sync queue
          const syncItems = await idbStore.getSyncQueueByType('like');
          const matchingItem = syncItems.find(item => item.data.id === like.id);
          if (matchingItem) {
            await idbStore.removeFromSyncQueue(matchingItem.id);
          }

          console.log('Like synced successfully:', like.id);
        } catch (error) {
          console.error('Failed to sync like:', like.id, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending likes:', error);
    }
  }

  // Sync pending comments
  async syncPendingComments() {
    try {
      const pendingComments = await idbStore.getPendingComments();
      console.log(`Syncing ${pendingComments.length} pending comments`);

      for (const comment of pendingComments) {
        try {
          // Import and call comment service
          const { addComment } = await import('../../services/api/postsService');
          await addComment(comment.postId, comment.userId, comment.content);
          
          // Remove from IndexedDB
          await idbStore.deleteOfflineComment(comment.id);
          
          // Remove from sync queue
          const syncItems = await idbStore.getSyncQueueByType('comment');
          const matchingItem = syncItems.find(item => item.data.id === comment.id);
          if (matchingItem) {
            await idbStore.removeFromSyncQueue(matchingItem.id);
          }

          console.log('Comment synced successfully:', comment.id);
        } catch (error) {
          console.error('Failed to sync comment:', comment.id, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending comments:', error);
    }
  }

  // Sync pending follows
  async syncPendingFollows() {
    try {
      const pendingFollows = await idbStore.getPendingFollows();
      const pendingUnfollows = await idbStore.getPendingUnfollows();
      
      console.log(`Syncing ${pendingFollows.length} follows and ${pendingUnfollows.length} unfollows`);

      // Sync follows
      for (const follow of pendingFollows) {
        try {
          const { followUser } = await import('../../services/api/userService');
          await followUser(follow.followerId, follow.followingId);
          await idbStore.deleteOfflineFollow(follow.id);
          console.log('Follow synced successfully:', follow.id);
        } catch (error) {
          console.error('Failed to sync follow:', follow.id, error);
        }
      }

      // Sync unfollows
      for (const unfollow of pendingUnfollows) {
        try {
          const { unfollowUser } = await import('../../services/api/userService');
          await unfollowUser(unfollow.followerId, unfollow.followingId);
          await idbStore.deleteOfflineFollow(unfollow.id);
          console.log('Unfollow synced successfully:', unfollow.id);
        } catch (error) {
          console.error('Failed to sync unfollow:', unfollow.id, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending follows:', error);
    }
  }

  // Handle sync errors
  async handleSyncError(item, type) {
    const retryCount = (item.retryCount || 0) + 1;
    const maxRetries = item.maxRetries || 3;

    if (retryCount >= maxRetries) {
      // Mark as failed
      const updatedItem = { ...item, status: POST_STATUS.FAILED, retryCount };
      
      switch (type) {
        case 'post':
          await idbStore.addOfflinePost(updatedItem);
          break;
        case 'like':
          await idbStore.addOfflineLike(updatedItem);
          break;
        case 'comment':
          await idbStore.addOfflineComment(updatedItem);
          break;
        case 'follow':
          await idbStore.addOfflineFollow(updatedItem);
          break;
      }
    } else {
      // Increment retry count and try again later
      const updatedItem = { ...item, retryCount };
      
      switch (type) {
        case 'post':
          await idbStore.addOfflinePost(updatedItem);
          break;
        case 'like':
          await idbStore.addOfflineLike(updatedItem);
          break;
        case 'comment':
          await idbStore.addOfflineComment(updatedItem);
          break;
        case 'follow':
          await idbStore.addOfflineFollow(updatedItem);
          break;
      }
    }
  }

  // Update React Query cache optimistically
  updateQueryCacheOptimistically(offlinePost) {
    try {
      // Add to posts cache
      const existingPosts = queryClient.getQueryData(['posts']) || [];
      queryClient.setQueryData(['posts'], [offlinePost, ...existingPosts]);

      // Add to user posts cache if available
      const userPosts = queryClient.getQueryData(['posts', 'user', offlinePost.userId]) || [];
      queryClient.setQueryData(['posts', 'user', offlinePost.userId], [offlinePost, ...userPosts]);
    } catch (error) {
      console.error('Failed to update query cache optimistically:', error);
    }
  }

  // Get all offline posts for display
  async getAllOfflinePosts() {
    try {
      await this.init();
      return await idbStore.getAllOfflinePosts();
    } catch (error) {
      console.error('Failed to get offline posts:', error);
      return [];
    }
  }

  // Get pending sync count
  async getPendingSyncCount() {
    try {
      await this.init();
      const [posts, likes, comments, follows] = await Promise.all([
        idbStore.getPendingPosts(),
        idbStore.getPendingLikes(), 
        idbStore.getPendingComments(),
        idbStore.getPendingFollows()
      ]);

      return {
        posts: posts.length,
        likes: likes.length,
        comments: comments.length,
        follows: follows.length,
        total: posts.length + likes.length + comments.length + follows.length
      };
    } catch (error) {
      console.error('Failed to get pending sync count:', error);
      return { posts: 0, likes: 0, comments: 0, follows: 0, total: 0 };
    }
  }

  // Clear all offline data
  async clearAllOfflineData() {
    try {
      await this.init();
      await Promise.all([
        idbStore.clear('offline_posts'),
        idbStore.clear('offline_likes'),
        idbStore.clear('offline_comments'),
        idbStore.clear('offline_follows'),
        idbStore.clear('sync_queue')
      ]);
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
}

// Create singleton instance
export const offlinePostManager = new OfflinePostManager();

// Convenience functions as per documentation examples
export const createOfflinePost = async (postData, userId) => {
  return await offlinePostManager.createOfflinePost(postData, userId);
};

export const createOfflineLike = async (postId, userId) => {
  return await offlinePostManager.createOfflineLike(postId, userId);
};

export const createOfflineComment = async (postId, userId, content) => {
  return await offlinePostManager.createOfflineComment(postId, userId, content);
};

export const createOfflineFollow = async (followerId, followingId, action = 'follow') => {
  return await offlinePostManager.createOfflineFollow(followerId, followingId, action);
};

export default offlinePostManager;
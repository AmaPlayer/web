import { useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Post, User } from '../types/models';
import { usePostsStore } from '../store/appStore';
import { usePerformanceMonitor } from './usePerformanceMonitor';

const notificationService = {
  sendLikeNotification: async (...args: any[]) => { }
};

const filterPostContent = (text: string, options?: any) => ({
  isClean: true,
  shouldFlag: false,
  shouldBlock: false,
  shouldWarn: false,
  violations: [],
  categories: []
});

const getPostViolationMessage = (violations: any[], categories: any[]) => '';
const logPostViolation = async (...args: any[]) => { };

interface UpdatePostData {
  caption?: string;
  [key: string]: any;
}

interface UsePostOperationsReturn {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadPosts: (loadMore?: boolean) => Promise<void>;
  refreshPosts: () => Promise<void>;
  createPost: (postData: { text: string; mediaFile?: File; currentUser: User }) => Promise<void>;
  updatePost: (postId: string, updates: UpdatePostData & { currentUser?: User }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string, currentLikes: string[], currentUser: User, postData?: Post | null) => Promise<void>;
  updatePostShareData: (postId: string, userId: string, shareType: 'friends' | 'feeds' | 'groups', isAdding?: boolean) => Promise<void>;
  getPostShareInfo: (postId: string) => any;
  hasUserSharedPost: (postId: string, userId: string) => boolean;
}

const POSTS_PER_PAGE = 10;

/**
 * Custom hook for handling all post CRUD operations
 * Extracts post-related logic from Home component
 */
export const usePostOperations = (): UsePostOperationsReturn => {
  const { measureApiCall } = usePerformanceMonitor('usePostOperations');

  const {
    posts,
    hasMore,
    lastDoc,
    loading: storeLoading,
    error: storeError,
    setPosts,
    addPosts,
    addPost,
    updatePost: updatePostInStore,
    removePost,
    setHasMore,
    setLastDoc,
    setLoading: setStoreLoading,
    setError: setStoreError
  } = usePostsStore();

  /**
   * Load posts with pagination support
   * @param {boolean} loadMore - Whether to load more posts or refresh
   */
  const loadPosts = useCallback(async (loadMore: boolean = false): Promise<void> => {
    if (storeLoading) return;

    setStoreLoading(true);
    setStoreError(null);

    try {
      const apiCall = async () => {
        let q;
        if (loadMore && lastDoc) {
          q = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc'),
            startAfter(lastDoc),
            limit(POSTS_PER_PAGE)
          );
        } else {
          q = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc'),
            limit(POSTS_PER_PAGE)
          );
        }

        return await getDocs(q);
      };

      const querySnapshot = await measureApiCall(apiCall, 'loadPosts');
      const postsData: Post[] = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data() as Record<string, any>;
        if (!docData) return;
        const postData = { id: doc.id, ...docData } as Post;

        // Clean up comment objects to prevent React error #31
        if (postData.comments && Array.isArray(postData.comments)) {
          postData.comments = postData.comments.map(comment => {
            if (typeof comment === 'object' && comment !== null) {
              const { postId, ...cleanComment } = comment as any;
              return {
                id: cleanComment.id || '',
                text: String(cleanComment.text || ''),
                userId: String(cleanComment.userId || ''),
                userDisplayName: String(cleanComment.userDisplayName || 'Unknown User'),
                userPhotoURL: String(cleanComment.userPhotoURL || ''),
                timestamp: cleanComment.timestamp || null,
                likes: cleanComment.likes || [],
                likesCount: cleanComment.likesCount || 0
              };
            }
            return comment;
          });
        }

        // Ensure share fields exist with defaults for backward compatibility
        if (!postData.shares) {
          postData.shares = [];
        }
        if (typeof postData.shareCount !== 'number') {
          postData.shareCount = postData.shares?.length || 0;
        }
        if (!postData.shareMetadata) {
          postData.shareMetadata = {
            lastSharedAt: null,
            shareBreakdown: {
              friends: 0,
              feeds: 0,
              groups: 0
            }
          };
        }

        postsData.push(postData);
      });

      if (loadMore) {
        addPosts(postsData);
      } else {
        // Initial load
        setPosts(postsData);
      }

      // Update pagination state
      if (querySnapshot.docs.length > 0) {
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastDoc(lastVisible);
        setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      } else {
        // No more posts available
        setHasMore(false);
      }

    } catch (err: any) {
      setStoreError(err.message);
      // On error, stop trying to load more posts
      if (loadMore) {
        setHasMore(false);
      }
    } finally {
      setStoreLoading(false);
    }
  }, [storeLoading, lastDoc, measureApiCall, setPosts, addPosts, setHasMore, setLastDoc, setStoreLoading, setStoreError]);

  /**
   * Refresh posts - reset pagination and load fresh posts
   */
  const refreshPosts = useCallback(async (): Promise<void> => {
    setLastDoc(null);
    setHasMore(true);
    await loadPosts(false);
  }, [loadPosts, setLastDoc, setHasMore]);

  /**
   * Create a new post
   * @param {Object} postData - Post creation data
   */
  const createPost = useCallback(async (postData: {
    text: string;
    mediaFile?: File;
    currentUser: User;
  }): Promise<void> => {
    const { text, mediaFile, currentUser } = postData;

    if (!text?.trim() && !mediaFile) {
      throw new Error('Please write something or select media to share');
    }

    setStoreLoading(true);
    setStoreError(null);

    try {
      // Content filtering
      if (text) {
        const filterResult = filterPostContent(text, {
          context: 'sports_post',
          languages: ['english', 'hindi']
        });

        if (!filterResult.isClean) {
          if (filterResult.shouldFlag) {
            await logPostViolation(currentUser.uid, text, filterResult.violations, 'home_post');
          }

          if (filterResult.shouldBlock || filterResult.shouldWarn) {
            const violationMsg = getPostViolationMessage(filterResult.violations, filterResult.categories);
            throw new Error(`You can't post this content: ${violationMsg}`);
          }
        }
      }

      let mediaUrl: string | null = null;
      let mediaType: 'image' | 'video' | null = null;

      // Upload media if selected
      if (mediaFile) {
        const filename = `posts/${currentUser.uid}/${Date.now()}_${mediaFile.name}`;
        const storageRef = ref(storage, filename);

        const snapshot = await uploadBytes(storageRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Create post document
      const newPostData: any = {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous User',
        userPhotoURL: currentUser.photoURL || '',
        caption: text,
        timestamp: serverTimestamp(),
        likes: [],
        comments: [],
        // Enhanced sharing fields
        shares: [],
        shareCount: 0,
        shareMetadata: {
          lastSharedAt: null,
          shareBreakdown: {
            friends: 0,
            feeds: 0,
            groups: 0
          }
        }
      };

      if (mediaUrl) {
        newPostData.imageUrl = mediaUrl;
        newPostData.mediaType = mediaType;
      }

      await addDoc(collection(db, 'posts'), newPostData);

      // Refresh posts to show the new post
      await refreshPosts();

    } catch (err: any) {
      setStoreError(err.message);
      throw err;
    } finally {
      setStoreLoading(false);
    }
  }, [refreshPosts, setStoreError, setStoreLoading]);

  /**
   * Update an existing post
   * @param {string} postId - Post ID to update
   * @param {Object} updates - Updates to apply
   */
  const updatePost = useCallback(async (
    postId: string,
    updates: UpdatePostData & { currentUser?: User }
  ): Promise<void> => {
    setStoreLoading(true);
    setStoreError(null);

    try {
      // Content filtering for edited posts
      if (updates.caption) {
        const filterResult = filterPostContent(updates.caption, {
          context: 'sports_post',
          languages: ['english', 'hindi']
        });

        if (!filterResult.isClean) {
          if (filterResult.shouldFlag) {
            await logPostViolation(updates.currentUser?.uid || '', updates.caption, filterResult.violations, 'edit_post');
          }

          if (filterResult.shouldBlock || filterResult.shouldWarn) {
            const violationMsg = getPostViolationMessage(filterResult.violations, filterResult.categories);
            throw new Error(`You can't save this content: ${violationMsg}`);
          }
        }
      }

      const postRef = doc(db, 'posts', postId);
      const updateData: any = { ...updates };
      delete updateData.currentUser; // Remove currentUser from update data

      if (updates.caption) {
        updateData.editedAt = serverTimestamp();
      }

      await updateDoc(postRef, updateData);

      // Update local state
      updatePostInStore(postId, {
        ...updateData as any,
        editedAt: new Date()
      });

    } catch (err: any) {
      setStoreError(err.message);
      throw err;
    } finally {
      setStoreLoading(false);
    }
  }, [updatePostInStore, setStoreError, setStoreLoading]);

  /**
   * Delete a post
   * @param {string} postId - Post ID to delete
   */
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    setStoreLoading(true);
    setStoreError(null);

    try {
      await deleteDoc(doc(db, 'posts', postId));

      // Update local state to remove the deleted post
      removePost(postId);

    } catch (err: any) {
      setStoreError(err.message);
      throw err;
    } finally {
      setStoreLoading(false);
    }
  }, [removePost, setStoreError, setStoreLoading]);

  /**
   * Like or unlike a post
   */
  const likePost = useCallback(async (
    postId: string,
    currentLikes: string[],
    currentUser: User,
    postData: Post | null = null
  ): Promise<void> => {
    if (!currentUser) return;

    setStoreError(null);

    try {
      const postRef = doc(db, 'posts', postId);
      const userLiked = currentLikes.includes(currentUser.uid);

      if (userLiked) {
        // Remove like
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        // Add like
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });

        // Send notification to post owner (only when liking, not unliking)
        if (postData && postData.userId && postData.userId !== currentUser.uid) {
          try {
            await notificationService.sendLikeNotification(
              currentUser.uid,
              currentUser.displayName || 'Someone',
              currentUser.photoURL || '',
              postData.userId,
              postId,
              postData
            );
          } catch (notificationError) {
            // Error sending like notification - logged in production
            console.warn('Failed to send like notification:', notificationError);
          }
        }
      }
    } catch (err: any) {
      setStoreError(err.message);
      throw err;
    }
  }, [setStoreError]);

  /**
   * Update post share data
   */
  const updatePostShareData = useCallback(async (
    postId: string,
    userId: string,
    shareType: 'friends' | 'feeds' | 'groups',
    isAdding: boolean = true
  ): Promise<void> => {
    if (!userId) return;

    setStoreError(null);

    try {
      const postRef = doc(db, 'posts', postId);
      const increment = isAdding ? 1 : -1;

      if (isAdding) {
        // Add share
        await updateDoc(postRef, {
          shares: arrayUnion(userId),
          shareCount: increment,
          [`shareMetadata.shareBreakdown.${shareType}`]: increment,
          'shareMetadata.lastSharedAt': serverTimestamp()
        });
      } else {
        // Remove share
        await updateDoc(postRef, {
          shares: arrayRemove(userId),
          shareCount: increment,
          [`shareMetadata.shareBreakdown.${shareType}`]: increment
        });
      }

      // Update local state
      const post = posts.find(p => p.id === postId);
      if (post) {
        updatePostInStore(postId, {
          shares: isAdding
            ? [...(post.shares || []), userId]
            : (post.shares || []).filter(id => id !== userId),
          shareCount: Math.max(0, (post.shareCount || 0) + increment),
          shareMetadata: {
            ...post.shareMetadata,
            lastSharedAt: isAdding ? new Date() : post.shareMetadata?.lastSharedAt || null,
            shareBreakdown: {
              ...post.shareMetadata?.shareBreakdown,
              [shareType]: Math.max(0, (post.shareMetadata?.shareBreakdown?.[shareType] || 0) + increment)
            }
          }
        });
      }

    } catch (err: any) {
      setStoreError(err.message);
      throw err;
    }
  }, [posts, updatePostInStore, setStoreError]);

  /**
   * Get share information for a post
   */
  const getPostShareInfo = useCallback((postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    return {
      shares: post.shares || [],
      shareCount: post.shareCount || 0,
      shareMetadata: post.shareMetadata || {
        lastSharedAt: null,
        shareBreakdown: {
          friends: 0,
          feeds: 0,
          groups: 0
        }
      }
    };
  }, [posts]);

  /**
   * Check if user has shared a post
   */
  const hasUserSharedPost = useCallback((postId: string, userId: string): boolean => {
    const post = posts.find(p => p.id === postId);
    return post?.shares?.includes(userId) || false;
  }, [posts]);

  return {
    posts,
    loading: storeLoading,
    hasMore,
    error: storeError,
    loadPosts,
    refreshPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    // Enhanced sharing operations
    updatePostShareData,
    getPostShareInfo,
    hasUserSharedPost
  };
};

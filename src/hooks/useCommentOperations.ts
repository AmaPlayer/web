import { useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Comment } from '../types/models';

// Mock notification service
const notificationService = {
  sendCommentNotification: async (...args: any[]) => {}
};

// Mock implementations for content filtering
const filterChatMessage = (text: string) => ({
  isClean: true,
  violations: [],
  categories: []
});

const getChatViolationMessage = (violations: any[], categories: any[]) => 'Content violation detected';

const logChatViolation = async (userId: string, content: string, violations: any[], context: string) => {
  console.log('Chat violation logged:', { userId, content, violations, context });
};

interface UseCommentOperationsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (postId: string, text: string, currentUser: any, postData?: any, isGuest?: boolean) => Promise<void>;
  updateComment: (postId: string, commentId: string, text: string) => Promise<void>;
  deleteComment: (postId: string, commentIndex: number, currentUser: any, comments: any[]) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  refreshComments: (postId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for handling comment operations
 * Extracts comment-related logic from Home component
 */
export const useCommentOperations = (): UseCommentOperationsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  /**
   * Add a comment to a post
   */
  const addComment = useCallback(async (
    postId: string, 
    text: string, 
    currentUser: any,
    postData?: any,
    isGuest?: boolean
  ): Promise<void> => {
    if (!text?.trim()) {
      throw new Error('Comment text is required');
    }

    setLoading(true);
    setError(null);

    try {
      // Content filtering for comments - use strict chat filter
      const filterResult = filterChatMessage(text.trim());

      if (!filterResult.isClean) {
        const violationMessage = getChatViolationMessage(filterResult.violations, filterResult.categories);
        throw new Error(`You can't post this comment.\n\n${violationMessage}\n\nTip: Share positive sports content, training updates, or encouraging messages!`);
      }

      // Create comment data
      const commentData: any = {
        text: text.trim(),
        postId,
        userId: currentUser?.uid,
        userDisplayName: currentUser?.displayName || 'Anonymous',
        userPhotoURL: currentUser?.photoURL,
        timestamp: serverTimestamp(),
        isGuest: isGuest || false
      };

      // Add comment to comments collection
      await addDoc(collection(db, 'comments'), commentData);

      // Update post's comment count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(commentData)
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a comment
   */
  const updateComment = useCallback(async (
    postId: string, 
    commentId: string, 
    text: string
  ): Promise<void> => {
    if (!text?.trim()) {
      throw new Error('Comment text is required');
    }

    setLoading(true);
    setError(null);

    try {
      const filterResult = filterChatMessage(text.trim());

      if (!filterResult.isClean) {
        const violationMessage = getChatViolationMessage(filterResult.violations, filterResult.categories);
        throw new Error(`You can't update this comment.\n\n${violationMessage}`);
      }

      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        text: text.trim(),
        updatedAt: serverTimestamp()
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a comment from a post
   */
  const deleteComment = useCallback(async (
    postId: string, 
    commentIndex: number,
    currentUser: any,
    comments: any[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Validate comment ownership
      const comment = comments[commentIndex];
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      if (comment.userId !== currentUser?.uid) {
        throw new Error('You can only delete your own comments');
      }

      // Remove comment from Firebase
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayRemove(comment)
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Like a comment
   */
  const likeComment = useCallback(async (
    postId: string, 
    commentId: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likes: arrayUnion('userId') // This should be replaced with actual userId
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load comments for a post
   */
  const loadComments = useCallback(async (postId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Implementation would fetch comments from Firestore
      setComments([]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh comments for a post
   */
  const refreshComments = useCallback(async (postId: string): Promise<void> => {
    await loadComments(postId);
  }, [loadComments]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    likeComment,
    loadComments,
    refreshComments,
    clearError
  };
};

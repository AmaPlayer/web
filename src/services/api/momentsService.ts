// Moments service with business logic for video content management
import { db, storage } from '../../lib/firebase';
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
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  MomentVideo,
  CreateMomentData,
  UpdateMomentData,
  MomentsQueryOptions,
  PaginatedMomentsResult,
  VideoComment,
  CreateVideoCommentData,
  ToggleVideoLikeResult,
  VideoUploadResult,
  MomentInteraction,
  VideoLike
} from '../../types/models/moment';
/**
 * Ser
vice class for managing moments (video content) operations
 */
export class MomentsService {
  private static readonly COLLECTION_NAME = 'moments';
  private static readonly COMMENTS_COLLECTION = 'comments';
  private static readonly INTERACTIONS_COLLECTION = 'interactions';
  private static readonly STORAGE_PATH = 'moments';

  /**
   * Fetch paginated moments with optional filtering
   */
  static async getMoments(options: MomentsQueryOptions = {}): Promise<PaginatedMomentsResult> {
    try {
      const {
        limit = 20,
        startAfter: startAfterDoc,
        orderBy: orderField = 'createdAt',
        orderDirection = 'desc',
        userId,
        moderationStatus = 'approved',
        currentUserId
      } = options;

      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        where('moderationStatus', '==', moderationStatus),
        orderBy(orderField, orderDirection),
        firestoreLimit(limit)
      );

      // Filter by specific user if provided
      if (userId) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          where('userId', '==', userId),
          where('isActive', '==', true),
          where('moderationStatus', '==', moderationStatus),
          orderBy(orderField, orderDirection),
          firestoreLimit(limit)
        );
      }

      // Add pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const moments: MomentVideo[] = [];
      let lastDocument: DocumentSnapshot | null = null;

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const moment: MomentVideo = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          // Ensure metadata has quality versions for performance optimization
          metadata: {
            ...data.metadata,
            qualityVersions: data.metadata?.qualityVersions || []
          }
        } as MomentVideo;

        // Add user interaction states if currentUserId provided
        if (currentUserId && options.includeEngagementMetrics) {
          moment.isLiked = data.engagement?.likes?.some((like: any) => like.userId === currentUserId) || false;
        }

        moments.push(moment);
        lastDocument = docSnapshot;
      }

      return {
        moments,
        lastDocument,
        hasMore: snapshot.docs.length === limit
      };
    } catch (error) {
      console.error('Error fetching moments:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (error.message.includes('unavailable')) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        }
        throw new Error(`Failed to fetch moments: ${error.message}`);
      }
      
      throw new Error('Failed to fetch moments. Please try again.');
    }
  }

  /**
   * Get a single moment by ID
   */
  static async getMomentById(momentId: string, currentUserId?: string): Promise<MomentVideo | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, momentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const moment: MomentVideo = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Ensure metadata has quality versions for performance optimization
        metadata: {
          ...data.metadata,
          qualityVersions: data.metadata?.qualityVersions || []
        }
      } as MomentVideo;

      // Add user interaction states if currentUserId provided
      if (currentUserId) {
        moment.isLiked = data.engagement?.likes?.some((like: any) => like.userId === currentUserId) || false;
      }

      return moment;
    } catch (error) {
      console.error('Error fetching moment:', error);
      throw new Error('Failed to fetch moment');
    }
  }

  /**
   * Create a new moment
   */
  static async createMoment(momentData: CreateMomentData): Promise<string> {
    try {
      const now = Timestamp.now();
      
      const newMoment = {
        userId: momentData.userId,
        userDisplayName: momentData.userDisplayName,
        userPhotoURL: momentData.userPhotoURL,
        videoUrl: '', // Will be updated after upload
        thumbnailUrl: '', // Will be updated after upload
        caption: momentData.caption,
        duration: momentData.duration || 0,
        metadata: {
          width: 0,
          height: 0,
          fileSize: momentData.videoFile.size,
          format: momentData.videoFile.type,
          aspectRatio: '9:16', // Default for mobile videos
          uploadedAt: now.toDate().toISOString(),
          processingStatus: 'pending' as const
        },
        engagement: {
          likes: [],
          likesCount: 0,
          comments: [],
          commentsCount: 0,
          shares: [],
          sharesCount: 0,
          views: 0,
          watchTime: 0,
          completionRate: 0
        },
        createdAt: now,
        updatedAt: now,
        isActive: true,
        moderationStatus: 'pending' as const
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), newMoment);
      return docRef.id;
    } catch (error) {
      console.error('Error creating moment:', error);
      throw new Error('Failed to create moment');
    }
  }

  /**
   * Update an existing moment
   */
  static async updateMoment(momentId: string, updateData: UpdateMomentData): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, momentId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating moment:', error);
      throw new Error('Failed to update moment');
    }
  }

  /**
   * Delete a moment
   */
  static async deleteMoment(momentId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, momentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting moment:', error);
      throw new Error('Failed to delete moment');
    }
  }

  /**
   * Toggle like on a moment
   */
  static async toggleLike(momentId: string, userId: string, userDisplayName: string, userPhotoURL: string | null): Promise<ToggleVideoLikeResult> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, momentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Moment not found');
      }

      const data = docSnap.data();
      const currentLikes: VideoLike[] = data.engagement?.likes || [];
      const existingLikeIndex = currentLikes.findIndex((like: VideoLike) => like.userId === userId);

      let newLikes: VideoLike[];
      let liked: boolean;

      if (existingLikeIndex >= 0) {
        // Unlike - remove the like
        newLikes = currentLikes.filter((like: VideoLike) => like.userId !== userId);
        liked = false;
      } else {
        // Like - add the like
        const newLike: VideoLike = {
          userId,
          userName: userDisplayName,
          userPhotoURL,
          timestamp: new Date().toISOString()
        };
        newLikes = [...currentLikes, newLike];
        liked = true;
      }

      await updateDoc(docRef, {
        'engagement.likes': newLikes,
        'engagement.likesCount': newLikes.length,
        updatedAt: Timestamp.now()
      });

      // Track interaction
      await this.trackInteraction({
        momentId,
        userId,
        type: 'like',
        timestamp: Timestamp.now()
      });

      return {
        liked,
        likesCount: newLikes.length
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error('Failed to toggle like');
    }
  }

  /**
   * Add a comment to a moment
   */
  static async addComment(momentId: string, commentData: CreateVideoCommentData): Promise<string> {
    try {
      const commentDoc = {
        ...commentData,
        momentId,
        timestamp: Timestamp.now(),
        likes: [],
        replies: [],
        likesCount: 0
      };

      const commentRef = await addDoc(collection(db, this.COMMENTS_COLLECTION), commentDoc);

      // Update moment's comment count
      const momentRef = doc(db, this.COLLECTION_NAME, momentId);
      await updateDoc(momentRef, {
        'engagement.commentsCount': increment(1),
        updatedAt: Timestamp.now()
      });

      // Track interaction
      await this.trackInteraction({
        momentId,
        userId: commentData.userId,
        type: 'comment',
        timestamp: Timestamp.now(),
        metadata: {
          commentId: commentRef.id
        }
      });

      return commentRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get comments for a moment
   */
  static async getComments(momentId: string, limit = 20): Promise<VideoComment[]> {
    try {
      const q = query(
        collection(db, this.COMMENTS_COLLECTION),
        where('momentId', '==', momentId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(q);
      const comments: VideoComment[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp
        } as VideoComment);
      });

      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Track user interaction with a moment
   */
  static async trackInteraction(interaction: MomentInteraction): Promise<void> {
    try {
      await addDoc(collection(db, this.INTERACTIONS_COLLECTION), interaction);

      // Update engagement counts based on interaction type
      const momentRef = doc(db, this.COLLECTION_NAME, interaction.momentId);
      
      if (interaction.type === 'view') {
        await updateDoc(momentRef, {
          'engagement.views': increment(1),
          updatedAt: Timestamp.now()
        });
      } else if (interaction.type === 'share') {
        await updateDoc(momentRef, {
          'engagement.sharesCount': increment(1),
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
      // Don't throw error for tracking failures
    }
  }

  /**
   * Upload video file to Firebase Storage
   */
  static async uploadVideo(file: File, momentId: string): Promise<VideoUploadResult> {
    try {
      const videoRef = ref(storage, `${this.STORAGE_PATH}/${momentId}/video.${file.name.split('.').pop()}`);
      
      await uploadBytes(videoRef, file);
      const videoUrl = await getDownloadURL(videoRef);

      // For now, use a placeholder thumbnail URL
      // In a real implementation, you'd generate a thumbnail from the video
      const thumbnailUrl = videoUrl; // Placeholder

      const metadata = {
        width: 0, // Would be extracted from video
        height: 0, // Would be extracted from video
        fileSize: file.size,
        format: file.type,
        aspectRatio: '9:16',
        uploadedAt: new Date().toISOString(),
        processingStatus: 'completed' as const
      };

      return {
        videoUrl,
        thumbnailUrl,
        metadata
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  /**
   * Delete video from Firebase Storage
   */
  static async deleteVideo(momentId: string): Promise<void> {
    try {
      const videoRef = ref(storage, `${this.STORAGE_PATH}/${momentId}/video`);
      await deleteObject(videoRef);
    } catch (error) {
      console.error('Error deleting video:', error);
      // Don't throw error if file doesn't exist
    }
  }

  /**
   * Get moments by user ID
   */
  static async getMomentsByUser(userId: string, limit = 20): Promise<MomentVideo[]> {
    try {
      const result = await this.getMoments({
        userId,
        limit,
        moderationStatus: 'approved'
      });
      return result.moments;
    } catch (error) {
      console.error('Error fetching user moments:', error);
      throw new Error('Failed to fetch user moments');
    }
  }

  /**
   * Search moments by caption or user name
   */
  static async searchMoments(searchTerm: string, limit = 20): Promise<MomentVideo[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that searches by exact matches
      // In production, you'd use Algolia or similar service
      
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        where('moderationStatus', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(q);
      const moments: MomentVideo[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const moment = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as MomentVideo;

        // Basic text matching
        if (
          moment.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moment.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          moments.push(moment);
        }
      });

      return moments;
    } catch (error) {
      console.error('Error searching moments:', error);
      throw new Error('Failed to search moments');
    }
  }
}

export default MomentsService;
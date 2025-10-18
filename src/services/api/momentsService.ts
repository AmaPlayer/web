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
  private static readonly TALENT_VIDEOS_COLLECTION = 'talentVideos';
  private static readonly COMMENTS_COLLECTION = 'comments';
  private static readonly INTERACTIONS_COLLECTION = 'interactions';
  private static readonly STORAGE_PATH = 'moments';

  /**
   * Fetch paginated moments with optional filtering
   * By default, fetches moments from all users (multi-user feed)
   * Pass userId in options to filter to a specific user (e.g., for profile pages)
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

      // Build query constraints array
      const whereConstraints = [
        where('isActive', '==', true)
      ];

      // Only add moderationStatus filter if specified
      if (moderationStatus) {
        whereConstraints.push(where('moderationStatus', '==', moderationStatus));
      }

      // Only filter by userId when explicitly provided (e.g., for profile pages)
      if (userId) {
        whereConstraints.push(where('userId', '==', userId));
      }

      // Build query with all constraints
      let q = query(
        collection(db, this.COLLECTION_NAME),
        ...whereConstraints,
        orderBy(orderField, orderDirection)
      );

      // Add pagination if provided
      if (startAfterDoc) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          ...whereConstraints,
          orderBy(orderField, orderDirection),
          startAfter(startAfterDoc),
          firestoreLimit(limit)
        );
      } else {
        q = query(
          collection(db, this.COLLECTION_NAME),
          ...whereConstraints,
          orderBy(orderField, orderDirection),
          firestoreLimit(limit)
        );
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

      // Check if it's an index error
      if (error instanceof Error && error.message.includes('index')) {
        console.warn('Firestore index is still building. Comments will be available soon.');
        return []; // Return empty array instead of throwing
      }

      // For other errors, return empty array gracefully
      // This prevents UI crashes while debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn('Returning empty comments array due to error:', error);
      }
      return [];
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

  /**
   * Get verified talent videos
   */
  static async getVerifiedTalentVideos(limit = 10): Promise<MomentVideo[]> {
    try {
      const q = query(
        collection(db, this.TALENT_VIDEOS_COLLECTION),
        where('isVerified', '==', true),
        orderBy('uploadedAt', 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(q);
      const talentVideos: MomentVideo[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Convert talent video to moment format
        const talentVideo: MomentVideo = {
          id: doc.id,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          userPhotoURL: data.userPhotoURL || null,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl || data.videoUrl,
          caption: data.description || '',
          duration: data.duration || 0,
          createdAt: data.uploadedAt || Timestamp.now(),
          updatedAt: data.uploadedAt || Timestamp.now(),
          isActive: true,
          moderationStatus: 'approved',
          engagement: {
            likes: data.likes || [],
            likesCount: data.likesCount || 0,
            comments: [],
            commentsCount: 0,
            shares: [],
            sharesCount: 0,
            views: data.views || 0,
            watchTime: 0,
            completionRate: 0
          },
          metadata: {
            width: 0,
            height: 0,
            fileSize: 0,
            format: 'video/mp4',
            aspectRatio: '9:16',
            uploadedAt: data.uploadedAt?.toDate().toISOString() || new Date().toISOString(),
            processingStatus: 'completed',
            qualityVersions: []
          },
          isTalentVideo: true, // Flag to identify talent videos
          isLiked: false
        };

        talentVideos.push(talentVideo);
      });

      return talentVideos;
    } catch (error) {
      console.error('Error fetching verified talent videos:', error);
      // Don't throw error, just return empty array
      return [];
    }
  }

  /**
   * Get combined feed of moments and verified talent videos
   * This creates a mixed feed of user moments and talent showcase videos
   */
  static async getCombinedFeed(options: MomentsQueryOptions = {}): Promise<PaginatedMomentsResult> {
    try {
      const {
        limit = 20,
        currentUserId,
        includeEngagementMetrics = true
      } = options;

      // Calculate how many of each type to fetch
      // 70% moments, 30% talent videos
      const momentsLimit = Math.ceil(limit * 0.7);
      const talentLimit = Math.floor(limit * 0.3);

      // Fetch both types in parallel
      const [momentsResult, talentVideos] = await Promise.all([
        this.getMoments({
          limit: momentsLimit,
          currentUserId,
          includeEngagementMetrics,
          moderationStatus: options.moderationStatus
        }),
        this.getVerifiedTalentVideos(talentLimit)
      ]);

      // Merge and shuffle the results for a mixed feed
      const combinedVideos = [...momentsResult.moments, ...talentVideos];

      // Shuffle algorithm (Fisher-Yates)
      for (let i = combinedVideos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combinedVideos[i], combinedVideos[j]] = [combinedVideos[j], combinedVideos[i]];
      }

      // Update engagement metrics for all videos
      if (currentUserId && includeEngagementMetrics) {
        combinedVideos.forEach(video => {
          video.isLiked = video.engagement?.likes?.some((like: any) => like.userId === currentUserId) || false;
        });
      }

      return {
        moments: combinedVideos,
        lastDocument: momentsResult.lastDocument,
        hasMore: momentsResult.hasMore
      };
    } catch (error) {
      console.error('Error fetching combined feed:', error);
      throw new Error('Failed to fetch video feed');
    }
  }
}

export default MomentsService;
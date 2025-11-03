import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  increment
} from 'firebase/firestore';
import { eventsDb } from '../lib/firebase';
import { 
  Event, 
  EventFilters, 
  CreateEventDTO, 
  EventCategory, 
  EventStatus, 
  EventType, 
  HostType 
} from '../types/event.types';
import { uploadService } from './uploadService';

// API Error class for typed error responses
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Helper to convert Firestore document to Event
 */
function firestoreToEvent(doc: DocumentSnapshot): Event {
  const data = doc.data();
  if (!data) {
    throw new APIError(404, 'Event not found');
  }

  return {
    ...data,
    id: doc.id,
    startDate: data.startDate,
    endDate: data.endDate,
    submissionDeadline: data.submissionDeadline,
    votingDeadline: data.votingDeadline,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Event;
}

/**
 * Helper to convert Event to Firestore document
 */
function eventToFirestore(event: Partial<Event>): any {
  const { id, ...data } = event as any;
  return {
    ...data,
    updatedAt: serverTimestamp(),
  };
}

class EventService {
  private readonly COLLECTION = 'events';

  /**
   * Determine event status based on dates
   */
  private determineStatus(startDate: Date, endDate?: Date): EventStatus {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (now < start) {
      return EventStatus.UPCOMING;
    } else if (now > end) {
      return EventStatus.COMPLETED;
    } else {
      return EventStatus.ONGOING;
    }
  }

  /**
   * Determine category based on status
   */
  private determineCategory(startDate: Date, endDate?: Date): EventCategory {
    const status = this.determineStatus(startDate, endDate);
    if (status === EventStatus.UPCOMING) return EventCategory.UPCOMING;
    if (status === EventStatus.ONGOING) return EventCategory.ONGOING_TOURNAMENT;
    return EventCategory.AMAPLAYER;
  }

  /**
   * Get events with filters
   */
  async getEvents(filters: EventFilters): Promise<Event[]> {
    try {
      let q = query(collection(eventsDb, this.COLLECTION));

      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.sport) {
        q = query(q, where('sport', '==', filters.sport));
      }
      if (filters.location) {
        q = query(q, where('location', '>=', filters.location), where('location', '<=', filters.location + '\uf8ff'));
      }
      if (filters.isTrending !== undefined) {
        q = query(q, where('isTrending', '==', filters.isTrending));
      }

      // Order by start date
      q = query(q, orderBy('startDate', 'desc'), limit(50));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToEvent(doc));
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw new APIError(500, 'Failed to retrieve events from storage.', error);
    }
  }

  /**
   * Get single event by ID
   */
  async getEventById(id: string): Promise<Event> {
    try {
      const docRef = doc(eventsDb, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new APIError(404, 'Event not found');
      }

      return firestoreToEvent(docSnap);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to fetch event:', error);
      throw new APIError(500, 'Failed to retrieve event from storage.', error);
    }
  }

  /**
   * Create new event
   */
  async createEvent(userId: string, data: CreateEventDTO): Promise<Event> {
    try {
      console.log('🔄 Creating event...', { userId, title: data.title });
      
      // Validate user authentication first
      if (!userId) {
        throw new APIError(401, 'User must be authenticated to create events');
      }

      // Handle video file upload to Firebase Storage
      let videoUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (data.videoFile) {
        console.log('📹 Uploading video file...');
        try {
          const uploadResult = await uploadService.uploadEventVideo(
            data.videoFile,
            userId
          );
          videoUrl = uploadResult.videoUrl;
          thumbnailUrl = uploadResult.thumbnailUrl;
          console.log('✅ Video uploaded successfully');
        } catch (uploadError) {
          console.error('❌ Video upload failed:', uploadError);
          // Don't fail event creation if video upload fails
          console.log('⚠️ Continuing without video...');
        }
      }

      // Determine category based on status and dates
      const status = this.determineStatus(data.startDate, data.endDate);
      const category = this.determineCategory(data.startDate, data.endDate);

      // Determine event type and host type
      const eventType = data.eventType || EventType.COMMUNITY;
      const hostType = eventType === EventType.TALENT_HUNT ? HostType.AMAPLAYER_OFFICIAL : HostType.USER;

      // Create event document with validation
      const eventData = {
        title: data.title?.trim() || 'Untitled Event',
        description: data.description?.trim() || '',
        sport: data.sport?.trim() || 'General',
        location: data.location?.trim() || 'TBD',
        startDate: Timestamp.fromDate(data.startDate),
        endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
        status,
        category,
        createdBy: userId,
        videoUrl: videoUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        participantIds: [],
        interestedIds: [],
        maybeIds: [],
        reactions: [],
        viewCount: 0,
        shareCount: 0,
        commentCount: 0,
        participantCount: 0,
        isTrending: false,
        isOfficial: eventType === EventType.TALENT_HUNT,
        eventType,
        hostType,
        maxParticipants: data.maxParticipants || null,
        prizes: data.prizes || [],
        rules: data.rules || null,
        submissionDeadline: data.submissionDeadline 
          ? Timestamp.fromDate(data.submissionDeadline) 
          : null,
        votingDeadline: data.votingDeadline 
          ? Timestamp.fromDate(data.votingDeadline) 
          : null,
        submissionCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('💾 Saving event to database...');
      const docRef = await addDoc(collection(eventsDb, this.COLLECTION), eventData);
      console.log('✅ Event saved with ID:', docRef.id);
      
      console.log('📖 Fetching created event...');
      const newEvent = await this.getEventById(docRef.id);
      console.log('✅ Event creation completed successfully');

      return newEvent;
    } catch (error) {
      console.error('❌ Event creation failed:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        throw new APIError(403, 'Permission denied. Please check if you are authenticated and have the required permissions.');
      }
      
      if (error.code === 'unavailable') {
        throw new APIError(503, 'Service temporarily unavailable. Please try again later.');
      }
      
      if (error.code === 'invalid-argument') {
        throw new APIError(400, 'Invalid event data provided. Please check your input.');
      }
      
      // Generic error
      throw new APIError(500, 'Failed to create event. Please try again.', {
        originalError: error.message,
        code: error.code
      });
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, userId: string, data: Partial<CreateEventDTO>): Promise<Event> {
    try {
      const docRef = doc(eventsDb, this.COLLECTION, eventId);
      
      // Verify event exists and user has permission
      const existingEvent = await this.getEventById(eventId);
      if (existingEvent.createdBy !== userId) {
        throw new APIError(403, 'You do not have permission to update this event');
      }

      const updateData: any = {};

      // Handle video file if provided
      if (data.videoFile) {
        const uploadResult = await uploadService.uploadEventVideo(
          data.videoFile,
          userId
        );
        updateData.videoUrl = uploadResult.videoUrl;
        updateData.thumbnailUrl = uploadResult.thumbnailUrl;
      }

      // Update basic fields
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.sport !== undefined) updateData.sport = data.sport;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.maxParticipants !== undefined) updateData.maxParticipants = data.maxParticipants;
      if (data.prizes !== undefined) updateData.prizes = data.prizes;
      if (data.rules !== undefined) updateData.rules = data.rules;

      // Convert dates to Timestamps
      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }
      if (data.submissionDeadline) {
        updateData.submissionDeadline = Timestamp.fromDate(data.submissionDeadline);
      }
      if (data.votingDeadline) {
        updateData.votingDeadline = Timestamp.fromDate(data.votingDeadline);
      }

      // Update status if dates changed
      if (data.startDate || data.endDate) {
        const startDate = data.startDate || existingEvent.startDate.toDate();
        const endDate = data.endDate || (existingEvent.endDate ? existingEvent.endDate.toDate() : undefined);
        updateData.status = this.determineStatus(startDate, endDate);
        updateData.category = this.determineCategory(startDate, endDate);
      }

      updateData.updatedAt = serverTimestamp();

      await updateDoc(docRef, updateData);
      const updatedEvent = await this.getEventById(eventId);

      return updatedEvent;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to update event:', error);
      throw new APIError(500, 'Failed to update event.', error);
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      // Verify event exists and user has permission
      const existingEvent = await this.getEventById(eventId);
      if (existingEvent.createdBy !== userId) {
        throw new APIError(403, 'You do not have permission to delete this event');
      }

      const docRef = doc(eventsDb, this.COLLECTION, eventId);
      await deleteDoc(docRef);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to delete event:', error);
      throw new APIError(500, 'Failed to delete event.', error);
    }
  }

  /**
   * Subscribe to real-time event updates
   */
  subscribeToEvent(eventId: string, callback: (event: Event) => void): Unsubscribe {
    const docRef = doc(eventsDb, this.COLLECTION, eventId);
    
    const unsubscribe = onSnapshot(
      docRef, 
      (doc) => {
        if (doc.exists()) {
          callback(firestoreToEvent(doc));
        }
      },
      (error) => {
        console.error('Error in event subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to real-time events list
   */
  subscribeToEvents(filters: EventFilters, callback: (events: Event[]) => void): Unsubscribe {
    let q = query(collection(eventsDb, this.COLLECTION));

    // Apply filters (same as getEvents)
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.sport) {
      q = query(q, where('sport', '==', filters.sport));
    }
    if (filters.isTrending !== undefined) {
      q = query(q, where('isTrending', '==', filters.isTrending));
    }

    q = query(q, orderBy('startDate', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const events = snapshot.docs.map(doc => firestoreToEvent(doc));
        callback(events);
      },
      (error) => {
        console.error('Error in events subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Increment view count for an event
   */
  async incrementViewCount(eventId: string): Promise<void> {
    try {
      const docRef = doc(eventsDb, this.COLLECTION, eventId);
      await updateDoc(docRef, {
        viewCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to increment view count:', error);
      // Don't throw error for view count updates
    }
  }

  /**
   * Update event metrics
   */
  async updateEventMetrics(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const docRef = doc(eventsDb, this.COLLECTION, eventId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Failed to update event metrics:', error);
      throw new APIError(500, 'Failed to update event metrics.', error);
    }
  }

  /**
   * Calculate and mark trending events
   * This should be called periodically (e.g., via Cloud Function)
   */
  async markTrendingEvents(): Promise<void> {
    try {
      const allEvents = await this.getEvents({});
      const now = new Date();

      for (const event of allEvents) {
        // Calculate engagement score
        const recentEngagement = event.viewCount +
                                (event.reactions.length * 2) +
                                (event.commentCount * 3) +
                                (event.participantIds.length * 5);

        // Mark as trending if engagement score is high and event is within last 7 days
        const eventAge = now.getTime() - event.createdAt.toDate().getTime();
        const isRecent = eventAge < 7 * 24 * 60 * 60 * 1000;

        const isTrending = isRecent && recentEngagement > 50;

        // Update if trending status changed
        if (event.isTrending !== isTrending) {
          const docRef = doc(eventsDb, this.COLLECTION, event.id);
          await updateDoc(docRef, {
            isTrending,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Failed to mark trending events:', error);
      throw new APIError(500, 'Failed to mark trending events.', error);
    }
  }
}

// Export singleton instance
export const eventService = new EventService();
export default eventService;

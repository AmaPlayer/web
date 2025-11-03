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
  Timestamp,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { eventsDb } from '@features/events/lib/firebase';
import { eventService } from './eventService';

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

// Participation types
export enum ParticipationType {
  GOING = 'going',
  INTERESTED = 'interested',
  MAYBE = 'maybe'
}

// Event participation interface
export interface EventParticipation {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  eventId: string;
  type: ParticipationType;
  timestamp: Timestamp;
}

/**
 * Helper to convert Firestore document to EventParticipation
 */
function firestoreToParticipation(doc: DocumentSnapshot): EventParticipation {
  const data = doc.data();
  if (!data) {
    throw new APIError(404, 'Participation not found');
  }

  return {
    ...data,
    id: doc.id,
    timestamp: data.timestamp,
  } as EventParticipation;
}

class ParticipationService {
  private readonly COLLECTION = 'participations';

  /**
   * Join an event or update participation type
   */
  async joinEvent(
    eventId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    type: ParticipationType
  ): Promise<EventParticipation> {
    try {
      // Check if user already has a participation for this event
      const existingParticipation = await this.getParticipation(eventId, userId);

      const participationData = {
        userId,
        userName,
        userAvatar,
        eventId,
        type,
        timestamp: serverTimestamp(),
      };

      if (existingParticipation) {
        // Update existing participation
        const docRef = doc(eventsDb, this.COLLECTION, existingParticipation.id!);
        await updateDoc(docRef, {
          type,
          timestamp: serverTimestamp(),
        });

        // Get updated participation
        const updatedDoc = await getDoc(docRef);
        const updated = firestoreToParticipation(updatedDoc);

        // Update event participant counts
        await this.updateEventCounts(eventId);

        return updated;
      } else {
        // Add new participation
        const docRef = await addDoc(collection(eventsDb, this.COLLECTION), participationData);
        const newDoc = await getDoc(docRef);
        const newParticipation = firestoreToParticipation(newDoc);

        // Update event participant counts
        await this.updateEventCounts(eventId);

        return newParticipation;
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to join event:', error);
      throw new APIError(500, 'Failed to join event', error);
    }
  }

  /**
   * Leave an event (remove participation)
   */
  async leaveEvent(eventId: string, userId: string): Promise<void> {
    try {
      const participation = await this.getParticipation(eventId, userId);
      
      if (!participation || !participation.id) {
        throw new APIError(404, 'Participation not found');
      }

      const docRef = doc(eventsDb, this.COLLECTION, participation.id);
      await deleteDoc(docRef);

      // Update event participant counts
      await this.updateEventCounts(eventId);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to leave event:', error);
      throw new APIError(500, 'Failed to leave event', error);
    }
  }

  /**
   * Get all participants for an event
   */
  async getParticipants(eventId: string): Promise<EventParticipation[]> {
    try {
      const q = query(
        collection(eventsDb, this.COLLECTION),
        where('eventId', '==', eventId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToParticipation(doc));
    } catch (error) {
      console.error('Failed to get participants:', error);
      throw new APIError(500, 'Failed to get participants', error);
    }
  }

  /**
   * Get participants by type
   */
  async getParticipantsByType(
    eventId: string,
    type: ParticipationType
  ): Promise<EventParticipation[]> {
    try {
      const q = query(
        collection(eventsDb, this.COLLECTION),
        where('eventId', '==', eventId),
        where('type', '==', type),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToParticipation(doc));
    } catch (error) {
      console.error('Failed to get participants by type:', error);
      throw new APIError(500, 'Failed to get participants by type', error);
    }
  }

  /**
   * Get user's participation for an event
   */
  async getParticipation(
    eventId: string,
    userId: string
  ): Promise<EventParticipation | null> {
    try {
      const q = query(
        collection(eventsDb, this.COLLECTION),
        where('eventId', '==', eventId),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      return firestoreToParticipation(snapshot.docs[0]);
    } catch (error) {
      console.error('Failed to get participation:', error);
      throw new APIError(500, 'Failed to get participation', error);
    }
  }

  /**
   * Check if user is participating in an event
   */
  async isParticipating(eventId: string, userId: string): Promise<boolean> {
    const participation = await this.getParticipation(eventId, userId);
    return participation !== null;
  }

  /**
   * Get participation counts for an event
   */
  async getParticipationCounts(eventId: string): Promise<{
    going: number;
    interested: number;
    maybe: number;
    total: number;
  }> {
    try {
      const participants = await this.getParticipants(eventId);

      const going = participants.filter(p => p.type === ParticipationType.GOING).length;
      const interested = participants.filter(p => p.type === ParticipationType.INTERESTED).length;
      const maybe = participants.filter(p => p.type === ParticipationType.MAYBE).length;

      return {
        going,
        interested,
        maybe,
        total: going + interested + maybe,
      };
    } catch (error) {
      console.error('Failed to get participation counts:', error);
      throw new APIError(500, 'Failed to get participation counts', error);
    }
  }

  /**
   * Update event participant counts in event service
   */
  private async updateEventCounts(eventId: string): Promise<void> {
    try {
      const participations = await this.getParticipants(eventId);

      const goingIds = participations
        .filter(p => p.type === ParticipationType.GOING)
        .map(p => p.userId);

      const interestedIds = participations
        .filter(p => p.type === ParticipationType.INTERESTED)
        .map(p => p.userId);

      const maybeIds = participations
        .filter(p => p.type === ParticipationType.MAYBE)
        .map(p => p.userId);

      const participantCount = goingIds.length + interestedIds.length + maybeIds.length;

      await eventService.updateEventMetrics(eventId, {
        participantIds: goingIds,
        interestedIds,
        maybeIds,
        participantCount,
      } as any);
    } catch (error) {
      console.error('Failed to update event counts:', error);
      // Don't throw error for count updates
    }
  }

  /**
   * Get all events a user is participating in
   */
  async getUserEvents(userId: string): Promise<EventParticipation[]> {
    try {
      const q = query(
        collection(eventsDb, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToParticipation(doc));
    } catch (error) {
      console.error('Failed to get user events:', error);
      throw new APIError(500, 'Failed to get user events', error);
    }
  }

  /**
   * Check if event is at capacity
   */
  async isEventFull(eventId: string, maxParticipants?: number): Promise<boolean> {
    if (!maxParticipants) return false;

    const counts = await this.getParticipationCounts(eventId);
    return counts.going >= maxParticipants;
  }

  /**
   * Subscribe to real-time participation updates for an event
   */
  subscribeToParticipants(
    eventId: string,
    callback: (participants: EventParticipation[]) => void
  ): Unsubscribe {
    const q = query(
      collection(eventsDb, this.COLLECTION),
      where('eventId', '==', eventId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const participants = snapshot.docs.map(doc => firestoreToParticipation(doc));
        callback(participants);
      },
      (error) => {
        console.error('Error in participants subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to real-time participation updates for a user
   */
  subscribeToUserParticipations(
    userId: string,
    callback: (participations: EventParticipation[]) => void
  ): Unsubscribe {
    const q = query(
      collection(eventsDb, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const participations = snapshot.docs.map(doc => firestoreToParticipation(doc));
        callback(participations);
      },
      (error) => {
        console.error('Error in user participations subscription:', error);
      }
    );

    return unsubscribe;
  }
}

// Export singleton instance
export const participationService = new ParticipationService();
export default participationService;

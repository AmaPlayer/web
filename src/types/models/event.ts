import { Timestamp } from 'firebase/firestore';

/**
 * Event status
 */
export type EventStatus = 'upcoming' | 'live' | 'completed';

/**
 * Event category
 */
export type EventCategory = 'Event' | 'Tournament' | 'Competition' | 'Match' | 'Training' | 'Social';

/**
 * Event priority
 */
export type EventPriority = 'low' | 'medium' | 'high';

/**
 * Event type for enhanced categorization
 */
export type EventType = 'talent_hunt' | 'community' | 'tournament' | 'general';

/**
 * Participation type
 */
export type ParticipationType = 'going' | 'interested' | 'maybe';

/**
 * Core Event interface
 */
export interface Event {
  id: string;
  title: string;
  date: string | Date;
  startTime?: string;
  duration?: number;
  location: string;
  category: EventCategory;
  description: string;
  image?: string;
  imageUrl?: string;
  status: EventStatus;
  participants?: string;
  maxParticipants?: number | string;
  priority: EventPriority;
  registrationUrl?: string;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  requirements?: string[];
  prizes?: string[];
  tags?: string[];
  isActive: boolean;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;

  // Enhanced fields (Phase 1A) - All optional for backwards compatibility
  eventType?: EventType;
  sport?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  isTrending?: boolean;
  isOfficial?: boolean;
  viewCount?: number;
  shareCount?: number;

  // Participation fields (Phase 1B) - All optional for backwards compatibility
  participantIds?: string[];
  interestedIds?: string[];
  maybeIds?: string[];
  participantCount?: number;
}

/**
 * Competition status details
 */
export interface CompetitionStatus {
  status: EventStatus;
  displayText: string;
  statusClass: string;
}

/**
 * Data for creating a new event
 */
export interface CreateEventData {
  title: string;
  date: string | Date;
  startTime?: string;
  duration?: number;
  location: string;
  category?: EventCategory;
  description: string;
  imageUrl?: string;
  maxParticipants?: number;
  registrationUrl?: string;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  requirements?: string[];
  prizes?: string[];
  tags?: string[];
}

/**
 * Data for updating an event
 */
export interface UpdateEventData {
  title?: string;
  date?: string | Date;
  startTime?: string;
  duration?: number;
  location?: string;
  category?: EventCategory;
  description?: string;
  imageUrl?: string;
  maxParticipants?: number;
  registrationUrl?: string;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  requirements?: string[];
  prizes?: string[];
  tags?: string[];
  isActive?: boolean;
}

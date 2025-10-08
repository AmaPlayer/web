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

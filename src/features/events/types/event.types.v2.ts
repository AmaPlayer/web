/**
 * Enhanced Event Schema v2 Types
 *
 * This file contains TypeScript type definitions for the new enhanced event schema.
 *
 * Key Changes from v1:
 * - Structured location with coordinates
 * - Timezone support
 * - Participant/reaction arrays moved to subcollections
 * - Enhanced capacity tracking
 * - Financial information
 * - Visibility controls
 * - Requirements and eligibility
 * - Social features configuration
 * - Schema versioning and migration tracking
 */

import { Timestamp, DocumentSnapshot } from 'firebase/firestore';

// ========== Enums ==========

export enum EventCategory {
  UPCOMING = 'upcoming',
  ONGOING_TOURNAMENT = 'ongoing_tournament',
  AMAPLAYER = 'amaplayer'
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export enum EventType {
  TALENT_HUNT = 'talent_hunt',
  COMMUNITY = 'community',
  TOURNAMENT = 'tournament'
}

export enum HostType {
  AMAPLAYER_OFFICIAL = 'amaplayer_official',
  USER = 'user'
}

export enum ParticipationType {
  GOING = 'going',
  INTERESTED = 'interested',
  MAYBE = 'maybe'
}

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  WAITLIST = 'waitlist',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded'
}

export enum CheckInStatus {
  NOT_CHECKED_IN = 'not_checked_in',
  CHECKED_IN = 'checked_in'
}

export enum SkillLevel {
  ALL = 'all',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional'
}

export type ReactionType = '🔥' | '💪' | '⚡' | '👏' | '❤️';
export type MediaType = 'video' | 'image';

// ========== Location Types ==========

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  geohash: string; // For efficient location-based queries
}

export interface LocationAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface EventLocation {
  displayName: string;
  venue: string;
  address: LocationAddress;
  coordinates: LocationCoordinates;
}

// ========== Media Types ==========

export interface MediaFile {
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  duration?: number; // seconds, for videos
  size?: number; // bytes
}

// ========== Organizer Information ==========

export interface OrganizerInfo {
  userId: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  phone?: string;
  isVerified: boolean;
}

// ========== Capacity Information ==========

export interface EventCapacity {
  maxParticipants: number | null;
  currentParticipants: number;
  waitlistEnabled: boolean;
  currentWaitlist: number;
  registrationRequired: boolean;
  approvalRequired: boolean;
}

// ========== Engagement Metrics ==========

export interface EventMetrics {
  participantCount: number;
  interestedCount: number;
  maybeCount: number;
  viewCount: number;
  shareCount: number;
  commentCount: number;
  reactionCount: number;
  uniqueVisitors: number;
}

// ========== Visibility Settings ==========

export interface EventVisibility {
  isPublic: boolean;
  isDiscoverable: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  requiresApproval: boolean;
}

// ========== Financial Information ==========

export interface EventFinancial {
  isFree: boolean;
  registrationFee: number;
  currency: string;
  prizes: string[];
  totalPrizePool: number;
  paymentRequired: boolean;
  refundPolicy: string | null;
}

// ========== Talent Hunt Configuration ==========

export interface TalentHuntConfig {
  submissionDeadline: Timestamp | null;
  votingDeadline: Timestamp | null;
  submissionCount: number;
  maxSubmissionsPerUser: number;
  votingEnabled: boolean;
  judgesEnabled: boolean;
  judges: string[];
}

// ========== Event Requirements ==========

export interface EventRequirements {
  minAge: number | null;
  maxAge: number | null;
  skillLevel: SkillLevel;
  equipmentNeeded: string[];
  rules: string | null;
  eligibilityCriteria: string | null;
}

// ========== Social Features ==========

export interface EventSocialFeatures {
  allowComments: boolean;
  allowReactions: boolean;
  allowSharing: boolean;
  discussionEnabled: boolean;
  chatEnabled: boolean;
  streamingUrl: string | null;
}

// ========== Notification Settings ==========

export interface EventNotifications {
  reminderSent: boolean;
  reminderScheduled: Timestamp | null;
  updateNotificationsEnabled: boolean;
}

// ========== Moderation Information ==========

export interface EventModeration {
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: Timestamp | null;
  flagCount: number;
  reportCount: number;
  moderationNotes: string | null;
}

// ========== Metadata ==========

export interface EventMetadata {
  source: 'web' | 'mobile' | 'api';
  version: number;
  migrated: boolean;
  migratedAt?: Timestamp;
  importedFrom: string | null;
}

// ========== Main Event Interface ==========

export interface EventV2 {
  id: string;

  // Basic Information
  title: string;
  description: string;
  sport: string;
  tags: string[];

  // Location
  location: EventLocation;

  // Dates & Time
  startDate: Timestamp;
  endDate: Timestamp | null;
  timezone: string;
  registrationStartDate: Timestamp;
  registrationEndDate: Timestamp;

  // Status & Classification
  status: EventStatus;
  category: EventCategory;
  eventType: EventType;
  hostType: HostType;

  // Organizer
  createdBy: string;
  organizerInfo: OrganizerInfo;

  // Media
  mediaFiles: MediaFile[];

  // Capacity & Registration
  capacity: EventCapacity;

  // Engagement Metrics
  metrics: EventMetrics;

  // Visibility & Access
  visibility: EventVisibility;

  // Financial
  financial: EventFinancial;

  // Event Specific
  isOfficial: boolean;
  isTrending: boolean;
  trendingScore: number;
  qualityScore: number;

  // Talent Hunt Specific (optional)
  talentHunt?: TalentHuntConfig;

  // Requirements & Rules
  requirements: EventRequirements;

  // Social Features
  social: EventSocialFeatures;

  // Notifications
  notifications: EventNotifications;

  // Moderation
  moderation: EventModeration;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt: Timestamp;
  publishedAt: Timestamp;

  // Metadata
  metadata: EventMetadata;
}

// ========== Subcollection Types ==========

export interface EventParticipant {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  userEmail?: string;
  type: ParticipationType;
  registeredAt: Timestamp;
  registrationStatus: RegistrationStatus;
  ticketId: string | null;
  paymentStatus: PaymentStatus;
  checkInStatus: CheckInStatus;
  checkInTime: Timestamp | null;
  metadata: {
    source: 'web' | 'mobile' | 'api';
    notificationsEnabled: boolean;
    reminderSet: boolean;
  };
}

export interface EventReaction {
  userId: string;
  userName: string;
  reactionType: ReactionType;
  timestamp: Timestamp;
}

export interface EventAnalyticsSummary {
  totalViews: number;
  totalUniqueViews: number;
  totalShares: number;
  totalComments: number;
  totalReactions: number;
  totalParticipants: number;
  peakConcurrentUsers: number;
  averageEngagementTime: number;
  lastUpdated: Timestamp;
  referralSources: {
    direct: number;
    social: number;
    search: number;
  };
  dailyStats: Array<{
    date: string;
    views: number;
    registrations: number;
    cancellations: number;
  }>;
}

export interface EventAnalyticsDaily {
  date: string;
  views: number;
  uniqueViews: number;
  shares: number;
  reactions: number;
  comments: number;
  registrations: number;
  cancellations: number;
  peakConcurrentUsers: number;
  avgEngagementTime: number;
  hourlyBreakdown: Record<string, number>;
}

// ========== DTO Types for API ==========

export interface CreateEventV2DTO {
  // Basic Information
  title: string;
  description: string;
  sport: string;
  tags?: string[];

  // Location (can be simple string or structured)
  location: string | Partial<EventLocation>;

  // Dates & Time
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  registrationStartDate?: Date;
  registrationEndDate?: Date;

  // Media
  videoFile?: File;
  imageFiles?: File[];

  // Event Type
  eventType?: EventType;

  // Capacity
  maxParticipants?: number;
  waitlistEnabled?: boolean;
  registrationRequired?: boolean;
  approvalRequired?: boolean;

  // Financial
  isFree?: boolean;
  registrationFee?: number;
  currency?: string;
  prizes?: string[];
  totalPrizePool?: number;
  refundPolicy?: string;

  // Talent Hunt Specific
  submissionDeadline?: Date;
  votingDeadline?: Date;
  maxSubmissionsPerUser?: number;

  // Requirements
  minAge?: number;
  maxAge?: number;
  skillLevel?: SkillLevel;
  equipmentNeeded?: string[];
  rules?: string;
  eligibilityCriteria?: string;

  // Social Features
  allowComments?: boolean;
  allowReactions?: boolean;
  allowSharing?: boolean;
  discussionEnabled?: boolean;
  chatEnabled?: boolean;
  streamingUrl?: string;

  // Visibility
  isPublic?: boolean;
  isDiscoverable?: boolean;
}

export interface UpdateEventV2DTO extends Partial<CreateEventV2DTO> {
  // Allow partial updates
}

// ========== Filter Types ==========

export interface EventFiltersV2 {
  category?: EventCategory;
  sport?: string;
  tags?: string[];
  location?: {
    center: { latitude: number; longitude: number };
    radiusKm: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  eventType?: EventType;
  isTrending?: boolean;
  isFeatured?: boolean;
  skillLevel?: SkillLevel;
  isFree?: boolean;
  status?: EventStatus;
}

// ========== Helper Functions ==========

/**
 * Convert Firestore document to EventV2
 */
export function firestoreToEventV2(doc: DocumentSnapshot): EventV2 {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is undefined');
  }

  return {
    id: doc.id,
    ...data,
  } as EventV2;
}

/**
 * Convert EventV2 to Firestore document (for writes)
 */
export function eventV2ToFirestore(event: Partial<EventV2>): any {
  const { id, ...data } = event as any;
  return data;
}

/**
 * Convert Date to Timestamp
 */
export function dateToTimestamp(date: Date | undefined | null): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

/**
 * Convert Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | undefined | null): Date | undefined {
  return timestamp ? timestamp.toDate() : undefined;
}

/**
 * Parse location string into structured format
 * In production, use a geocoding API
 */
export function parseLocationString(locationString: string): Partial<EventLocation> {
  const parts = locationString.split(',').map(s => s.trim());

  return {
    displayName: locationString,
    venue: parts[0] || locationString,
    address: {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts.length > 2 ? parts[parts.length - 2] : '',
      country: parts[parts.length - 1] || 'India',
      postalCode: ''
    }
    // Note: coordinates should be obtained from a geocoding service
  };
}

/**
 * Type guard to check if event is v2
 */
export function isEventV2(event: any): event is EventV2 {
  return event.metadata?.version === 2;
}

/**
 * Get primary media file
 */
export function getPrimaryMedia(event: EventV2): MediaFile | undefined {
  return event.mediaFiles.find(file => file.isPrimary);
}

/**
 * Check if event has capacity remaining
 */
export function hasCapacityRemaining(event: EventV2): boolean {
  if (!event.capacity.maxParticipants) return true;
  return event.capacity.currentParticipants < event.capacity.maxParticipants;
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(event: EventV2): boolean {
  const now = new Date();
  const regStart = event.registrationStartDate.toDate();
  const regEnd = event.registrationEndDate.toDate();
  return now >= regStart && now <= regEnd;
}

/**
 * Calculate event engagement score
 */
export function calculateEngagementScore(event: EventV2): number {
  const { metrics } = event;
  return (
    metrics.viewCount +
    metrics.reactionCount * 2 +
    metrics.commentCount * 3 +
    metrics.shareCount * 5 +
    metrics.participantCount * 10
  );
}

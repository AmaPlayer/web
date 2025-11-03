// Re-export all types for easy importing

// Export v1 types (backward compatibility)
export * from './event.types';

// Export v2 types with explicit naming to avoid conflicts
// Separate type exports from value exports for isolatedModules compatibility

// V2 Type-only exports
export type {
  // V2 Main Types
  EventV2,

  // V2 Type aliases
  ReactionType as ReactionTypeV2,
  MediaType,

  // V2 Location Types
  LocationCoordinates,
  LocationAddress,
  EventLocation,

  // V2 Media Types
  MediaFile,

  // V2 Component Types
  OrganizerInfo,
  EventCapacity,
  EventMetrics as EventMetricsV2, // Renamed to avoid conflict
  EventVisibility,
  EventFinancial,
  TalentHuntConfig,
  EventRequirements,
  EventSocialFeatures,
  EventNotifications,
  EventModeration,
  EventMetadata,

  // V2 Subcollection Types
  EventParticipant,
  EventReaction as EventReactionV2, // Renamed to avoid conflict
  EventAnalyticsSummary,
  EventAnalyticsDaily,

  // V2 DTO Types
  CreateEventV2DTO,
  UpdateEventV2DTO,
  EventFiltersV2,
} from './event.types.v2';

// V2 Runtime value exports (enums and functions)
export {
  // V2-specific enums
  RegistrationStatus,
  PaymentStatus,
  CheckInStatus,
  SkillLevel as EventSkillLevel, // Renamed to avoid conflict with user.types

  // V2 Helper Functions
  firestoreToEventV2,
  eventV2ToFirestore,
  parseLocationString,
  isEventV2,
  getPrimaryMedia,
  hasCapacityRemaining,
  isRegistrationOpen,
  calculateEngagementScore,

  // Keep original helper functions from v2 with different names
  dateToTimestamp as dateToTimestampV2,
  timestampToDate as timestampToDateV2,
} from './event.types.v2';

export * from './form.types';
export * from './engagement.types';
export * from './realtime.types';
export * from './social.types';
export * from './user.types';
export * from './notification.types';

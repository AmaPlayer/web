// Sports list
export const SPORTS_LIST = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Volleyball',
  'Baseball',
  'Football',
  'Hockey',
  'Rugby',
  'Cricket',
  'Golf',
  'Swimming',
  'Athletics',
  'Badminton',
  'Table Tennis',
  'Boxing',
  'Martial Arts',
  'Cycling',
  'Skateboarding',
  'Surfing',
  'Other'
] as const;

export type Sport = typeof SPORTS_LIST[number];

// File upload limits
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

// Accepted video formats
export const ACCEPTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/webm'
] as const;

export const ACCEPTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.webm'
] as const;

// Form validation constants
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 1000;

// Error messages
export const VIDEO_UPLOAD_ERRORS = {
  FILE_TOO_LARGE: `Video file size exceeds ${MAX_VIDEO_SIZE_MB}MB limit`,
  INVALID_FORMAT: 'Invalid video format. Supported: MP4, MOV, AVI, WEBM',
  UPLOAD_FAILED: 'Video upload failed. Please try again',
  NETWORK_ERROR: 'Network error during upload'
} as const;

export const FORM_VALIDATION_ERRORS = {
  DESCRIPTION_REQUIRED: 'Description is required',
  DESCRIPTION_TOO_SHORT: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  SPORT_REQUIRED: 'Please select a sport',
  LOCATION_REQUIRED: 'Location is required',
  START_DATE_REQUIRED: 'Start date is required',
  END_DATE_BEFORE_START: 'End date must be after start date'
} as const;

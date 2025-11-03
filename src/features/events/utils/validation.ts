import { CreateEventDTO } from '../types/event.types';
import { FormErrors } from '../types/form.types';
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_VIDEO_SIZE_BYTES,
  ACCEPTED_VIDEO_FORMATS,
  SPORTS_LIST,
  FORM_VALIDATION_ERRORS,
  VIDEO_UPLOAD_ERRORS
} from './constants';

/**
 * Validates the title field
 */
export const validateTitle = (title: string): string | undefined => {
  if (!title || title.trim().length === 0) {
    return 'Event title is required';
  }

  if (title.trim().length < 3) {
    return 'Event title must be at least 3 characters';
  }

  if (title.length > 200) {
    return 'Event title cannot exceed 200 characters';
  }

  return undefined;
};

/**
 * Validates the description field
 */
export const validateDescription = (description: string): string | undefined => {
  if (!description || description.trim().length === 0) {
    return FORM_VALIDATION_ERRORS.DESCRIPTION_REQUIRED;
  }

  if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
    return FORM_VALIDATION_ERRORS.DESCRIPTION_TOO_SHORT;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return FORM_VALIDATION_ERRORS.DESCRIPTION_TOO_LONG;
  }

  return undefined;
};

/**
 * Validates the sport field
 */
export const validateSport = (sport: string): string | undefined => {
  if (!sport || sport.trim().length === 0) {
    return FORM_VALIDATION_ERRORS.SPORT_REQUIRED;
  }

  // Optional: Check if sport is in the predefined list
  if (!SPORTS_LIST.includes(sport as any)) {
    return FORM_VALIDATION_ERRORS.SPORT_REQUIRED;
  }

  return undefined;
};

/**
 * Validates the location field
 */
export const validateLocation = (location: string): string | undefined => {
  if (!location || location.trim().length === 0) {
    return FORM_VALIDATION_ERRORS.LOCATION_REQUIRED;
  }

  return undefined;
};

/**
 * Validates the start date field
 */
export const validateStartDate = (startDate: Date | null): string | undefined => {
  if (!startDate) {
    return FORM_VALIDATION_ERRORS.START_DATE_REQUIRED;
  }

  return undefined;
};

/**
 * Validates the end date field relative to start date
 */
export const validateEndDate = (
  endDate: Date | null,
  startDate: Date | null
): string | undefined => {
  // End date is optional, so no error if not provided
  if (!endDate) {
    return undefined;
  }

  // If end date is provided, start date must also be provided
  if (!startDate) {
    return undefined; // Will be caught by start date validation
  }

  // End date must be after start date
  if (endDate <= startDate) {
    return FORM_VALIDATION_ERRORS.END_DATE_BEFORE_START;
  }

  return undefined;
};

/**
 * Validates video file format
 */
export const validateVideoFormat = (file: File): boolean => {
  return ACCEPTED_VIDEO_FORMATS.includes(file.type as any);
};

/**
 * Validates video file size
 */
export const validateVideoSize = (file: File): boolean => {
  return file.size <= MAX_VIDEO_SIZE_BYTES;
};

/**
 * Validates video file (both format and size)
 */
export const validateVideoFile = (file: File | null): string | undefined => {
  // Video is optional, so no error if not provided
  if (!file) {
    return undefined;
  }

  // Check file format
  if (!validateVideoFormat(file)) {
    return VIDEO_UPLOAD_ERRORS.INVALID_FORMAT;
  }

  // Check file size
  if (!validateVideoSize(file)) {
    return VIDEO_UPLOAD_ERRORS.FILE_TOO_LARGE;
  }

  return undefined;
};

/**
 * Validates the entire event form
 */
export const validateEventForm = (data: CreateEventDTO): FormErrors => {
  const errors: FormErrors = {};

  // Validate title
  const titleError = validateTitle(data.title);
  if (titleError) {
    errors.title = titleError;
  }

  // Validate description
  const descriptionError = validateDescription(data.description);
  if (descriptionError) {
    errors.description = descriptionError;
  }

  // Validate sport
  const sportError = validateSport(data.sport);
  if (sportError) {
    errors.sport = sportError;
  }

  // Validate location
  const locationError = validateLocation(data.location);
  if (locationError) {
    errors.location = locationError;
  }

  // Validate start date
  const startDateError = validateStartDate(data.startDate);
  if (startDateError) {
    errors.startDate = startDateError;
  }

  // Validate end date
  const endDateError = validateEndDate(data.endDate || null, data.startDate);
  if (endDateError) {
    errors.endDate = endDateError;
  }

  // Validate video file
  const videoError = validateVideoFile(data.videoFile || null);
  if (videoError) {
    errors.videoFile = videoError;
  }

  return errors;
};

/**
 * Checks if the form has any validation errors
 */
export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Validates a single form field
 */
export const validateField = (
  fieldName: keyof CreateEventDTO,
  value: any,
  formData?: Partial<CreateEventDTO>
): string | undefined => {
  switch (fieldName) {
    case 'title':
      return validateTitle(value);
    case 'description':
      return validateDescription(value);
    case 'sport':
      return validateSport(value);
    case 'location':
      return validateLocation(value);
    case 'startDate':
      return validateStartDate(value);
    case 'endDate':
      return validateEndDate(value, formData?.startDate || null);
    case 'videoFile':
      return validateVideoFile(value);
    default:
      return undefined;
  }
};

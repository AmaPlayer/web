import { useState, useCallback } from 'react';
import { FormState, FormErrors } from '@features/events/types/form.types';
import { Event, CreateEventDTO } from '@features/events/types/event.types';
import { APIError } from '@features/events/services/eventService';
import { validateEventForm, hasFormErrors, validateField } from '@features/events/utils/validation';
import { useCreateEvent } from './useEvents';

interface UseEventFormReturn {
  formState: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  submitForm: (userId: string) => Promise<void>;
  isSubmitting: boolean;
}

const initialFormState: FormState = {
  title: '',
  description: '',
  sport: '',
  location: '',
  startDate: null,
  endDate: null,
  videoFile: null,
  errors: {},
  isSubmitting: false,
};

/**
 * Custom hook for managing event form state and validation
 * Now uses React Query mutation for form submission
 * Requirements: 6.1, 6.2, 6.4, 7.3, 8.2, 10.1, 10.2, 10.4
 */
export function useEventForm(onSuccess: (event: Event) => void): UseEventFormReturn {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  
  // Use React Query mutation for creating events
  const createEventMutation = useCreateEvent();

  /**
   * Updates a single form field and validates it
   * Requirements: 6.4, 10.2
   */
  const updateField = useCallback(<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => {
      const newState = { ...prev, [field]: value };

      // Validate the field if it's not a meta field
      if (field !== 'errors' && field !== 'isSubmitting') {
        const fieldError = validateField(
          field as keyof CreateEventDTO,
          value,
          {
            description: newState.description,
            sport: newState.sport,
            location: newState.location,
            startDate: newState.startDate || undefined,
            endDate: newState.endDate || undefined,
            videoFile: newState.videoFile || undefined,
          } as Partial<CreateEventDTO>
        );

        // Update errors for this field
        const newErrors = { ...prev.errors };
        if (fieldError) {
          newErrors[field as keyof FormErrors] = fieldError;
        } else {
          delete newErrors[field as keyof FormErrors];
        }

        newState.errors = newErrors;
      }

      return newState;
    });
  }, []);

  /**
   * Validates the entire form
   * Requirements: 10.2
   */
  const validateForm = useCallback((): boolean => {
    const eventData: CreateEventDTO = {
      title: formState.title,
      description: formState.description,
      sport: formState.sport,
      location: formState.location,
      startDate: formState.startDate || new Date(),
      endDate: formState.endDate || undefined,
      videoFile: formState.videoFile || undefined,
    };

    const errors = validateEventForm(eventData);
    
    setFormState((prev) => ({
      ...prev,
      errors,
    }));

    return !hasFormErrors(errors);
  }, [formState]);

  /**
   * Resets the form to initial state
   */
  const resetForm = useCallback(() => {
    setFormState(initialFormState);
  }, []);

  /**
   * Submits the form with validation and error handling using React Query
   * Requirements: 6.2, 6.4, 10.1, 10.3, 10.4
   */
  const submitForm = useCallback(async (userId: string) => {
    // Validate form before submission
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    // Check required fields
    if (!formState.startDate) {
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          startDate: 'Start date is required',
        },
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const eventData: CreateEventDTO = {
        title: formState.title,
        description: formState.description,
        sport: formState.sport,
        location: formState.location,
        startDate: formState.startDate,
        endDate: formState.endDate || undefined,
        videoFile: formState.videoFile || undefined,
      };

      // Use React Query mutation
      const createdEvent = await createEventMutation.mutateAsync({ userId, data: eventData });
      
      // Reset form on success
      resetForm();
      
      // Call success callback
      onSuccess(createdEvent);
    } catch (err) {
      // Handle API errors with detailed error messages
      // Requirements: 10.4, 10.6
      let errorMessage = 'Failed to create event. Please try again.';
      
      if (err instanceof APIError) {
        // Use the API error message
        errorMessage = err.message;
        
        // Provide more specific guidance based on error type
        if (err.statusCode === 408 || err.details?.timeout) {
          errorMessage = 'Request timeout. Please check your connection and try again.';
        } else if (err.statusCode === 401) {
          errorMessage = 'You must be logged in to create an event.';
        } else if (err.statusCode === 403) {
          errorMessage = 'You do not have permission to create events.';
        } else if (err.statusCode === 413) {
          errorMessage = 'The uploaded file is too large. Please use a smaller video file.';
        } else if (err.statusCode >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        // Handle field-specific errors from API
        if (err.details && typeof err.details === 'object' && !err.details.timeout) {
          const apiErrors: FormErrors = {};
          Object.keys(err.details).forEach((key) => {
            if (key in initialFormState) {
              apiErrors[key as keyof FormErrors] = err.details[key];
            }
          });
          
          if (Object.keys(apiErrors).length > 0) {
            setFormState((prev) => ({
              ...prev,
              errors: { ...prev.errors, ...apiErrors },
              isSubmitting: false,
            }));
            return;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle network errors
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
      }

      // Set general error on description field (most visible)
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          description: errorMessage,
        },
        isSubmitting: false,
      }));
    }
  }, [formState, validateForm, resetForm, onSuccess, createEventMutation]);

  return {
    formState,
    updateField,
    validateForm,
    resetForm,
    submitForm,
    isSubmitting: formState.isSubmitting || createEventMutation.isPending,
  };
}

export default useEventForm;

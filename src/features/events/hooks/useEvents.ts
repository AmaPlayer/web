import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Event, EventCategory, EventFilters, CreateEventDTO } from '@features/events/types/event.types';
import { eventService, APIError } from '@features/events/services/eventService';

/**
 * Query keys for events
 * Requirements: 6.2
 */
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: EventFilters) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

/**
 * Fetch events with filters using React Query
 * Requirements: 2.1, 2.3, 3.1, 3.3, 4.1, 4.3, 6.2
 */
export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventService.getEvents(filters),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error instanceof APIError && error.statusCode === 403) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
  });
}

/**
 * Fetch single event by ID using React Query
 * Requirements: 6.2
 */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventService.getEventById(eventId),
    enabled: !!eventId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on not found errors
      if (error instanceof APIError && error.statusCode === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Create event mutation using React Query
 * Requirements: 6.2
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: CreateEventDTO }) => {
      console.log('🔄 Starting event creation mutation...', { userId, title: data.title });
      
      // Validate authentication state
      if (!userId) {
        console.error('❌ No user ID provided');
        throw new Error('You must be signed in to create events');
      }
      
      try {
        const result = await eventService.createEvent(userId, data);
        console.log('✅ Event creation mutation completed');
        return result;
      } catch (error) {
        console.error('❌ Event creation mutation failed:', error);
        throw error;
      }
    },
    onSuccess: (newEvent) => {
      console.log('🎉 Event created successfully:', newEvent.id);
      // Invalidate events list to refetch
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
    onError: (error) => {
      console.error('❌ Event creation failed in mutation:', error);
    },
  });
}

/**
 * Update event mutation using React Query
 * Requirements: 6.2
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userId, data }: { eventId: string; userId: string; data: Partial<CreateEventDTO> }) =>
      eventService.updateEvent(eventId, userId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific event and lists
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update event:', error);
    },
  });
}

/**
 * Delete event mutation using React Query
 * Requirements: 6.2
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      eventService.deleteEvent(eventId, userId),
    onSuccess: () => {
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete event:', error);
    },
  });
}

/**
 * Real-time event subscription hook
 * Subscribes to Firestore real-time updates and updates React Query cache
 * Requirements: 6.2, 7.1, 7.2
 */
export function useEventRealtime(eventId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = eventService.subscribeToEvent(eventId, (event) => {
      // Update cache with real-time data
      queryClient.setQueryData(eventKeys.detail(eventId), event);
    });

    return unsubscribe;
  }, [eventId, queryClient]);
}

/**
 * Real-time events list subscription hook
 * Subscribes to Firestore real-time updates for events list
 * Requirements: 6.2, 7.1, 7.2
 */
export function useEventsRealtime(filters: EventFilters) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = eventService.subscribeToEvents(filters, (events) => {
      // Update cache with real-time data
      queryClient.setQueryData(eventKeys.list(filters), events);
    });

    return unsubscribe;
  }, [filters, queryClient]);
}

/**
 * Increment view count mutation
 * Requirements: 6.2
 */
export function useIncrementViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventService.incrementViewCount(eventId),
    onSuccess: (_, eventId) => {
      // Optimistically update the view count in cache
      queryClient.setQueryData(eventKeys.detail(eventId), (old: Event | undefined) => {
        if (!old) return old;
        return { ...old, viewCount: old.viewCount + 1 };
      });
    },
  });
}

export default useEvents;

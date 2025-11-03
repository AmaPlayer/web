// Events Store using Zustand
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EventFilters, EventCategory } from '../types/event.types';

// Events UI State Interface
interface EventsState {
  // Filters
  currentFilters: EventFilters;
  setFilters: (filters: Partial<EventFilters>) => void;
  resetFilters: () => void;

  // UI state
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;

  // View preferences
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Participation tracking (optimistic updates)
  participatingEvents: Set<string>;
  addParticipation: (eventId: string) => void;
  removeParticipation: (eventId: string) => void;
  isParticipating: (eventId: string) => boolean;

  // Reset
  reset: () => void;
}

// Default filters
const defaultFilters: EventFilters = {
  category: 'upcoming' as EventCategory,
};

// Create the store
export const useEventsStore = create<EventsState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentFilters: defaultFilters,
        selectedEventId: null,
        isCreateModalOpen: false,
        viewMode: 'grid',
        participatingEvents: new Set<string>(),

        // Filter actions
        setFilters: (filters: Partial<EventFilters>) =>
          set((state) => ({
            currentFilters: { ...state.currentFilters, ...filters },
          })),

        resetFilters: () => set({ currentFilters: defaultFilters }),

        // UI state actions
        setSelectedEventId: (id: string | null) => set({ selectedEventId: id }),

        setCreateModalOpen: (open: boolean) => set({ isCreateModalOpen: open }),

        // View preferences
        setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),

        // Participation tracking
        addParticipation: (eventId: string) =>
          set((state) => ({
            participatingEvents: new Set(state.participatingEvents).add(eventId),
          })),

        removeParticipation: (eventId: string) =>
          set((state) => {
            const newSet = new Set(state.participatingEvents);
            newSet.delete(eventId);
            return { participatingEvents: newSet };
          }),

        isParticipating: (eventId: string) => get().participatingEvents.has(eventId),

        // Reset
        reset: () =>
          set({
            currentFilters: defaultFilters,
            selectedEventId: null,
            isCreateModalOpen: false,
            viewMode: 'grid',
            participatingEvents: new Set<string>(),
          }),
      }),
      {
        name: 'events-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          currentFilters: state.currentFilters,
          viewMode: state.viewMode,
          participatingEvents: Array.from(state.participatingEvents), // Convert Set to Array for storage
        }),
        onRehydrateStorage: () => (state) => {
          // Convert array back to Set on rehydration
          if (state && Array.isArray(state.participatingEvents)) {
            state.participatingEvents = new Set(state.participatingEvents as string[]);
          }
        },
      }
    )
  )
);

/**
 * Development tools for testing
 * These functions are exposed to window for easy testing in browser console
 */

import { eventService } from '@features/events/services/eventService';

export const devTools = {
  /**
   * Clear all events from localStorage
   */
  clearEvents: () => {
    localStorage.removeItem('events');
    console.log('✅ All events cleared from localStorage');
    window.location.reload();
  },

  /**
   * Seed sample data
   */
  seedData: async () => {
    console.log('🌱 Seeding sample data...');
    console.log('⚠️ Sample data seeding not implemented for Firebase backend');
    console.log('Please use Firebase console or scripts to seed data');
  },

  /**
   * View all events in localStorage
   */
  viewEvents: () => {
    const data = localStorage.getItem('events_data');
    if (!data) {
      console.log('No events found in localStorage');
      return [];
    }
    const events = JSON.parse(data);
    console.table(events.map((e: any) => ({
      id: e.id,
      title: e.title,
      sport: e.sport,
      status: e.status,
      startDate: e.startDate,
    })));
    return events;
  },

  /**
   * Get localStorage stats
   */
  getStats: () => {
    const data = localStorage.getItem('events_data');
    const events = data ? JSON.parse(data) : [];
    const counter = localStorage.getItem('events_counter');
    
    console.log('📊 LocalStorage Stats:');
    console.log(`  Total Events: ${events.length}`);
    console.log(`  Next ID Counter: ${counter}`);
    console.log(`  Storage Size: ${new Blob([data || '']).size} bytes`);
    
    return {
      totalEvents: events.length,
      nextId: counter,
      storageSize: new Blob([data || '']).size,
    };
  },

  /**
   * Reset everything
   */
  reset: async () => {
    console.log('🔄 Resetting application...');
    localStorage.clear();
    console.log('✅ Application reset complete!');
    window.location.reload();
  },
};

// Expose to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).devTools = devTools;
  console.log('🛠️ Dev tools loaded! Use window.devTools in console');
  console.log('Available commands:');
  console.log('  - devTools.clearEvents()');
  console.log('  - devTools.seedData()');
  console.log('  - devTools.viewEvents()');
  console.log('  - devTools.getStats()');
  console.log('  - devTools.reset()');
}

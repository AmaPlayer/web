// Events Firebase Configuration
// Uses main app authentication but separate database and storage

import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
// Import main app's Firebase app, auth, and analytics
import { app, auth, analytics } from '../../../lib/firebase';

// Use main app's Firebase app but separate database and storage
const eventsApp = app; // Use main app
const eventsAuth = auth; // Use main app's authentication
const eventsDb: Firestore = getFirestore(eventsApp, 'events'); // Separate database
const eventsStorage: FirebaseStorage = getStorage(eventsApp, process.env.REACT_APP_EVENTS_STORAGE_BUCKET || 'amaplay007-events'); // Separate storage

// Events Analytics - Use main app analytics
const eventsAnalytics = analytics;

// Connect to emulators in development (only for events-specific services)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR) {
  // Don't connect auth emulator since we're using main app's auth
  connectFirestoreEmulator(eventsDb, 'localhost', 8080);
  connectStorageEmulator(eventsStorage, 'localhost', 9199);
}

// Validation function
export const validateEventsFirebaseConfig = () => {
  const issues: string[] = [];

  // Check if main app is properly configured
  if (!eventsApp) {
    issues.push('Main Firebase app not available');
  }

  if (!eventsAuth) {
    issues.push('Main Firebase auth not available');
  }

  if (!eventsDb) {
    issues.push('Events database not initialized');
  }

  if (!eventsStorage) {
    issues.push('Events storage not initialized');
  }

  return {
    isValid: issues.length === 0,
    issues,
    config: {
      usesMainApp: true,
      separateDatabase: 'events',
      separateStorage: process.env.REACT_APP_EVENTS_STORAGE_BUCKET || 'amaplay007-events',
      sharedAuth: true,
      sharedAnalytics: true,
      // Add missing properties for compatibility
      projectId: eventsApp?.options?.projectId || 'amaplay007',
      storageBucket: process.env.REACT_APP_EVENTS_STORAGE_BUCKET || 'amaplay007-events',
      apiKey: eventsApp?.options?.apiKey || process.env.REACT_APP_FIREBASE_API_KEY
    },
    analyticsShared: true,
    authShared: true
  };
};

// Export events Firebase services
export {
  eventsApp,
  eventsAuth,
  eventsDb,
  eventsStorage,
  eventsAnalytics
};

export default eventsApp;
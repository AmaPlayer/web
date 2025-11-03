// Firestore Operations Debugger
// Helps identify what's trying to write to the events database

import { eventsDb } from '../../features/events/lib/firebase';

// Track all Firestore operations for debugging
const originalMethods = {
  setDoc: null as any,
  addDoc: null as any,
  updateDoc: null as any,
  deleteDoc: null as any
};

let isDebugging = false;

export const startFirestoreDebugging = () => {
  if (isDebugging) return;
  
  console.log('🔍 Starting Firestore operations debugging...');
  isDebugging = true;
  
  // We'll intercept operations at the application level
  // by monitoring console errors for Firestore operations
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    // Check if this is a Firestore permission error
    if (args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('Missing or insufficient permissions') ||
       arg.includes('Failed to save leaderboard') ||
       arg.includes('Failed to save ranking'))
    )) {
      
      console.log('🚨 FIRESTORE PERMISSION ERROR DETECTED!');
      console.log('🚨 Error args:', args);
      console.log('🚨 Stack trace:', new Error().stack);
      console.log('🚨 Time:', new Date().toISOString());
      
      // Try to identify the source
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        const relevantLines = lines.filter(line => 
          line.includes('.tsx') || line.includes('.ts')
        ).slice(0, 5);
        
        console.log('🚨 Likely source files:');
        relevantLines.forEach((line, index) => {
          console.log(`  ${index + 1}. ${line.trim()}`);
        });
      }
    }
    
    // Call original console.error
    originalConsoleError.apply(console, args);
  };
  
  console.log('✅ Firestore debugging enabled - will log permission errors with stack traces');
};

export const stopFirestoreDebugging = () => {
  if (!isDebugging) return;
  
  console.log('🔍 Stopping Firestore operations debugging...');
  isDebugging = false;
  
  // Note: In a real implementation, we'd restore the original console.error
  // For now, we'll just mark debugging as stopped
};

export const logFirestoreOperation = (operation: string, collection: string, data?: any) => {
  if (!isDebugging) return;
  
  console.log(`🔥 Firestore ${operation.toUpperCase()}:`, {
    collection,
    data: data ? JSON.stringify(data, null, 2) : 'N/A',
    timestamp: new Date().toISOString(),
    stack: new Error().stack?.split('\n').slice(0, 5)
  });
};

// Helper to check current authentication status
export const checkAuthStatus = async () => {
  try {
    // Import auth from events Firebase
    const { eventsAuth } = await import('../../features/events/lib/firebase');
    
    return new Promise((resolve) => {
      const unsubscribe = eventsAuth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve({
          isAuthenticated: !!user,
          userId: user?.uid || null,
          email: user?.email || null,
          displayName: user?.displayName || null
        });
      });
    });
  } catch (error) {
    console.error('Failed to check auth status:', error);
    return {
      isAuthenticated: false,
      userId: null,
      email: null,
      displayName: null,
      error: error
    };
  }
};

// Helper to test leaderboard write permissions
export const testLeaderboardWrite = async () => {
  try {
    const { setDoc, doc } = await import('firebase/firestore');
    
    console.log('🧪 Testing leaderboard write permissions...');
    
    const authStatus = await checkAuthStatus();
    console.log('🔐 Auth status:', authStatus);
    
    const testData = {
      eventId: 'test-event',
      rankings: [],
      updatedAt: new Date(),
      testWrite: true,
      timestamp: Date.now()
    };
    
    const docRef = doc(eventsDb, 'leaderboards', 'permission-test');
    await setDoc(docRef, testData);
    
    console.log('✅ Leaderboard write test PASSED');
    return { success: true, authStatus };
    
  } catch (error: any) {
    console.error('❌ Leaderboard write test FAILED:', error);
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      authStatus: await checkAuthStatus()
    };
  }
};

// Auto-start debugging in development
if (process.env.NODE_ENV === 'development') {
  startFirestoreDebugging();
  
  // Add to window for manual testing
  (window as any).firestoreDebug = {
    start: startFirestoreDebugging,
    stop: stopFirestoreDebugging,
    testLeaderboard: testLeaderboardWrite,
    checkAuth: checkAuthStatus
  };
  
  console.log('🛠️ Firestore debug tools available at window.firestoreDebug');
}

export default {
  startFirestoreDebugging,
  stopFirestoreDebugging,
  logFirestoreOperation,
  checkAuthStatus,
  testLeaderboardWrite
};
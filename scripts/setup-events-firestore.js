/**
 * Firestore Collections Setup Script for Events Platform
 * 
 * This script initializes the Firestore collections and subcollections
 * needed for the events platform integration.
 * 
 * Run with: node scripts/setup-events-firestore.js
 * 
 * Note: This script creates the collection structure. The composite indexes
 * must be deployed separately using: firebase deploy --only firestore:indexes
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✓ Firebase Admin initialized successfully');
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  console.log('\nPlease ensure you have a service account key file.');
  console.log('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Collection schemas for events platform
 */
const COLLECTIONS = {
  events: {
    name: 'events',
    description: 'Main events collection',
    sampleDoc: {
      title: 'Sample Basketball Tournament',
      description: 'A sample event for testing',
      sport: 'Basketball',
      location: 'Mumbai, India',
      startDate: admin.firestore.Timestamp.now(),
      endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      status: 'upcoming',
      category: 'upcoming',
      createdBy: 'sample_user_id',
      videoUrl: null,
      thumbnailUrl: null,
      participantIds: [],
      interestedIds: [],
      maybeIds: [],
      reactions: [],
      viewCount: 0,
      shareCount: 0,
      commentCount: 0,
      isTrending: false,
      isOfficial: false,
      eventType: 'community',
      hostType: 'user',
      maxParticipants: null,
      prizes: [],
      rules: null,
      submissionDeadline: null,
      votingDeadline: null,
      submissionCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  },
  participations: {
    name: 'participations',
    description: 'User participation tracking',
    sampleDoc: {
      userId: 'sample_user_id',
      eventId: 'sample_event_id',
      type: 'going',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'web',
        notificationsEnabled: true
      }
    }
  },
  achievements: {
    name: 'achievements',
    description: 'User achievements and badges',
    sampleDoc: {
      userId: 'sample_user_id',
      badgeType: 'participation',
      badgeName: 'First Event',
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      eventId: 'sample_event_id',
      metadata: {
        description: 'Joined your first event',
        icon: '🏆'
      }
    }
  },
  leaderboards: {
    name: 'leaderboards',
    description: 'Leaderboard entries',
    sampleDoc: {
      userId: 'sample_user_id',
      userName: 'Sample User',
      score: 100,
      rank: 1,
      type: 'engagement',
      period: 'weekly',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  },
  challenges: {
    name: 'challenges',
    description: 'Event challenges',
    sampleDoc: {
      eventId: 'sample_event_id',
      title: 'Sample Challenge',
      description: 'Complete this challenge to earn points',
      type: 'skill',
      startDate: admin.firestore.Timestamp.now(),
      endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      participants: [],
      submissions: []
    }
  }
};

/**
 * Create a collection with a sample document
 */
async function createCollection(collectionConfig) {
  const { name, description, sampleDoc } = collectionConfig;
  
  try {
    console.log(`\n📁 Setting up collection: ${name}`);
    console.log(`   Description: ${description}`);
    
    // Check if collection already has documents
    const snapshot = await db.collection(name).limit(1).get();
    
    if (!snapshot.empty) {
      console.log(`   ℹ Collection "${name}" already exists with ${snapshot.size} document(s)`);
      return { success: true, existed: true };
    }
    
    // Create sample document
    const docRef = await db.collection(name).add(sampleDoc);
    console.log(`   ✓ Created sample document with ID: ${docRef.id}`);
    
    // Delete the sample document (we just needed to create the collection)
    await docRef.delete();
    console.log(`   ✓ Removed sample document (collection structure created)`);
    
    return { success: true, existed: false };
  } catch (error) {
    console.error(`   ✗ Failed to create collection "${name}":`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create eventStats subcollection under users
 */
async function createEventStatsSubcollection() {
  console.log('\n📁 Setting up eventStats subcollection under users');
  
  try {
    // We need to create a sample user document with eventStats subcollection
    const sampleUserId = 'sample_user_for_events';
    const userRef = db.collection('users').doc(sampleUserId);
    
    // Check if this sample user exists
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create sample user
      await userRef.set({
        displayName: 'Sample User',
        email: 'sample@example.com',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        _isSample: true
      });
      console.log(`   ✓ Created sample user: ${sampleUserId}`);
    }
    
    // Create eventStats subcollection
    const statsRef = userRef.collection('eventStats').doc('stats');
    const statsDoc = await statsRef.get();
    
    if (!statsDoc.exists) {
      await statsRef.set({
        totalEvents: 0,
        eventsJoined: 0,
        eventsCompleted: 0,
        engagementPoints: 0,
        achievementCount: 0,
        currentStreak: 0,
        lastActivity: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✓ Created eventStats subcollection structure`);
    } else {
      console.log(`   ℹ eventStats subcollection already exists`);
    }
    
    // Clean up sample user
    await userRef.delete();
    console.log(`   ✓ Removed sample user (subcollection structure created)`);
    
    return { success: true };
  } catch (error) {
    console.error(`   ✗ Failed to create eventStats subcollection:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main setup function
 */
async function setupEventsFirestore() {
  console.log('🚀 Starting Firestore Events Platform Setup\n');
  console.log('=' .repeat(60));
  
  const results = {
    collections: {},
    subcollections: {}
  };
  
  // Create main collections
  for (const [key, config] of Object.entries(COLLECTIONS)) {
    const result = await createCollection(config);
    results.collections[key] = result;
  }
  
  // Create eventStats subcollection
  results.subcollections.eventStats = await createEventStatsSubcollection();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Setup Summary:\n');
  
  const collectionsCreated = Object.values(results.collections)
    .filter(r => r.success && !r.existed).length;
  const collectionsExisted = Object.values(results.collections)
    .filter(r => r.success && r.existed).length;
  const collectionsFailed = Object.values(results.collections)
    .filter(r => !r.success).length;
  
  console.log(`✓ Collections created: ${collectionsCreated}`);
  console.log(`ℹ Collections already existed: ${collectionsExisted}`);
  if (collectionsFailed > 0) {
    console.log(`✗ Collections failed: ${collectionsFailed}`);
  }
  
  if (results.subcollections.eventStats.success) {
    console.log(`✓ Subcollections created: 1 (eventStats)`);
  } else {
    console.log(`✗ Subcollections failed: 1 (eventStats)`);
  }
  
  console.log('\n📝 Next Steps:\n');
  console.log('1. Deploy Firestore indexes:');
  console.log('   firebase deploy --only firestore:indexes\n');
  console.log('2. Review and deploy security rules:');
  console.log('   firebase deploy --only firestore:rules\n');
  console.log('3. Set up Firebase Storage rules:');
  console.log('   firebase deploy --only storage\n');
  
  console.log('=' .repeat(60));
  
  // Exit
  process.exit(collectionsFailed > 0 ? 1 : 0);
}

// Run setup
setupEventsFirestore().catch(error => {
  console.error('\n❌ Setup failed with error:', error);
  process.exit(1);
});

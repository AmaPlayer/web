

/**
 * Firestore Collections Setup Script for a specific database.
 */

const admin = require('firebase-admin');
const path = require('path');

// --- CONFIGURATION ---
// IMPORTANT: Change this to the Database ID you created in the Firebase Console.
const TARGET_DATABASE_ID = 'events-db'; 
// -------------------

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(__dirname, '../serviceAccountKey.json');

let db;

try {
  const serviceAccount = require(serviceAccountPath);
  // Initialize the default app
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  // Get a reference to the specific Firestore database
  db = admin.firestore().database(TARGET_DATABASE_ID);
  console.log(`✓ Firebase Admin initialized successfully for database: ${TARGET_DATABASE_ID}`);
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  console.log('\nPlease ensure you have a service account key file at web/serviceAccountKey.json');
  process.exit(1);
}

const sampleEvent = {
    title: 'Sample Basketball Tournament',
    description: 'A sample event for testing the new events database.',
    sport: 'Basketball',
    location: 'Mumbai, India',
    startDate: admin.firestore.Timestamp.now(),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'upcoming',
    category: 'upcoming',
    createdBy: 'system_seed',
    isOfficial: true,
    eventType: 'tournament',
    hostType: 'amaplayer_official',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seedDatabase() {
    console.log(`\n🚀 Seeding database: ${TARGET_DATABASE_ID}`);
    const eventsCollection = db.collection('events');
    const snapshot = await eventsCollection.limit(1).get();

    if (!snapshot.empty) {
        console.log('ℹ️ Database already contains data. Skipping seed.');
        return;
    }

    await eventsCollection.add(sampleEvent);
    console.log('✓ Successfully seeded the "events" collection with a sample document.');
}

seedDatabase()
  .then(() => {
    console.log('\n✨ Database setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Setup failed with error:', error);
    process.exit(1);
  });

/**
 * Complete Events Database Setup Script
 * Creates a clean, isolated database structure for events
 */

const admin = require('firebase-admin');
const path = require('path');

// Configuration
const TARGET_DATABASE_ID = 'events-db';
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(__dirname, '../serviceAccountKey.json');

let db;

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  db = admin.firestore().database(TARGET_DATABASE_ID);
  console.log(`✓ Firebase Admin initialized for database: ${TARGET_DATABASE_ID}`);
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

// Database Collections Structure
const COLLECTIONS = {
  // Core Events
  EVENTS: 'events',
  EVENT_CATEGORIES: 'eventCategories',
  EVENT_TEMPLATES: 'eventTemplates',
  
  // Participants & Registration
  REGISTRATIONS: 'registrations',
  PARTICIPANTS: 'participants',
  TEAMS: 'teams',
  
  // Competition Management
  TOURNAMENTS: 'tournaments',
  MATCHES: 'matches',
  BRACKETS: 'brackets',
  ROUNDS: 'rounds',
  
  // Submissions & Voting
  SUBMISSIONS: 'submissions',
  VOTES: 'votes',
  JUDGES: 'judges',
  SCORING: 'scoring',
  
  // Analytics & Metrics
  EVENT_ANALYTICS: 'eventAnalytics',
  ENGAGEMENT_METRICS: 'engagementMetrics',
  PERFORMANCE_STATS: 'performanceStats',
  
  // Media & Content
  EVENT_MEDIA: 'eventMedia',
  LIVE_STREAMS: 'liveStreams',
  HIGHLIGHTS: 'highlights',
  
  // Communication
  ANNOUNCEMENTS: 'announcements',
  NOTIFICATIONS: 'notifications',
  CHAT_ROOMS: 'chatRooms',
  
  // Administration
  EVENT_LOGS: 'eventLogs',
  MODERATION: 'moderation',
  REPORTS: 'reports'
};

// Sample Data Templates
const sampleEventCategories = [
  {
    id: 'tournament',
    name: 'Tournament',
    description: 'Competitive tournaments with brackets and elimination rounds',
    icon: '🏆',
    color: '#FFD700',
    isActive: true
  },
  {
    id: 'competition',
    name: 'Competition',
    description: 'Skill-based competitions with judging and scoring',
    icon: '🥇',
    color: '#FF6B35',
    isActive: true
  },
  {
    id: 'challenge',
    name: 'Challenge',
    description: 'Community challenges and skill showcases',
    icon: '⚡',
    color: '#4ECDC4',
    isActive: true
  },
  {
    id: 'training',
    name: 'Training',
    description: 'Training sessions and skill development events',
    icon: '💪',
    color: '#45B7D1',
    isActive: true
  }
];

const sampleEvent = {
  title: 'AmaPlayer Basketball Championship 2024',
  description: 'The ultimate basketball tournament featuring the best players from around the world.',
  sport: 'Basketball',
  category: 'tournament',
  location: 'Mumbai, India',
  venue: 'AmaPlayer Sports Complex',
  startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  registrationDeadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
  status: 'upcoming',
  eventType: 'tournament',
  hostType: 'amaplayer_official',
  isOfficial: true,
  isFeatured: true,
  maxParticipants: 64,
  currentParticipants: 0,
  entryFee: 500,
  currency: 'INR',
  prizes: [
    { position: 1, amount: 50000, currency: 'INR', title: 'Champion' },
    { position: 2, amount: 25000, currency: 'INR', title: 'Runner-up' },
    { position: 3, amount: 15000, currency: 'INR', title: 'Third Place' }
  ],
  rules: [
    'All participants must be registered AmaPlayer users',
    'Age limit: 16-35 years',
    'Valid ID proof required',
    'Follow fair play guidelines'
  ],
  requirements: [
    'Basketball shoes',
    'Sports attire',
    'Water bottle',
    'Medical certificate'
  ],
  tags: ['basketball', 'tournament', 'championship', 'official'],
  metrics: {
    views: 0,
    registrations: 0,
    submissions: 0,
    engagement: 0,
    shares: 0
  },
  media: {
    bannerUrl: null,
    thumbnailUrl: null,
    videoUrl: null,
    galleryUrls: []
  },
  createdBy: 'system_admin',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

const sampleEventTemplate = {
  name: 'Basketball Tournament Template',
  description: 'Standard template for basketball tournaments',
  sport: 'Basketball',
  category: 'tournament',
  defaultDuration: 7, // days
  defaultMaxParticipants: 64,
  defaultRules: [
    'All participants must be registered users',
    'Age verification required',
    'Follow fair play guidelines'
  ],
  defaultRequirements: [
    'Basketball shoes',
    'Sports attire',
    'Water bottle'
  ],
  isActive: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

async function setupDatabase() {
  console.log(`\n🚀 Setting up complete events database: ${TARGET_DATABASE_ID}`);
  
  try {
    // Check if database already has data
    const eventsSnapshot = await db.collection(COLLECTIONS.EVENTS).limit(1).get();
    if (!eventsSnapshot.empty) {
      console.log('ℹ️ Database already contains data. Skipping setup.');
      return;
    }

    console.log('📝 Creating database structure...');

    // Create event categories
    console.log('  → Setting up event categories...');
    const batch1 = db.batch();
    sampleEventCategories.forEach(category => {
      const ref = db.collection(COLLECTIONS.EVENT_CATEGORIES).doc(category.id);
      batch1.set(ref, {
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch1.commit();

    // Create sample event
    console.log('  → Creating sample event...');
    const eventRef = await db.collection(COLLECTIONS.EVENTS).add(sampleEvent);
    const eventId = eventRef.id;

    // Create event analytics document
    console.log('  → Setting up event analytics...');
    await db.collection(COLLECTIONS.EVENT_ANALYTICS).doc(eventId).set({
      eventId,
      totalViews: 0,
      uniqueViews: 0,
      registrationRate: 0,
      completionRate: 0,
      engagementScore: 0,
      viewsByDay: {},
      registrationsByDay: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create event template
    console.log('  → Creating event template...');
    await db.collection(COLLECTIONS.EVENT_TEMPLATES).add(sampleEventTemplate);

    // Create initial collections with placeholder documents
    console.log('  → Initializing collections...');
    const batch2 = db.batch();
    
    // Initialize other collections with metadata documents
    const collectionsToInit = [
      COLLECTIONS.REGISTRATIONS,
      COLLECTIONS.PARTICIPANTS,
      COLLECTIONS.SUBMISSIONS,
      COLLECTIONS.VOTES,
      COLLECTIONS.EVENT_MEDIA,
      COLLECTIONS.ANNOUNCEMENTS
    ];

    collectionsToInit.forEach(collectionName => {
      const ref = db.collection(collectionName).doc('_metadata');
      batch2.set(ref, {
        collection: collectionName,
        description: `Metadata document for ${collectionName} collection`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isMetadata: true
      });
    });

    await batch2.commit();

    console.log('✅ Database structure created successfully!');
    console.log(`📊 Sample event created with ID: ${eventId}`);
    console.log(`🏷️  ${sampleEventCategories.length} event categories created`);
    console.log(`📋 Event template created`);
    console.log(`🗂️  ${collectionsToInit.length} collections initialized`);

  } catch (error) {
    console.error('❌ Failed to setup database:', error);
    throw error;
  }
}

async function createIndexes() {
  console.log('\n📇 Creating database indexes...');
  
  // Note: Firestore indexes are typically created automatically when queries are run
  // or can be defined in firestore.indexes.json
  console.log('ℹ️ Indexes will be created automatically when queries are executed');
  console.log('💡 Consider creating composite indexes in Firebase Console for complex queries');
}

async function displayDatabaseInfo() {
  console.log('\n📋 Database Information:');
  console.log(`Database ID: ${TARGET_DATABASE_ID}`);
  console.log('Collections created:');
  
  Object.entries(COLLECTIONS).forEach(([key, value]) => {
    console.log(`  • ${value} (${key})`);
  });
  
  console.log('\n🔗 Access your database:');
  console.log(`Firebase Console: https://console.firebase.google.com/project/[PROJECT_ID]/firestore/databases/${TARGET_DATABASE_ID}/data`);
}

// Main execution
async function main() {
  try {
    await setupDatabase();
    await createIndexes();
    await displayDatabaseInfo();
    
    console.log('\n✨ Events database setup complete!');
    console.log('🚀 You can now use the events database for clean, isolated event management');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
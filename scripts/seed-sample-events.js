/**
 * Seed Sample Events Script
 *
 * This script creates sample events in Firestore for testing and demonstration.
 * Run this to populate your events collection with realistic data.
 *
 * Usage: node scripts/seed-sample-events.js [--count=10]
 *
 * Options:
 *   --count      Number of sample events to create (default: 10)
 *   --clear      Clear existing sample events before seeding
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const countArg = args.find(arg => arg.startsWith('--count='));
const eventCount = countArg ? parseInt(countArg.split('=')[1]) : 10;
const shouldClear = args.includes('--clear');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ||
  path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✓ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  console.log('\nPlease ensure you have a service account key file.');
  console.log('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

// Sample data
const sports = ['Basketball', 'Football', 'Cricket', 'Tennis', 'Badminton', 'Swimming', 'Athletics', 'Volleyball'];
const cities = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 }
];

const eventTemplates = [
  {
    titleTemplate: '%sport% Championship 2025',
    description: 'Annual %sport% tournament for amateur athletes. Join us for an exciting competition!',
    eventType: 'tournament'
  },
  {
    titleTemplate: '%sport% Training Camp',
    description: 'Intensive %sport% training program for beginners and intermediate players.',
    eventType: 'community'
  },
  {
    titleTemplate: 'City %sport% League',
    description: 'Join the city-wide %sport% league and compete with teams from across the region.',
    eventType: 'tournament'
  },
  {
    titleTemplate: '%sport% Workshop',
    description: 'Learn advanced techniques and strategies from professional %sport% coaches.',
    eventType: 'community'
  },
  {
    titleTemplate: 'AmaPlayer %sport% Talent Hunt',
    description: 'Showcase your %sport% skills and win exciting prizes! Open to all skill levels.',
    eventType: 'talent_hunt'
  }
];

// Simple geohash encoding (for location queries)
function encodeGeohash(latitude, longitude, precision = 8) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude > lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude > latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

// Generate random date in the future
function getRandomFutureDate(minDays = 1, maxDays = 90) {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const futureDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return futureDate;
}

// Determine event status and category based on dates
function determineStatusAndCategory(startDate, endDate) {
  const now = new Date();

  if (now < startDate) {
    return { status: 'upcoming', category: 'upcoming' };
  } else if (now > (endDate || startDate)) {
    return { status: 'completed', category: 'amaplayer' };
  } else {
    return { status: 'ongoing', category: 'ongoing_tournament' };
  }
}

// Generate sample event
function generateSampleEvent(index) {
  const sport = sports[Math.floor(Math.random() * sports.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];

  const startDate = getRandomFutureDate(1, 60);
  const endDate = new Date(startDate.getTime() + (Math.random() < 0.5 ? 0 : Math.random() * 7) * 24 * 60 * 60 * 1000);

  const { status, category } = determineStatusAndCategory(startDate, endDate);

  const title = template.titleTemplate.replace('%sport%', sport);
  const description = template.description.replace(/%sport%/g, sport);

  const participantCount = Math.floor(Math.random() * 50);
  const interestedCount = Math.floor(Math.random() * 30);
  const maybeCount = Math.floor(Math.random() * 20);

  return {
    title,
    description,
    sport,
    tags: [sport.toLowerCase(), template.eventType, city.name.toLowerCase()],

    // Enhanced Location
    location: {
      displayName: `${city.name} Sports Complex, ${city.name}, ${city.state}, India`,
      venue: `${city.name} Sports Complex`,
      address: {
        street: `Stadium Road, ${city.name}`,
        city: city.name,
        state: city.state,
        country: 'India',
        postalCode: '400001'
      },
      coordinates: {
        latitude: city.lat,
        longitude: city.lng,
        geohash: encodeGeohash(city.lat, city.lng)
      }
    },

    // Dates & Time
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    endDate: endDate ? admin.firestore.Timestamp.fromDate(endDate) : null,
    timezone: 'Asia/Kolkata',
    registrationStartDate: admin.firestore.Timestamp.now(),
    registrationEndDate: admin.firestore.Timestamp.fromDate(startDate),

    // Status & Classification
    status,
    category,
    eventType: template.eventType,
    hostType: template.eventType === 'talent_hunt' ? 'amaplayer_official' : 'user',

    // Organizer
    createdBy: 'sample_organizer_' + (index % 3 + 1),
    organizerInfo: {
      userId: 'sample_organizer_' + (index % 3 + 1),
      displayName: ['Sports Club Admin', 'Event Organizer', 'Community Leader'][index % 3],
      photoURL: null,
      email: `organizer${index % 3 + 1}@example.com`,
      phone: '+91-1234567890',
      isVerified: Math.random() > 0.5
    },

    // Media
    mediaFiles: [],

    // Capacity
    capacity: {
      maxParticipants: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 50 : null,
      currentParticipants: participantCount,
      waitlistEnabled: Math.random() > 0.7,
      currentWaitlist: 0,
      registrationRequired: true,
      approvalRequired: Math.random() > 0.8
    },

    // Metrics
    metrics: {
      participantCount,
      interestedCount,
      maybeCount,
      viewCount: Math.floor(Math.random() * 500),
      shareCount: Math.floor(Math.random() * 50),
      commentCount: Math.floor(Math.random() * 30),
      reactionCount: Math.floor(Math.random() * 100),
      uniqueVisitors: Math.floor(Math.random() * 400)
    },

    // Visibility
    visibility: {
      isPublic: true,
      isDiscoverable: true,
      isFeatured: Math.random() > 0.8,
      isSponsored: Math.random() > 0.9,
      requiresApproval: false
    },

    // Financial
    financial: {
      isFree: Math.random() > 0.3,
      registrationFee: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 500) + 100,
      currency: 'INR',
      prizes: template.eventType === 'talent_hunt'
        ? ['Trophy', `Cash Prize: ₹${Math.floor(Math.random() * 50000) + 10000}`]
        : ['Trophy', 'Medal', 'Certificate'],
      totalPrizePool: template.eventType === 'talent_hunt' ? Math.floor(Math.random() * 50000) + 10000 : 0,
      paymentRequired: Math.random() > 0.7,
      refundPolicy: 'Full refund until 24h before event'
    },

    // Event Specific
    isOfficial: template.eventType === 'talent_hunt',
    isTrending: Math.random() > 0.7,
    trendingScore: Math.floor(Math.random() * 1000),
    qualityScore: Math.random() * 10,

    // Talent Hunt Specific
    talentHunt: template.eventType === 'talent_hunt' ? {
      submissionDeadline: admin.firestore.Timestamp.fromDate(new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
      votingDeadline: admin.firestore.Timestamp.fromDate(startDate),
      submissionCount: Math.floor(Math.random() * 50),
      maxSubmissionsPerUser: 1,
      votingEnabled: true,
      judgesEnabled: true,
      judges: ['judge_user_1', 'judge_user_2']
    } : null,

    // Requirements
    requirements: {
      minAge: Math.random() > 0.5 ? 13 : null,
      maxAge: Math.random() > 0.7 ? 35 : null,
      skillLevel: ['all', 'beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 4)],
      equipmentNeeded: [`${sport} equipment`, 'Sports shoes', 'Water bottle'],
      rules: `Standard ${sport} rules apply. Fair play expected.`,
      eligibilityCriteria: 'Open to all amateur athletes'
    },

    // Social Features
    social: {
      allowComments: true,
      allowReactions: true,
      allowSharing: true,
      discussionEnabled: true,
      chatEnabled: Math.random() > 0.5,
      streamingUrl: null
    },

    // Notifications
    notifications: {
      reminderSent: false,
      reminderScheduled: null,
      updateNotificationsEnabled: true
    },

    // Moderation
    moderation: {
      isApproved: true,
      approvedBy: 'admin_123',
      approvedAt: admin.firestore.Timestamp.now(),
      flagCount: 0,
      reportCount: 0,
      moderationNotes: null
    },

    // Timestamps
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),

    // Metadata
    metadata: {
      source: 'seed_script',
      version: 2,
      migrated: false,
      importedFrom: 'sample_data'
    }
  };
}

// Clear existing sample events
async function clearSampleEvents() {
  console.log('🗑️  Clearing existing sample events...\n');

  try {
    const snapshot = await db.collection('events')
      .where('metadata.importedFrom', '==', 'sample_data')
      .get();

    if (snapshot.empty) {
      console.log('  No existing sample events found.\n');
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`  ✓ Cleared ${snapshot.size} sample events\n`);
    return snapshot.size;
  } catch (error) {
    console.error('  ✗ Failed to clear sample events:', error.message);
    return 0;
  }
}

// Seed events
async function seedEvents() {
  console.log('🌱 Seeding Sample Events\n');
  console.log('='.repeat(60));
  console.log(`Creating ${eventCount} sample events...\n`);

  try {
    if (shouldClear) {
      await clearSampleEvents();
    }

    const events = [];
    for (let i = 0; i < eventCount; i++) {
      events.push(generateSampleEvent(i));
    }

    // Create events in batches
    const batchSize = 10;
    let created = 0;

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = db.batch();
      const batchEvents = events.slice(i, i + batchSize);

      batchEvents.forEach(event => {
        const docRef = db.collection('events').doc();
        batch.set(docRef, event);
      });

      await batch.commit();
      created += batchEvents.length;
      console.log(`  ✓ Created ${created}/${eventCount} events`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Successfully seeded ${created} sample events!\n`);
    console.log('📝 Next Steps:\n');
    console.log('1. View events in Firebase Console');
    console.log('2. Access events in your application');
    console.log('3. Create leaderboard data: node scripts/seed-sample-leaderboard.js\n');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Failed to seed events:', error);
    process.exit(1);
  }
}

// Run seeding
seedEvents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

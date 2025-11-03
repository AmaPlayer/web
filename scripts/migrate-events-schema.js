/**
 * Event Schema Migration Script
 *
 * Migrates existing events from the old schema to the new enhanced schema.
 *
 * Changes:
 * 1. Move participantIds/interestedIds/maybeIds to participants subcollection
 * 2. Move reactions array to reactions subcollection
 * 3. Add new structured location with coordinates
 * 4. Add timezone, capacity, visibility, and other new fields
 * 5. Restructure media to support multiple files
 * 6. Add organizer info, financial data, and requirements
 *
 * Usage: node scripts/migrate-events-schema.js [--dry-run] [--batch-size=50]
 *
 * Options:
 *   --dry-run       Preview changes without applying them
 *   --batch-size    Number of events to process in each batch (default: 50)
 *   --event-id      Migrate specific event only
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;
const eventIdArg = args.find(arg => arg.startsWith('--event-id='));
const specificEventId = eventIdArg ? eventIdArg.split('=')[1] : null;

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

// Helper: Get approximate location coordinates (placeholder - use geocoding API in production)
function getCoordinatesForLocation(locationString) {
  // This is a simplified version. In production, use Google Geocoding API
  // or another geocoding service to get accurate coordinates
  const locationMap = {
    'mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'delhi': { latitude: 28.7041, longitude: 77.1025 },
    'bangalore': { latitude: 12.9716, longitude: 77.5946 },
    'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
    'chennai': { latitude: 13.0827, longitude: 80.2707 },
    'kolkata': { latitude: 22.5726, longitude: 88.3639 },
    'pune': { latitude: 18.5204, longitude: 73.8567 },
    'ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
  };

  const locationLower = locationString.toLowerCase();
  for (const [city, coords] of Object.entries(locationMap)) {
    if (locationLower.includes(city)) {
      return coords;
    }
  }

  // Default to India center if no match
  return { latitude: 20.5937, longitude: 78.9629 };
}

// Helper: Simple geohash implementation (for location queries)
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

// Helper: Parse location string into structured format
function parseLocation(locationString) {
  const parts = locationString.split(',').map(s => s.trim());
  const coords = getCoordinatesForLocation(locationString);

  return {
    displayName: locationString,
    venue: parts[0] || locationString,
    address: {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts.length > 2 ? parts[parts.length - 2] : '',
      country: parts[parts.length - 1] || 'India',
      postalCode: ''
    },
    coordinates: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      geohash: encodeGeohash(coords.latitude, coords.longitude)
    }
  };
}

// Helper: Get timezone for location (simplified)
function getTimezoneForLocation(locationString) {
  // Simplified timezone mapping. In production, use a proper timezone API
  const timezoneMap = {
    'india': 'Asia/Kolkata',
    'mumbai': 'Asia/Kolkata',
    'delhi': 'Asia/Kolkata',
    'bangalore': 'Asia/Kolkata',
    'usa': 'America/New_York',
    'uk': 'Europe/London',
    'singapore': 'Asia/Singapore',
  };

  const locationLower = locationString.toLowerCase();
  for (const [key, timezone] of Object.entries(timezoneMap)) {
    if (locationLower.includes(key)) {
      return timezone;
    }
  }

  return 'Asia/Kolkata'; // Default
}

// Migrate a single event
async function migrateEvent(eventDoc) {
  const oldData = eventDoc.data();
  const eventId = eventDoc.id;

  console.log(`\n📝 Migrating event: ${eventId} - "${oldData.title}"`);

  try {
    // Step 1: Build new event data structure
    const newEventData = {
      // Keep existing basic fields
      title: oldData.title,
      description: oldData.description,
      sport: oldData.sport,
      tags: oldData.tags || [oldData.sport.toLowerCase(), oldData.eventType || 'community'],

      // Enhanced location
      location: parseLocation(oldData.location || 'Unknown Location'),

      // Dates & Time
      startDate: oldData.startDate,
      endDate: oldData.endDate || null,
      timezone: getTimezoneForLocation(oldData.location || ''),
      registrationStartDate: oldData.createdAt, // Use creation date as default
      registrationEndDate: oldData.startDate,   // Registration ends when event starts

      // Status & Classification
      status: oldData.status,
      category: oldData.category,
      eventType: oldData.eventType || 'community',
      hostType: oldData.hostType || 'user',

      // Organizer Information (fetch user data if needed)
      createdBy: oldData.createdBy,
      organizerInfo: {
        userId: oldData.createdBy,
        displayName: 'Event Organizer', // Would fetch from users collection in production
        photoURL: null,
        email: null,
        phone: null,
        isVerified: false
      },

      // Media files (restructure)
      mediaFiles: [],

      // Capacity & Registration
      capacity: {
        maxParticipants: oldData.maxParticipants || null,
        currentParticipants: (oldData.participantIds || []).length,
        waitlistEnabled: false,
        currentWaitlist: 0,
        registrationRequired: true,
        approvalRequired: false
      },

      // Engagement Metrics (no more arrays in main doc)
      metrics: {
        participantCount: (oldData.participantIds || []).length,
        interestedCount: (oldData.interestedIds || []).length,
        maybeCount: (oldData.maybeIds || []).length,
        viewCount: oldData.viewCount || 0,
        shareCount: oldData.shareCount || 0,
        commentCount: oldData.commentCount || 0,
        reactionCount: (oldData.reactions || []).length,
        uniqueVisitors: oldData.viewCount || 0
      },

      // Visibility & Access
      visibility: {
        isPublic: true,
        isDiscoverable: true,
        isFeatured: false,
        isSponsored: false,
        requiresApproval: false
      },

      // Financial
      financial: {
        isFree: true,
        registrationFee: 0,
        currency: 'INR',
        prizes: oldData.prizes || [],
        totalPrizePool: 0,
        paymentRequired: false,
        refundPolicy: null
      },

      // Event Specific
      isOfficial: oldData.isOfficial || false,
      isTrending: oldData.isTrending || false,
      trendingScore: 0,
      qualityScore: 7.5,

      // Talent Hunt Specific
      talentHunt: oldData.eventType === 'talent_hunt' ? {
        submissionDeadline: oldData.submissionDeadline || null,
        votingDeadline: oldData.votingDeadline || null,
        submissionCount: oldData.submissionCount || 0,
        maxSubmissionsPerUser: 1,
        votingEnabled: true,
        judgesEnabled: false,
        judges: []
      } : null,

      // Requirements & Rules
      requirements: {
        minAge: null,
        maxAge: null,
        skillLevel: 'all',
        equipmentNeeded: [],
        rules: oldData.rules || null,
        eligibilityCriteria: null
      },

      // Social Features
      social: {
        allowComments: true,
        allowReactions: true,
        allowSharing: true,
        discussionEnabled: true,
        chatEnabled: false,
        streamingUrl: null
      },

      // Notifications
      notifications: {
        reminderSent: false,
        reminderScheduled: null,
        updateNotificationsEnabled: true
      },

      // Admin & Moderation
      moderation: {
        isApproved: true,
        approvedBy: null,
        approvedAt: oldData.createdAt,
        flagCount: 0,
        reportCount: 0,
        moderationNotes: null
      },

      // Timestamps
      createdAt: oldData.createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityAt: oldData.updatedAt || oldData.createdAt,
      publishedAt: oldData.createdAt,

      // Metadata
      metadata: {
        source: 'migration',
        version: 2,
        migrated: true,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        importedFrom: null
      }
    };

    // Add media files if they exist
    if (oldData.videoUrl) {
      newEventData.mediaFiles.push({
        type: 'video',
        url: oldData.videoUrl,
        thumbnailUrl: oldData.thumbnailUrl || null,
        isPrimary: true,
        duration: null,
        size: null
      });
    }

    if (isDryRun) {
      console.log('  📋 [DRY RUN] Would update main event document');
      console.log(`     - Structured location: ${newEventData.location.displayName}`);
      console.log(`     - Timezone: ${newEventData.timezone}`);
      console.log(`     - Participants to migrate: ${(oldData.participantIds || []).length}`);
      console.log(`     - Reactions to migrate: ${(oldData.reactions || []).length}`);
    } else {
      // Update main event document
      await db.collection('events').doc(eventId).set(newEventData, { merge: true });
      console.log('  ✓ Updated main event document');
    }

    // Step 2: Migrate participants to subcollection
    const participantIds = oldData.participantIds || [];
    const interestedIds = oldData.interestedIds || [];
    const maybeIds = oldData.maybeIds || [];

    const participantsData = [
      ...participantIds.map(userId => ({ userId, type: 'going' })),
      ...interestedIds.map(userId => ({ userId, type: 'interested' })),
      ...maybeIds.map(userId => ({ userId, type: 'maybe' }))
    ];

    if (participantsData.length > 0) {
      if (isDryRun) {
        console.log(`  📋 [DRY RUN] Would create ${participantsData.length} participant documents`);
      } else {
        const batch = db.batch();
        let batchCount = 0;

        for (const participant of participantsData) {
          const participantRef = db
            .collection('events')
            .doc(eventId)
            .collection('participants')
            .doc(participant.userId);

          batch.set(participantRef, {
            userId: participant.userId,
            userName: 'Unknown User', // Would fetch from users collection in production
            userPhotoURL: null,
            userEmail: null,
            type: participant.type,
            registeredAt: oldData.createdAt,
            registrationStatus: 'confirmed',
            ticketId: null,
            paymentStatus: 'not_required',
            checkInStatus: 'not_checked_in',
            checkInTime: null,
            metadata: {
              source: 'migration',
              notificationsEnabled: true,
              reminderSet: false
            }
          });

          batchCount++;

          // Commit batch every 500 operations (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }

        console.log(`  ✓ Migrated ${participantsData.length} participants to subcollection`);
      }
    }

    // Step 3: Migrate reactions to subcollection
    const reactions = oldData.reactions || [];
    if (reactions.length > 0) {
      if (isDryRun) {
        console.log(`  📋 [DRY RUN] Would create ${reactions.length} reaction documents`);
      } else {
        const batch = db.batch();
        let batchCount = 0;

        for (const reaction of reactions) {
          const reactionRef = db
            .collection('events')
            .doc(eventId)
            .collection('reactions')
            .doc(reaction.userId);

          batch.set(reactionRef, {
            userId: reaction.userId,
            userName: reaction.userName || 'Unknown User',
            reactionType: reaction.reactionType || '🔥',
            timestamp: reaction.timestamp || oldData.createdAt
          });

          batchCount++;

          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }

        console.log(`  ✓ Migrated ${reactions.length} reactions to subcollection`);
      }
    }

    // Step 4: Create analytics document
    if (!isDryRun) {
      const analyticsRef = db
        .collection('events')
        .doc(eventId)
        .collection('analytics')
        .doc('summary');

      await analyticsRef.set({
        totalViews: oldData.viewCount || 0,
        totalShares: oldData.shareCount || 0,
        totalComments: oldData.commentCount || 0,
        totalReactions: (oldData.reactions || []).length,
        totalParticipants: (oldData.participantIds || []).length,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        dailyStats: []
      });

      console.log('  ✓ Created analytics summary document');
    }

    console.log(`  ✅ Successfully migrated event: ${eventId}`);
    return { success: true, eventId };

  } catch (error) {
    console.error(`  ✗ Failed to migrate event ${eventId}:`, error.message);
    return { success: false, eventId, error: error.message };
  }
}

// Main migration function
async function migrateAllEvents() {
  console.log('🚀 Starting Event Schema Migration\n');
  console.log('='.repeat(70));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
  console.log(`Batch size: ${batchSize}`);
  if (specificEventId) {
    console.log(`Target: Single event (${specificEventId})`);
  }
  console.log('='.repeat(70));

  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    let eventsQuery;

    if (specificEventId) {
      // Migrate specific event only
      const eventDoc = await db.collection('events').doc(specificEventId).get();
      if (!eventDoc.exists) {
        console.error(`\n✗ Event ${specificEventId} not found`);
        process.exit(1);
      }

      const result = await migrateEvent(eventDoc);
      stats.total = 1;
      if (result.success) {
        stats.success = 1;
      } else {
        stats.failed = 1;
        stats.errors.push(result);
      }
    } else {
      // Migrate all events
      // Check if events already migrated
      eventsQuery = db.collection('events')
        .where('metadata.migrated', '==', false)
        .limit(batchSize);

      // Try to get unmigrated events first
      let snapshot = await eventsQuery.get();

      // If no unmigrated events found, get all events
      if (snapshot.empty) {
        console.log('\nℹ No unmigrated events found, processing all events...\n');
        snapshot = await db.collection('events').limit(batchSize).get();
      }

      if (snapshot.empty) {
        console.log('\nℹ No events found to migrate');
        process.exit(0);
      }

      stats.total = snapshot.size;

      for (const eventDoc of snapshot.docs) {
        const result = await migrateEvent(eventDoc);
        if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
          stats.errors.push(result);
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Migration Summary:\n');
    console.log(`Total events processed: ${stats.total}`);
    console.log(`✓ Successfully migrated: ${stats.success}`);
    console.log(`✗ Failed: ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(error => {
        console.log(`  - Event ${error.eventId}: ${error.error}`);
      });
    }

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next Steps:');
      console.log('1. Verify migrated data in Firebase Console');
      console.log('2. Deploy updated Firestore indexes:');
      console.log('   firebase deploy --only firestore:indexes');
      console.log('3. Update application code to use new schema');
      console.log('4. Test thoroughly before going to production');
    }

    console.log('\n' + '='.repeat(70));

    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAllEvents();

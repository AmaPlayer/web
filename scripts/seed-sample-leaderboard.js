/**
 * Seed Sample Leaderboard Data Script
 *
 * This script creates sample user ranking data for the leaderboard.
 * Creates realistic user profiles with stats and rankings.
 *
 * Usage: node scripts/seed-sample-leaderboard.js [--count=20]
 *
 * Options:
 *   --count      Number of sample users to create (default: 20)
 *   --clear      Clear existing sample data before seeding
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const countArg = args.find(arg => arg.startsWith('--count='));
const userCount = countArg ? parseInt(countArg.split('=')[1]) : 20;
const shouldClear = args.includes('--clear');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ||
  path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);

  // Check if already initialized
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log('✓ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  console.log('\nPlease ensure you have a service account key file.');
  console.log('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

// Sample names and avatars
const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikas', 'Anita', 'Karthik', 'Meera', 'Rohan', 'Divya', 'Amit', 'Pooja', 'Sanjay', 'Kavita', 'Ravi', 'Lakshmi', 'Nikhil', 'Anjali', 'Suresh', 'Deepa'];
const lastNames = ['Kumar', 'Sharma', 'Singh', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Rao', 'Desai', 'Mehta', 'Joshi', 'Verma', 'Iyer', 'Pillai', 'Kapoor', 'Malhotra', 'Banerjee', 'Das', 'Chatterjee', 'Shah'];

// Avatar URLs (using UI Avatars service)
function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;
}

// Generate sample user ranking data
function generateSampleUserRanking(index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const userName = `${firstName} ${lastName}`;
  const userId = `sample_user_${index + 1}`;

  // Generate realistic stats
  const eventsJoined = Math.floor(Math.random() * 50) + 5;
  const eventsCompleted = Math.floor(eventsJoined * (0.6 + Math.random() * 0.3));
  const participationRate = (eventsCompleted / eventsJoined) * 100;

  const challengesCompleted = Math.floor(Math.random() * 30);
  const challengesWon = Math.floor(challengesCompleted * (0.2 + Math.random() * 0.3));
  const challengeWinRate = challengesCompleted > 0 ? (challengesWon / challengesCompleted) * 100 : 0;

  const achievementPoints = Math.floor(Math.random() * 1000) + 100;
  const rareAchievements = Math.floor(Math.random() * 5);

  const reactionsReceived = Math.floor(Math.random() * 200);
  const commentsReceived = Math.floor(Math.random() * 150);
  const mentorshipsCompleted = Math.floor(Math.random() * 10);
  const menteesHelped = Math.floor(Math.random() * 15);
  const teamContributions = Math.floor(Math.random() * 40);

  const eventsWon = Math.floor(Math.random() * 10);

  // Calculate engagement score
  const engagementScore = Math.floor(
    eventsCompleted * 10 +
    challengesWon * 20 +
    achievementPoints * 0.5 +
    reactionsReceived * 2 +
    commentsReceived * 3 +
    mentorshipsCompleted * 15
  );

  const level = Math.floor(engagementScore / 100) + 1;

  // Generate badges based on achievements
  const badges = [];
  if (eventsCompleted >= 10) {
    badges.push({
      id: `badge_${userId}_1`,
      achievementId: 'event_master',
      name: 'Event Master',
      description: 'Completed 10+ events',
      iconUrl: null,
      rarity: 'common',
      earnedAt: admin.firestore.Timestamp.now(),
      displayOrder: 0
    });
  }
  if (challengesWon >= 5) {
    badges.push({
      id: `badge_${userId}_2`,
      achievementId: 'challenge_champion',
      name: 'Challenge Champion',
      description: 'Won 5+ challenges',
      iconUrl: null,
      rarity: 'rare',
      earnedAt: admin.firestore.Timestamp.now(),
      displayOrder: 1
    });
  }
  if (level >= 5) {
    badges.push({
      id: `badge_${userId}_3`,
      achievementId: 'level_master',
      name: 'Level Master',
      description: 'Reached level 5',
      iconUrl: null,
      rarity: 'epic',
      earnedAt: admin.firestore.Timestamp.now(),
      displayOrder: 2
    });
  }

  return {
    userId,
    userName,
    userAvatar: getAvatarUrl(userName),
    stats: {
      eventsJoined,
      eventsCompleted,
      eventsWon,
      participationRate,
      challengesCompleted,
      challengesWon,
      challengeWinRate,
      achievementPoints,
      rareAchievements,
      reactionsReceived,
      commentsReceived,
      mentorshipsCompleted,
      menteesHelped,
      teamContributions
    },
    engagementScore,
    level,
    badges
  };
}

// Clear existing sample data
async function clearSampleData() {
  console.log('🗑️  Clearing existing sample leaderboard data...\n');

  try {
    const snapshot = await db.collection('userRankings')
      .where('userId', '>=', 'sample_user_')
      .where('userId', '<=', 'sample_user_\uf8ff')
      .get();

    if (snapshot.empty) {
      console.log('  No existing sample data found.\n');
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`  ✓ Cleared ${snapshot.size} sample user rankings\n`);
    return snapshot.size;
  } catch (error) {
    console.error('  ✗ Failed to clear sample data:', error.message);
    return 0;
  }
}

// Generate leaderboards from user rankings
async function generateLeaderboards(userRankings) {
  console.log('\n📊 Generating leaderboards...\n');

  const leaderboardTypes = [
    { type: 'engagement_score', period: 'all_time', scoreKey: 'engagementScore' },
    { type: 'engagement_score', period: 'weekly', scoreKey: 'engagementScore' },
    { type: 'participation', period: 'all_time', scoreKey: 'participationScore' },
    { type: 'achievements', period: 'all_time', scoreKey: 'achievementScore' },
  ];

  for (const lb of leaderboardTypes) {
    try {
      // Calculate scores based on type
      const entries = userRankings.map(user => {
        let score;
        switch (lb.scoreKey) {
          case 'engagementScore':
            score = user.engagementScore;
            break;
          case 'participationScore':
            score = (user.stats.eventsCompleted * 2) + user.stats.eventsJoined + (user.stats.participationRate / 10);
            break;
          case 'achievementScore':
            score = user.stats.achievementPoints + (user.stats.rareAchievements * 50);
            break;
          default:
            score = user.engagementScore;
        }

        return {
          userId: user.userId,
          userName: user.userName,
          userAvatar: user.userAvatar,
          score,
          rank: 0, // Will be set after sorting
          change: 'new',
          badges: user.badges,
          level: user.level
        };
      });

      // Sort by score and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Save leaderboard
      const leaderboardKey = `${lb.type}_${lb.period}`;
      const leaderboardRef = db.collection('leaderboards').doc(leaderboardKey);

      await leaderboardRef.set({
        id: leaderboardKey,
        type: lb.type,
        period: lb.period,
        entries,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`  ✓ Created leaderboard: ${leaderboardKey} (${entries.length} entries)`);
    } catch (error) {
      console.error(`  ✗ Failed to create leaderboard ${lb.type}_${lb.period}:`, error.message);
    }
  }
}

// Seed leaderboard data
async function seedLeaderboard() {
  console.log('🌱 Seeding Sample Leaderboard Data\n');
  console.log('='.repeat(60));
  console.log(`Creating ${userCount} sample user rankings...\n`);

  try {
    if (shouldClear) {
      await clearSampleData();
    }

    const userRankings = [];
    for (let i = 0; i < userCount; i++) {
      userRankings.push(generateSampleUserRanking(i));
    }

    // Save user rankings in batches
    const batchSize = 10;
    let created = 0;

    for (let i = 0; i < userRankings.length; i += batchSize) {
      const batch = db.batch();
      const batchUsers = userRankings.slice(i, i + batchSize);

      batchUsers.forEach(user => {
        const docRef = db.collection('userRankings').doc(user.userId);
        batch.set(docRef, user);
      });

      await batch.commit();
      created += batchUsers.length;
      console.log(`  ✓ Created ${created}/${userCount} user rankings`);
    }

    // Generate leaderboards from user rankings
    await generateLeaderboards(userRankings);

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Successfully seeded ${created} sample user rankings and leaderboards!\n`);
    console.log('📝 Next Steps:\n');
    console.log('1. View leaderboards in your application');
    console.log('2. Leaderboard will show the top performers');
    console.log('3. User rankings are stored in userRankings collection\n');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Failed to seed leaderboard data:', error);
    process.exit(1);
  }
}

// Run seeding
seedLeaderboard()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

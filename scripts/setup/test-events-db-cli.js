/**
 * Test Events Database via CLI
 * Verify the events database is accessible and rules are working
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(__dirname, '../serviceAccountKey.json');

let eventsDb;

try {
  const serviceAccount = require(serviceAccountPath);
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  // Connect to the events database
  eventsDb = admin.firestore(app).database('events');
  console.log('✅ Connected to events database successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\nTrying without service account (using default credentials)...');
  
  try {
    const app = admin.initializeApp();
    eventsDb = admin.firestore(app).database('events');
    console.log('✅ Connected to events database with default credentials');
  } catch (defaultError) {
    console.error('❌ Failed with default credentials too:', defaultError.message);
    process.exit(1);
  }
}

async function testEventsDatabase() {
  console.log('\n🧪 Testing Events Database Access...');
  
  try {
    // Test 1: Read from events collection
    console.log('📖 Test 1: Reading events collection...');
    const eventsSnapshot = await eventsDb.collection('events').limit(5).get();
    console.log(`✅ Successfully read events collection: ${eventsSnapshot.docs.length} documents`);
    
    // Test 2: Write to leaderboards (the main issue)
    console.log('\n📝 Test 2: Writing to leaderboards collection...');
    const testLeaderboard = {
      eventId: 'test-event-' + Date.now(),
      rankings: [
        { userId: 'user1', score: 100, rank: 1 },
        { userId: 'user2', score: 90, rank: 2 }
      ],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      testData: true
    };
    
    const leaderboardRef = await eventsDb.collection('leaderboards').add(testLeaderboard);
    console.log(`✅ Successfully wrote to leaderboards: ${leaderboardRef.id}`);
    
    // Test 3: Write to ranking history
    console.log('\n📈 Test 3: Writing to ranking history...');
    const testRankingHistory = {
      eventId: 'test-event-' + Date.now(),
      userId: 'test-user',
      previousRank: 5,
      newRank: 3,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      testData: true
    };
    
    const historyRef = await eventsDb.collection('rankingHistory').add(testRankingHistory);
    console.log(`✅ Successfully wrote to ranking history: ${historyRef.id}`);
    
    // Test 4: List all collections
    console.log('\n📋 Test 4: Listing collections...');
    const collections = await eventsDb.listCollections();
    console.log('📁 Available collections:');
    collections.forEach(collection => {
      console.log(`  • ${collection.id}`);
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await leaderboardRef.delete();
    await historyRef.delete();
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Events database is working correctly');
    console.log('✅ Rules are properly configured');
    console.log('✅ Leaderboard operations should work in your app');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('🔍 Error details:', error);
    
    if (error.message.includes('Missing or insufficient permissions')) {
      console.log('\n🔧 SOLUTION: Apply the rules to the events database:');
      console.log('1. Go to Firebase Console → Firestore Database');
      console.log('2. Select "events" database');
      console.log('3. Click "Rules" tab');
      console.log('4. Apply the rules from fix-events-database-name.js');
    }
  }
}

testEventsDatabase()
  .then(() => {
    console.log('\n✨ Events database test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
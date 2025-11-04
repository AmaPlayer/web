/**
 * Admin Script to Delete "Current User" Comments
 *
 * This script uses Firebase Admin SDK which bypasses security rules.
 * You need a service account key to run this script.
 *
 * Setup:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate new private key" and download the JSON file
 * 3. Save it as 'serviceAccountKey.json' in the scripts folder
 * 4. Run: node scripts/cleanupCommentsAdmin.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure you have the serviceAccountKey.json file in the scripts folder
try {
  const serviceAccount = require('./serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('✅ Firebase Admin SDK initialized successfully\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:');
  console.error('   Make sure you have downloaded serviceAccountKey.json');
  console.error('   from Firebase Console > Project Settings > Service Accounts');
  console.error('\n   Error details:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Delete comments with "Current User" username from moments comments collection
 */
async function cleanupMomentsComments() {
  console.log('🔍 Searching for "Current User" comments in moments...\n');

  try {
    // Query comments with "Current User" as userDisplayName
    const snapshot = await db.collection('comments')
      .where('userDisplayName', '==', 'Current User')
      .get();

    if (snapshot.empty) {
      console.log('✅ No "Current User" comments found in moments collection.\n');
      return;
    }

    console.log(`📊 Found ${snapshot.size} "Current User" comments in moments collection.\n`);

    // Group comments by momentId to update counts efficiently
    const momentCommentCounts = new Map();
    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH = 500; // Firestore batch limit

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const momentId = data.momentId;

      // Delete the comment
      batch.delete(doc.ref);
      batchCount++;
      console.log(`  📝 Queued deletion: comment ${doc.id} from moment ${momentId}`);

      // Track moment IDs for count updates
      momentCommentCounts.set(momentId, (momentCommentCounts.get(momentId) || 0) + 1);

      // Commit batch if we reach the limit
      if (batchCount >= MAX_BATCH) {
        await batch.commit();
        console.log(`  ✅ Committed batch of ${batchCount} deletions\n`);
        batchCount = 0;
      }
    }

    // Commit remaining deletions
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Committed final batch of ${batchCount} deletions\n`);
    }

    // Update moment comment counts
    console.log('📝 Updating moment comment counts...\n');
    for (const [momentId, count] of momentCommentCounts.entries()) {
      try {
        const momentRef = db.collection('moments').doc(momentId);
        const momentSnap = await momentRef.get();

        if (momentSnap.exists()) {
          const currentCount = momentSnap.data().engagement?.commentsCount || 0;
          const newCount = Math.max(0, currentCount - count);

          await momentRef.update({
            'engagement.commentsCount': newCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`  ✅ Updated moment ${momentId}: ${currentCount} → ${newCount} comments`);
        } else {
          console.log(`  ⚠️  Moment ${momentId} not found, skipping count update`);
        }
      } catch (error) {
        console.error(`  ⚠️  Failed to update moment ${momentId}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully deleted ${snapshot.size} "Current User" comments from moments.\n`);
  } catch (error) {
    console.error('❌ Error cleaning up moments comments:', error);
    throw error;
  }
}

/**
 * Remove comments with "Current User" username from posts
 */
async function cleanupPostsComments() {
  console.log('🔍 Searching for "Current User" comments in posts...\n');

  try {
    // Get all posts
    const snapshot = await db.collection('posts').get();

    if (snapshot.empty) {
      console.log('✅ No posts found.\n');
      return;
    }

    console.log(`📊 Checking ${snapshot.size} posts for "Current User" comments...\n`);

    let totalCommentsRemoved = 0;
    let postsUpdated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const comments = data.comments || [];

      // Filter out "Current User" comments
      const currentUserComments = comments.filter(
        (comment) => comment.userDisplayName === 'Current User'
      );

      if (currentUserComments.length > 0) {
        // Filter out "Current User" comments
        const filteredComments = comments.filter(
          (comment) => comment.userDisplayName !== 'Current User'
        );

        // Update post with filtered comments
        await doc.ref.update({
          comments: filteredComments,
          commentsCount: filteredComments.length,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        totalCommentsRemoved += currentUserComments.length;
        postsUpdated++;

        console.log(`  ✅ Updated post ${doc.id}: removed ${currentUserComments.length} "Current User" comments (${comments.length} → ${filteredComments.length})`);
      }
    }

    if (totalCommentsRemoved === 0) {
      console.log('✅ No "Current User" comments found in posts.\n');
    } else {
      console.log(`\n✅ Successfully removed ${totalCommentsRemoved} "Current User" comments from ${postsUpdated} posts.\n`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up posts comments:', error);
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function cleanupAllCurrentUserComments() {
  console.log('\n🧹 Starting cleanup of "Current User" comments...\n');
  console.log('='.repeat(60));

  try {
    // Cleanup moments comments
    await cleanupMomentsComments();

    // Cleanup posts comments
    await cleanupPostsComments();

    console.log('='.repeat(60));
    console.log('\n✅ Cleanup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAllCurrentUserComments()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

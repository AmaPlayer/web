// JavaScript version of the cleanup script
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  getDoc
} = require('firebase/firestore');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Delete comments with "Current User" username from moments comments collection
 */
async function cleanupMomentsComments() {
  console.log('\n🔍 Searching for "Current User" comments in moments...\n');

  try {
    // Query comments with "Current User" as userDisplayName
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('userDisplayName', '==', 'Current User'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('✅ No "Current User" comments found in moments collection.\n');
      return;
    }

    console.log(`📊 Found ${snapshot.size} "Current User" comments in moments collection.\n`);

    // Group comments by momentId to update counts efficiently
    const momentCommentCounts = new Map();
    const commentsToDelete = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const momentId = data.momentId;

      commentsToDelete.push({
        id: docSnap.id,
        momentId,
        userDisplayName: data.userDisplayName
      });

      momentCommentCounts.set(momentId, (momentCommentCounts.get(momentId) || 0) + 1);
    });

    // Delete comments and update moment counts
    let deletedCount = 0;
    for (const comment of commentsToDelete) {
      try {
        // Delete the comment
        await deleteDoc(doc(db, 'comments', comment.id));
        deletedCount++;
        console.log(`  ❌ Deleted comment ${comment.id} from moment ${comment.momentId}`);
      } catch (error) {
        console.error(`  ⚠️  Failed to delete comment ${comment.id}:`, error.message);
      }
    }

    // Update moment comment counts
    console.log('\n📝 Updating moment comment counts...\n');
    for (const [momentId, count] of momentCommentCounts.entries()) {
      try {
        const momentRef = doc(db, 'moments', momentId);
        const momentSnap = await getDoc(momentRef);

        if (momentSnap.exists()) {
          await updateDoc(momentRef, {
            'engagement.commentsCount': increment(-count)
          });
          console.log(`  ✅ Updated moment ${momentId}: decreased count by ${count}`);
        } else {
          console.log(`  ⚠️  Moment ${momentId} not found, skipping count update`);
        }
      } catch (error) {
        console.error(`  ⚠️  Failed to update moment ${momentId}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} "Current User" comments from moments.\n`);
  } catch (error) {
    console.error('❌ Error cleaning up moments comments:', error);
    throw error;
  }
}

/**
 * Remove comments with "Current User" username from posts
 */
async function cleanupPostsComments() {
  console.log('\n🔍 Searching for "Current User" comments in posts...\n');

  try {
    // Get all posts
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);

    if (snapshot.empty) {
      console.log('✅ No posts found.\n');
      return;
    }

    console.log(`📊 Checking ${snapshot.size} posts for "Current User" comments...\n`);

    const postsToUpdate = [];
    let totalCommentsFound = 0;

    // Check each post for "Current User" comments
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const comments = data.comments || [];

      // Filter out "Current User" comments
      const currentUserComments = comments.filter(
        (comment) => comment.userDisplayName === 'Current User'
      );

      if (currentUserComments.length > 0) {
        postsToUpdate.push({
          postId: docSnap.id,
          originalCommentsCount: comments.length,
          currentUserCommentsCount: currentUserComments.length
        });
        totalCommentsFound += currentUserComments.length;
      }
    });

    if (postsToUpdate.length === 0) {
      console.log('✅ No "Current User" comments found in posts.\n');
      return;
    }

    console.log(`📊 Found ${totalCommentsFound} "Current User" comments across ${postsToUpdate.length} posts.\n`);

    // Update posts to remove "Current User" comments
    let updatedCount = 0;
    for (const postUpdate of postsToUpdate) {
      try {
        const postRef = doc(db, 'posts', postUpdate.postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const data = postSnap.data();
          const comments = data.comments || [];

          // Filter out "Current User" comments
          const filteredComments = comments.filter(
            (comment) => comment.userDisplayName !== 'Current User'
          );

          // Update post with filtered comments
          await updateDoc(postRef, {
            comments: filteredComments,
            commentsCount: filteredComments.length
          });

          updatedCount++;
          console.log(`  ✅ Updated post ${postUpdate.postId}: removed ${postUpdate.currentUserCommentsCount} "Current User" comments`);
        }
      } catch (error) {
        console.error(`  ⚠️  Failed to update post ${postUpdate.postId}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully removed "Current User" comments from ${updatedCount} posts.\n`);
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

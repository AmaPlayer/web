// Script to update existing talent videos with verification fields
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Load environment variables
require('dotenv').config();

// Firebase config - using environment variables for security
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function updateTalentVideos() {
  try {
    console.log('🔐 Signing in as admin...');
    
    // Sign in as admin to get proper permissions
    await signInWithEmailAndPassword(auth, 'admin@amaplayer.com', 'Admin@123456');
    console.log('✅ Signed in successfully');
    
    console.log('🎬 Fetching talent videos...');
    const videosSnapshot = await getDocs(collection(db, 'talentVideos'));
    console.log(`📹 Found ${videosSnapshot.size} talent videos`);
    
    if (videosSnapshot.size === 0) {
      console.log('ℹ️ No talent videos found to update');
      return;
    }
    
    let updatedCount = 0;
    
    for (const videoDoc of videosSnapshot.docs) {
      const videoData = videoDoc.data();
      const videoId = videoDoc.id;
      
      console.log(`🔄 Processing video: ${videoId}`);
      console.log(`   User: ${videoData.userDisplayName || 'Unknown'}`);
      console.log(`   File: ${videoData.fileName || 'Unknown'}`);
      
      // Check if video already has verification fields
      if (videoData.hasOwnProperty('isVerified') && videoData.hasOwnProperty('verificationStatus')) {
        console.log(`   ✅ Already has verification fields, skipping`);
        continue;
      }
      
      // Add verification fields
      const updates = {
        isVerified: false,
        verificationStatus: 'pending',
        reviewedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        reviewedBy: null,
        rejectionReason: null,
        adminNotes: null,
        flags: []
      };
      
      try {
        await updateDoc(doc(db, 'talentVideos', videoId), updates);
        console.log(`   ✅ Updated with verification fields`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Error updating video ${videoId}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Update complete!`);
    console.log(`📊 Summary:`);
    console.log(`   Total videos: ${videosSnapshot.size}`);
    console.log(`   Updated videos: ${updatedCount}`);
    console.log(`   Skipped videos: ${videosSnapshot.size - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Error updating talent videos:', error.message);
  }
  
  process.exit(0);
}

updateTalentVideos();
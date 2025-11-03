/**
 * Events Storage Bucket Setup Script
 * Creates and configures a separate storage bucket for events
 */

const admin = require('firebase-admin');
const path = require('path');

// Configuration
const EVENTS_BUCKET_NAME = 'amaplay007-events';
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(__dirname, '../serviceAccountKey.json');

let app;

try {
  const serviceAccount = require(serviceAccountPath);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: EVENTS_BUCKET_NAME
  });
  
  console.log(`✓ Firebase Admin initialized for events storage: ${EVENTS_BUCKET_NAME}`);
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

// Storage folder structure for events
const EVENTS_STORAGE_STRUCTURE = {
  'events/': {
    'banners/': 'Event banner images',
    'thumbnails/': 'Event thumbnail images',
    'videos/': 'Event promotional videos',
    'galleries/': 'Event photo galleries'
  },
  'submissions/': {
    'videos/': 'User submission videos',
    'images/': 'User submission images',
    'documents/': 'User submission documents'
  },
  'tournaments/': {
    'brackets/': 'Tournament bracket images',
    'logos/': 'Tournament logos'
  },
  'streams/': {
    'thumbnails/': 'Live stream thumbnails',
    'recordings/': 'Stream recordings'
  },
  'highlights/': 'Event highlights and clips',
  'certificates/': 'Achievement certificates',
  'temp/': 'Temporary uploads (auto-cleanup)'
};

async function setupStorageBucket() {
  console.log(`\n🗂️ Setting up events storage bucket: ${EVENTS_BUCKET_NAME}`);
  
  try {
    const bucket = admin.storage().bucket();
    
    // Check if bucket exists and is accessible
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log('❌ Storage bucket does not exist. Please create it in Firebase Console first.');
      console.log(`📋 Steps to create bucket:`);
      console.log(`   1. Go to Firebase Console → Storage`);
      console.log(`   2. Click "Add bucket"`);
      console.log(`   3. Enter bucket name: ${EVENTS_BUCKET_NAME}`);
      console.log(`   4. Choose same location as your main bucket`);
      console.log(`   5. Set up security rules`);
      return false;
    }

    console.log('✅ Storage bucket exists and is accessible');

    // Create folder structure by uploading placeholder files
    console.log('📁 Creating folder structure...');
    
    const createFolderPromises = [];
    
    function createFoldersRecursively(structure, basePath = '') {
      Object.entries(structure).forEach(([folder, content]) => {
        const folderPath = basePath + folder;
        
        if (typeof content === 'string') {
          // This is a description, create a placeholder file
          const placeholderPath = `${folderPath}.gitkeep`;
          const file = bucket.file(placeholderPath);
          
          createFolderPromises.push(
            file.save(`# ${content}\n# This folder is for: ${content}`, {
              metadata: {
                contentType: 'text/plain',
                metadata: {
                  purpose: 'folder_placeholder',
                  description: content,
                  createdAt: new Date().toISOString()
                }
              }
            }).then(() => {
              console.log(`  ✓ Created: ${placeholderPath}`);
            }).catch(error => {
              console.error(`  ✗ Failed to create ${placeholderPath}:`, error.message);
            })
          );
        } else {
          // This is a nested structure
          createFoldersRecursively(content, folderPath);
        }
      });
    }
    
    createFoldersRecursively(EVENTS_STORAGE_STRUCTURE);
    
    await Promise.all(createFolderPromises);
    
    console.log('✅ Folder structure created successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup storage bucket:', error);
    return false;
  }
}

async function createSecurityRulesTemplate() {
  console.log('\n🔒 Security Rules Template for Events Storage:');
  
  const securityRules = `
rules_version = '2';
service firebase.storage {
  match /b/${EVENTS_BUCKET_NAME}/o {
    // Event banners and thumbnails - Public read, auth write
    match /events/{eventId}/{filename} {
      allow read: if true;
      allow write: if request.auth != null && 
        (isEventCreator(eventId) || isAdmin());
    }
    
    // User submissions - Auth read/write for own content
    match /submissions/{type}/{eventId}/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        isValidSubmission();
    }
    
    // Tournament media - Public read, admin write
    match /tournaments/{tournamentId}/{filename} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    
    // Live streams - Auth read, streamer write
    match /streams/{streamId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (isStreamOwner(streamId) || isAdmin());
    }
    
    // Highlights - Public read, auth write
    match /highlights/{filename} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Certificates - Auth read for own, admin write
    match /certificates/{userId}/{filename} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && isAdmin();
    }
    
    // Temp uploads - Auth read/write for own content, auto-cleanup
    match /temp/{userId}/{filename} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Helper functions
    function isAdmin() {
      return request.auth.token.admin == true;
    }
    
    function isEventCreator(eventId) {
      // This would need to check against Firestore
      return true; // Implement based on your needs
    }
    
    function isStreamOwner(streamId) {
      // This would need to check against Firestore
      return true; // Implement based on your needs
    }
    
    function isValidSubmission() {
      return request.resource.size < 100 * 1024 * 1024 && // 100MB limit
        request.resource.contentType.matches('image/.*|video/.*|application/pdf');
    }
  }
}`;

  console.log(securityRules);
  console.log('\n📋 To apply these rules:');
  console.log(`   1. Go to Firebase Console → Storage → ${EVENTS_BUCKET_NAME}`);
  console.log('   2. Click "Rules" tab');
  console.log('   3. Copy and paste the above rules');
  console.log('   4. Click "Publish"');
}

async function displayStorageInfo() {
  console.log('\n📊 Events Storage Information:');
  console.log(`Bucket Name: ${EVENTS_BUCKET_NAME}`);
  console.log(`Bucket URL: gs://${EVENTS_BUCKET_NAME}`);
  console.log('\nFolder Structure:');
  
  function displayStructure(structure, indent = '') {
    Object.entries(structure).forEach(([folder, content]) => {
      if (typeof content === 'string') {
        console.log(`${indent}📁 ${folder} - ${content}`);
      } else {
        console.log(`${indent}📁 ${folder}`);
        displayStructure(content, indent + '  ');
      }
    });
  }
  
  displayStructure(EVENTS_STORAGE_STRUCTURE);
  
  console.log('\n🔗 Access your storage:');
  console.log(`Firebase Console: https://console.firebase.google.com/project/[PROJECT_ID]/storage/${EVENTS_BUCKET_NAME}/files`);
}

// Main execution
async function main() {
  try {
    const success = await setupStorageBucket();
    
    if (success) {
      await createSecurityRulesTemplate();
      await displayStorageInfo();
      
      console.log('\n✨ Events storage bucket setup complete!');
      console.log('🚀 Your events now have completely isolated storage');
      console.log('💡 Don\'t forget to set up the security rules in Firebase Console');
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
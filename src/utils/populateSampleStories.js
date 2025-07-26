import { db } from '../firebase/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { sampleStories, sampleHighlights } from '../data/sampleStories';

export const populateSampleStories = async () => {
  try {
    console.log('🔄 Starting to populate sample stories...');
    
    // Test Firebase connection first
    try {
      const testDoc = doc(collection(db, 'test'), 'connection-test');
      await setDoc(testDoc, { timestamp: new Date(), test: true });
      console.log('✅ Firebase connection successful');
      
      // Clean up test doc
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(testDoc);
    } catch (connectionError) {
      console.error('❌ Firebase connection failed:', connectionError);
      throw new Error(`Firebase connection failed: ${connectionError.message}`);
    }
    
    // Convert sample data to Firestore format with better error handling
    const storiesPromises = sampleStories.map(async (story, index) => {
      try {
        console.log(`📝 Processing story ${index + 1}/${sampleStories.length}: ${story.userDisplayName}`);
        
        // Validate story data
        if (!story.id || !story.userId || !story.userDisplayName) {
          throw new Error(`Invalid story data at index ${index}: missing required fields`);
        }
        
        const storyData = {
          userId: story.userId,
          userDisplayName: story.userDisplayName,
          userPhotoURL: story.userPhotoURL || '',
          mediaType: story.mediaType,
          mediaUrl: story.mediaUrl,
          caption: story.caption || '',
          timestamp: Timestamp.fromDate(story.timestamp.toDate()),
          expiresAt: Timestamp.fromDate(story.expiresAt.toDate()),
          viewCount: story.viewCount || 0,
          viewers: story.viewers || [],
          isHighlight: story.isHighlight || false,
          highlightId: story.highlightId || null,
          sharingEnabled: story.sharingEnabled !== false,
          publicLink: `https://my-react-firebase-app-69fcd.web.app/story/${story.id}`
        };
        
        const storyRef = doc(collection(db, 'stories'), story.id);
        await setDoc(storyRef, storyData);
        console.log(`✅ Added story ${index + 1}: ${story.userDisplayName} - ${story.caption.substring(0, 30)}...`);
        return { success: true, storyId: story.id };
      } catch (error) {
        console.error(`❌ Failed to add story ${index + 1}:`, error);
        throw new Error(`Failed to add story "${story.userDisplayName}": ${error.message}`);
      }
    });

    // Wait for all stories to be added
    await Promise.all(storiesPromises);
    
    // Add sample highlights with better error handling
    const highlightsPromises = sampleHighlights.map(async (highlight, index) => {
      try {
        console.log(`📝 Processing highlight ${index + 1}/${sampleHighlights.length}: ${highlight.title}`);
        
        const highlightData = {
          ...highlight,
          createdAt: Timestamp.fromDate(highlight.createdAt.toDate()),
          updatedAt: Timestamp.fromDate(highlight.updatedAt.toDate())
        };
        
        const highlightRef = doc(collection(db, 'highlights'), highlight.id);
        await setDoc(highlightRef, highlightData);
        console.log(`✅ Added highlight ${index + 1}: ${highlight.title}`);
        return { success: true, highlightId: highlight.id };
      } catch (error) {
        console.error(`❌ Failed to add highlight ${index + 1}:`, error);
        throw new Error(`Failed to add highlight "${highlight.title}": ${error.message}`);
      }
    });

    await Promise.all(highlightsPromises);
    
    console.log('🎉 Sample stories and highlights populated successfully!');
    console.log(`📊 Added ${sampleStories.length} stories and ${sampleHighlights.length} highlights`);
    
    return {
      success: true,
      storiesAdded: sampleStories.length,
      highlightsAdded: sampleHighlights.length
    };
    
  } catch (error) {
    console.error('❌ Error populating sample stories:', error);
    throw error;
  }
};

// Function to clear sample data (for testing)
export const clearSampleStories = async () => {
  try {
    console.log('🔄 Clearing sample stories...');
    
    const { deleteDoc } = await import('firebase/firestore');
    
    // Delete sample stories
    const deleteStoriesPromises = sampleStories.map(async (story) => {
      const storyRef = doc(collection(db, 'stories'), story.id);
      await deleteDoc(storyRef);
    });
    
    // Delete sample highlights
    const deleteHighlightsPromises = sampleHighlights.map(async (highlight) => {
      const highlightRef = doc(collection(db, 'highlights'), highlight.id);
      await deleteDoc(highlightRef);
    });
    
    await Promise.all([...deleteStoriesPromises, ...deleteHighlightsPromises]);
    
    console.log('🧹 Sample stories and highlights cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing sample stories:', error);
    throw error;
  }
};

// Check if sample data already exists
export const checkSampleDataExists = async () => {
  try {
    const { getDoc } = await import('firebase/firestore');
    const sampleStoryRef = doc(collection(db, 'stories'), 'story1');
    const docSnap = await getDoc(sampleStoryRef);
    return docSnap.exists();
  } catch (error) {
    console.error('❌ Error checking sample data:', error);
    return false;
  }
};
// Athlete profile service for managing athlete onboarding data
import { COLLECTIONS } from '../../constants/firebase';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Sport, Position, Subcategory, AthleteProfile } from '../../features/athlete-onboarding/store/onboardingStore';
import { retryFirebaseOperation } from '../../utils/network/retryUtils';

/**
 * Athlete profile data for creation
 */
interface CreateAthleteProfileData {
  userId: string;
  sports: Sport[];
  position: Position;
  subcategory: Subcategory;
  specializations: Record<string, string>;
}

/**
 * Athlete profile update data
 */
type UpdateAthleteProfileData = Partial<Omit<AthleteProfile, 'completedOnboarding' | 'onboardingCompletedAt'>>;

/**
 * Athlete profile service providing business logic for athlete profile operations
 * Note: This service doesn't extend BaseService since AthleteProfile is embedded within User documents
 */
class AthleteProfileService {

  /**
   * Create or update athlete profile data within user document
   */
  async createAthleteProfile(data: CreateAthleteProfileData): Promise<AthleteProfile> {
    const { userId, sports, position, subcategory, specializations } = data;
    
    // Validate required data
    if (!sports || sports.length === 0 || !position || !subcategory) {
      throw new Error('Sports, position, and subcategory are required for athlete profile creation');
    }

    const athleteProfile: AthleteProfile = {
      sports,
      position,
      subcategory,
      specializations,
      completedOnboarding: true,
      onboardingCompletedAt: new Date()
    };

    // Use retry mechanism for Firebase operation
    return await retryFirebaseOperation(async () => {
      // Update user document with athlete profile data
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        athleteProfile,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Athlete profile created for user:', userId);
      return athleteProfile;
    }, 'Create athlete profile');
  }

  /**
   * Get athlete profile by user ID
   */
  async getAthleteProfile(userId: string): Promise<AthleteProfile | null> {
    return await retryFirebaseOperation(async () => {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const athleteProfile = userData.athleteProfile as AthleteProfile;
        
        if (athleteProfile) {
          console.log('✅ Athlete profile retrieved for user:', userId);
          return athleteProfile;
        } else {
          console.warn('⚠️ No athlete profile found for user:', userId);
          return null;
        }
      } else {
        console.warn('⚠️ User document not found:', userId);
        return null;
      }
    }, 'Get athlete profile');
  }

  /**
   * Update athlete profile data
   */
  async updateAthleteProfile(userId: string, updateData: UpdateAthleteProfileData): Promise<AthleteProfile> {
    // Get current athlete profile first (this already has retry logic)
    const currentProfile = await this.getAthleteProfile(userId);
    if (!currentProfile) {
      throw new Error('Athlete profile not found for user: ' + userId);
    }

    // Merge update data with current profile
    const updatedProfile: AthleteProfile = {
      ...currentProfile,
      ...updateData,
      // Preserve completion status and timestamp
      completedOnboarding: currentProfile.completedOnboarding,
      onboardingCompletedAt: currentProfile.onboardingCompletedAt
    };

    // Use retry mechanism for the update operation
    return await retryFirebaseOperation(async () => {
      // Update user document
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        athleteProfile: updatedProfile,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Athlete profile updated for user:', userId);
      return updatedProfile;
    }, 'Update athlete profile');
  }

  /**
   * Check if user has completed athlete onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const athleteProfile = await this.getAthleteProfile(userId);
      return athleteProfile?.completedOnboarding || false;
    } catch (error) {
      console.error('❌ Error checking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Validate athlete profile data integrity
   */
  validateAthleteProfile(profile: Partial<AthleteProfile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate sports
    if (!profile.sports || profile.sports.length === 0) {
      errors.push('At least one sport is required');
    } else {
      profile.sports.forEach((sport, index) => {
        if (!sport.id || !sport.name) {
          errors.push(`Sport ${index + 1} must have valid id and name`);
        }
      });
    }

    // Validate position
    if (!profile.position) {
      errors.push('Position is required');
    } else {
      if (!profile.position.id || !profile.position.name) {
        errors.push('Position must have valid id and name');
      }
    }

    // Validate subcategory
    if (!profile.subcategory) {
      errors.push('Subcategory is required');
    } else {
      if (!profile.subcategory.id || !profile.subcategory.name) {
        errors.push('Subcategory must have valid id and name');
      }
    }

    // Validate specializations (optional but should be object if present)
    if (profile.specializations && typeof profile.specializations !== 'object') {
      errors.push('Specializations must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get athlete profiles by sport (for analytics/matching)
   */
  async getAthletesBySport(sportId: string, limit: number = 50): Promise<AthleteProfile[]> {
    try {
      // This would require a compound query on the athleteProfile.sport.id field
      // For now, we'll implement a basic version that gets all users and filters
      // In production, you'd want to create a separate collection or use Firestore's
      // array-contains queries for better performance
      
      console.log(`🔍 Searching for athletes with sport: ${sportId}`);
      
      // This is a simplified implementation - in production you'd want to optimize this
      // by either denormalizing data or using Firestore's advanced querying capabilities
      return [];
    } catch (error) {
      console.error('❌ Error getting athletes by sport:', error);
      throw error;
    }
  }

  /**
   * Delete athlete profile data
   */
  async deleteAthleteProfile(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        athleteProfile: null,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ Athlete profile deleted for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting athlete profile:', error);
      throw error;
    }
  }
}

export default new AthleteProfileService();
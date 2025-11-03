import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe,
  increment
} from 'firebase/firestore';
import { eventsDb } from '@features/events/lib/firebase';
import { RankChange, Badge } from '../types/engagement.types';

// API Error class for typed error responses
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Challenge types
export enum ChallengeType {
  SKILL_SHOWCASE = 'skill_showcase',
  ENDURANCE = 'endurance',
  CREATIVITY = 'creativity',
  TEAM_COLLABORATION = 'team_collaboration',
  KNOWLEDGE_QUIZ = 'knowledge_quiz',
  PHOTO_CONTEST = 'photo_contest'
}

// Challenge status
export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

// Reward types
export enum RewardType {
  POINTS = 'points',
  BADGE = 'badge',
  TITLE = 'title',
  FEATURE = 'feature'
}

// Reward interface
export interface Reward {
  type: RewardType;
  value: number;
  description: string;
  iconUrl?: string;
}

// Challenge submission interface
export interface ChallengeSubmission {
  id?: string;
  challengeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl?: string;
  submittedAt: Timestamp;
  votes: number;
  voterIds: string[];
  rank?: number;
  score?: number;
}

// Challenge interface
export interface Challenge {
  id?: string;
  eventId: string;
  title: string;
  description: string;
  type: ChallengeType;
  sport: string;
  startDate: Timestamp;
  endDate: Timestamp;
  maxParticipants?: number;
  rewards: Reward[];
  participants: string[];
  submissions: ChallengeSubmission[];
  status: ChallengeStatus;
  createdAt: Timestamp;
}

// Challenge result interface for completion tracking
export interface ChallengeResult {
  challengeId: string;
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  totalParticipants: number;
  completedAt: Date;
}

// Leaderboard entry for challenges
export interface ChallengeLeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  previousRank?: number;
  change: RankChange;
  badges: Badge[];
  level: number;
}

/**
 * Helper to convert Firestore document to Challenge
 */
function firestoreToChallenge(doc: DocumentSnapshot): Challenge {
  const data = doc.data();
  if (!data) {
    throw new APIError(404, 'Challenge not found');
  }

  return {
    ...data,
    id: doc.id,
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: data.createdAt,
  } as Challenge;
}

/**
 * Helper to convert Firestore document to ChallengeSubmission
 */
function firestoreToSubmission(doc: DocumentSnapshot): ChallengeSubmission {
  const data = doc.data();
  if (!data) {
    throw new APIError(404, 'Submission not found');
  }

  return {
    ...data,
    id: doc.id,
    submittedAt: data.submittedAt,
  } as ChallengeSubmission;
}

class ChallengeSystem {
  private readonly CHALLENGES_COLLECTION = 'challenges';
  private readonly SUBMISSIONS_COLLECTION = 'challengeSubmissions';
  
  private sportChallengeTemplates: Record<string, ChallengeType[]> = {
    'Basketball': [ChallengeType.SKILL_SHOWCASE, ChallengeType.CREATIVITY, ChallengeType.PHOTO_CONTEST],
    'Soccer': [ChallengeType.SKILL_SHOWCASE, ChallengeType.ENDURANCE, ChallengeType.TEAM_COLLABORATION],
    'Tennis': [ChallengeType.SKILL_SHOWCASE, ChallengeType.ENDURANCE, ChallengeType.KNOWLEDGE_QUIZ],
    'Volleyball': [ChallengeType.TEAM_COLLABORATION, ChallengeType.SKILL_SHOWCASE, ChallengeType.CREATIVITY],
    'Athletics': [ChallengeType.ENDURANCE, ChallengeType.PHOTO_CONTEST, ChallengeType.SKILL_SHOWCASE],
    'Swimming': [ChallengeType.ENDURANCE, ChallengeType.SKILL_SHOWCASE, ChallengeType.PHOTO_CONTEST],
    'Baseball': [ChallengeType.SKILL_SHOWCASE, ChallengeType.TEAM_COLLABORATION, ChallengeType.KNOWLEDGE_QUIZ],
    'Football': [ChallengeType.SKILL_SHOWCASE, ChallengeType.TEAM_COLLABORATION, ChallengeType.ENDURANCE]
  };

  /**
   * Generate challenge title and description based on type and sport
   */
  private generateChallengeContent(type: ChallengeType, sport: string): { title: string; description: string } {
    const templates = {
      [ChallengeType.SKILL_SHOWCASE]: {
        title: `${sport} Skills Showcase`,
        description: `Show off your best ${sport.toLowerCase()} skills! Upload a video demonstrating your technique and creativity.`
      },
      [ChallengeType.ENDURANCE]: {
        title: `${sport} Endurance Challenge`,
        description: `Test your stamina and endurance in this ${sport.toLowerCase()} challenge. Push your limits!`
      },
      [ChallengeType.CREATIVITY]: {
        title: `Creative ${sport} Challenge`,
        description: `Get creative with ${sport.toLowerCase()}! Show us something unique and innovative.`
      },
      [ChallengeType.TEAM_COLLABORATION]: {
        title: `${sport} Team Challenge`,
        description: `Work together with your team to complete this ${sport.toLowerCase()} collaboration challenge.`
      },
      [ChallengeType.KNOWLEDGE_QUIZ]: {
        title: `${sport} Knowledge Quiz`,
        description: `Test your knowledge about ${sport.toLowerCase()} rules, history, and techniques.`
      },
      [ChallengeType.PHOTO_CONTEST]: {
        title: `${sport} Photo Contest`,
        description: `Capture the perfect ${sport.toLowerCase()} moment! Submit your best action shots or creative photos.`
      }
    };

    return templates[type] || { title: `${sport} Challenge`, description: `Participate in this ${sport.toLowerCase()} challenge!` };
  }

  /**
   * Generate rewards based on challenge type
   */
  private generateRewards(type: ChallengeType): Reward[] {
    const baseRewards: Reward[] = [
      {
        type: RewardType.POINTS,
        value: 50,
        description: 'Challenge completion points'
      }
    ];

    // Add type-specific rewards
    switch (type) {
      case ChallengeType.SKILL_SHOWCASE:
        baseRewards.push({
          type: RewardType.BADGE,
          value: 1,
          description: 'Skill Master badge',
          iconUrl: '/icons/badges/skill-master.svg'
        });
        break;
      case ChallengeType.ENDURANCE:
        baseRewards.push({
          type: RewardType.BADGE,
          value: 1,
          description: 'Endurance Champion badge',
          iconUrl: '/icons/badges/endurance-champion.svg'
        });
        break;
      case ChallengeType.CREATIVITY:
        baseRewards.push({
          type: RewardType.BADGE,
          value: 1,
          description: 'Creative Genius badge',
          iconUrl: '/icons/badges/creative-genius.svg'
        });
        break;
      case ChallengeType.TEAM_COLLABORATION:
        baseRewards.push({
          type: RewardType.BADGE,
          value: 1,
          description: 'Team Player badge',
          iconUrl: '/icons/badges/team-player.svg'
        });
        break;
      case ChallengeType.KNOWLEDGE_QUIZ:
        baseRewards.push({
          type: RewardType.TITLE,
          value: 1,
          description: 'Sport Scholar title'
        });
        break;
      case ChallengeType.PHOTO_CONTEST:
        baseRewards.push({
          type: RewardType.FEATURE,
          value: 1,
          description: 'Featured photo on event page'
        });
        break;
    }

    return baseRewards;
  }

  /**
   * Generate challenges based on sport types
   * Requirements: 3.1 - Challenge generation logic based on sport types
   */
  async generateChallenges(eventId: string, sport: string): Promise<Challenge[]> {
    try {
      const challengeTypes = this.sportChallengeTemplates[sport] || [
        ChallengeType.SKILL_SHOWCASE,
        ChallengeType.CREATIVITY,
        ChallengeType.PHOTO_CONTEST
      ];

      const challenges: Challenge[] = [];
      const now = new Date();
      const eventStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
      
      for (let index = 0; index < challengeTypes.length; index++) {
        const type = challengeTypes[index];
        const content = this.generateChallengeContent(type, sport);
        const startDate = new Date(eventStart.getTime() + index * 2 * 24 * 60 * 60 * 1000); // Stagger starts
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days duration

        const challengeData = {
          eventId,
          title: content.title,
          description: content.description,
          type,
          sport,
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          maxParticipants: type === ChallengeType.TEAM_COLLABORATION ? 50 : 100,
          rewards: this.generateRewards(type),
          participants: [],
          submissions: [],
          status: ChallengeStatus.UPCOMING,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(eventsDb, this.CHALLENGES_COLLECTION), challengeData);
        const newChallenge = await this.getChallengeById(docRef.id);
        challenges.push(newChallenge);
      }

      return challenges;
    } catch (error) {
      console.error('Failed to generate challenges:', error);
      throw new APIError(500, 'Failed to generate challenges', error);
    }
  }

  /**
   * Handle challenge participation and submission
   * Requirements: 3.2 - Challenge participation and submission handling
   */
  async submitChallengeEntry(
    challengeId: string, 
    userId: string, 
    userName: string,
    userAvatar: string | undefined,
    entry: {
      content: string;
      mediaUrl?: string;
    }
  ): Promise<void> {
    try {
      const challenge = await this.getChallengeById(challengeId);

      // Check if challenge is active
      const now = new Date();
      const startDate = challenge.startDate.toDate();
      const endDate = challenge.endDate.toDate();
      
      if (challenge.status !== ChallengeStatus.ACTIVE && 
          (now < startDate || now > endDate)) {
        throw new APIError(400, 'Challenge is not currently active');
      }

      // Check if user already participated
      if (challenge.participants.includes(userId)) {
        throw new APIError(400, 'User already participated in this challenge');
      }

      // Check max participants
      if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
        throw new APIError(400, 'Challenge has reached maximum participants');
      }

      // Create submission
      const submissionData = {
        challengeId,
        userId,
        userName,
        userAvatar,
        content: entry.content,
        mediaUrl: entry.mediaUrl,
        submittedAt: serverTimestamp(),
        votes: 0,
        voterIds: []
      };

      await addDoc(collection(eventsDb, this.SUBMISSIONS_COLLECTION), submissionData);

      // Update challenge
      const challengeRef = doc(eventsDb, this.CHALLENGES_COLLECTION, challengeId);
      await updateDoc(challengeRef, {
        participants: [...challenge.participants, userId],
        status: ChallengeStatus.ACTIVE
      });

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to submit challenge entry:', error);
      throw new APIError(500, 'Failed to submit challenge entry', error);
    }
  }

  /**
   * Get challenge leaderboard with real-time updates
   * Requirements: 3.3 - Challenge leaderboard with real-time updates
   */
  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboardEntry[]> {
    try {
      const challenge = await this.getChallengeById(challengeId);
      const submissions = await this.getChallengeSubmissions(challengeId);

      // Calculate scores for each submission
      const scoredSubmissions = submissions.map(submission => {
        // Score calculation based on votes and submission quality
        let score = submission.votes * 10; // Base score from votes
        
        // Bonus points for early submission
        const submissionTime = submission.submittedAt.toDate().getTime();
        const challengeStart = challenge.startDate.toDate().getTime();
        const challengeDuration = challenge.endDate.toDate().getTime() - challengeStart;
        const submissionDelay = submissionTime - challengeStart;
        const earlyBonus = Math.max(0, 20 - (submissionDelay / challengeDuration) * 20);
        score += earlyBonus;

        // Content quality bonus
        if (submission.content && submission.content.length > 50) {
          score += 5;
        }
        if (submission.mediaUrl) {
          score += 10;
        }

        return {
          ...submission,
          calculatedScore: Math.round(score)
        };
      });

      // Sort by score and create leaderboard entries
      const sortedSubmissions = scoredSubmissions.sort((a, b) => b.calculatedScore - a.calculatedScore);

      const leaderboardEntries: ChallengeLeaderboardEntry[] = sortedSubmissions.map((submission, index) => ({
        userId: submission.userId,
        userName: submission.userName,
        userAvatar: submission.userAvatar,
        score: submission.calculatedScore,
        rank: index + 1,
        previousRank: undefined,
        change: RankChange.NEW,
        badges: [],
        level: 1
      }));

      return leaderboardEntries;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to get challenge leaderboard:', error);
      throw new APIError(500, 'Failed to get challenge leaderboard', error);
    }
  }

  /**
   * End challenge and determine winners
   * Requirements: 3.4 - Challenge completion tracking and scoring
   */
  async endChallenge(challengeId: string): Promise<ChallengeResult[]> {
    try {
      const challenge = await this.getChallengeById(challengeId);

      if (challenge.status === ChallengeStatus.COMPLETED) {
        throw new APIError(400, 'Challenge already completed');
      }

      // Get final leaderboard
      const leaderboard = await this.getChallengeLeaderboard(challengeId);

      if (leaderboard.length === 0) {
        throw new APIError(400, 'No participants to determine winners');
      }

      // Determine winners (top 3)
      const winners = leaderboard.slice(0, 3);
      const results: ChallengeResult[] = winners.map((winner) => ({
        challengeId,
        winnerId: winner.userId,
        winnerName: winner.userName,
        winnerScore: winner.score,
        totalParticipants: challenge.participants.length,
        completedAt: new Date()
      }));

      // Update challenge status
      const challengeRef = doc(eventsDb, this.CHALLENGES_COLLECTION, challengeId);
      await updateDoc(challengeRef, {
        status: ChallengeStatus.COMPLETED
      });

      // Update submission ranks
      const submissions = await this.getChallengeSubmissions(challengeId);
      for (const submission of submissions) {
        const leaderboardEntry = leaderboard.find(entry => entry.userId === submission.userId);
        
        if (leaderboardEntry && submission.id) {
          const submissionRef = doc(eventsDb, this.SUBMISSIONS_COLLECTION, submission.id);
          await updateDoc(submissionRef, {
            rank: leaderboardEntry.rank,
            score: leaderboardEntry.score
          });
        }
      }

      return results;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to end challenge:', error);
      throw new APIError(500, 'Failed to end challenge', error);
    }
  }

  /**
   * Get all challenges for an event
   */
  async getEventChallenges(eventId: string): Promise<Challenge[]> {
    try {
      const q = query(
        collection(eventsDb, this.CHALLENGES_COLLECTION),
        where('eventId', '==', eventId),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToChallenge(doc));
    } catch (error) {
      console.error('Failed to get event challenges:', error);
      throw new APIError(500, 'Failed to get event challenges', error);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<Challenge> {
    try {
      const docRef = doc(eventsDb, this.CHALLENGES_COLLECTION, challengeId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new APIError(404, 'Challenge not found');
      }

      return firestoreToChallenge(docSnap);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to get challenge:', error);
      throw new APIError(500, 'Failed to get challenge', error);
    }
  }

  /**
   * Get challenge submissions
   */
  async getChallengeSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(eventsDb, this.SUBMISSIONS_COLLECTION),
        where('challengeId', '==', challengeId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => firestoreToSubmission(doc));
    } catch (error) {
      console.error('Failed to get challenge submissions:', error);
      throw new APIError(500, 'Failed to get challenge submissions', error);
    }
  }

  /**
   * Vote on a challenge submission
   */
  async voteOnSubmission(submissionId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(eventsDb, this.SUBMISSIONS_COLLECTION, submissionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new APIError(404, 'Submission not found');
      }

      const submission = firestoreToSubmission(docSnap);

      // Check if user already voted
      if (submission.voterIds.includes(userId)) {
        throw new APIError(400, 'User already voted on this submission');
      }

      // Add vote
      await updateDoc(docRef, {
        votes: increment(1),
        voterIds: [...submission.voterIds, userId]
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to vote on submission:', error);
      throw new APIError(500, 'Failed to vote on submission', error);
    }
  }

  /**
   * Participate in a challenge (without submission)
   */
  async participateInChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      const challenge = await this.getChallengeById(challengeId);

      // Check if user already participated
      if (challenge.participants.includes(userId)) {
        throw new APIError(400, 'User already participating in this challenge');
      }

      // Check max participants
      if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
        throw new APIError(400, 'Challenge has reached maximum participants');
      }

      // Add user to participants
      const challengeRef = doc(eventsDb, this.CHALLENGES_COLLECTION, challengeId);
      await updateDoc(challengeRef, {
        participants: [...challenge.participants, userId],
        status: ChallengeStatus.ACTIVE
      });

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Failed to participate in challenge:', error);
      throw new APIError(500, 'Failed to participate in challenge', error);
    }
  }

  /**
   * Get featured challenges for display on main page
   */
  async getFeaturedChallenges(limit: number = 5): Promise<Challenge[]> {
    try {
      const q = query(
        collection(eventsDb, this.CHALLENGES_COLLECTION),
        where('status', 'in', [ChallengeStatus.ACTIVE, ChallengeStatus.UPCOMING]),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      const challenges = snapshot.docs.map(doc => firestoreToChallenge(doc));
      
      // Sort by priority (active first, then by participant count)
      const sortedChallenges = challenges.sort((a, b) => {
        if (a.status === ChallengeStatus.ACTIVE && b.status !== ChallengeStatus.ACTIVE) return -1;
        if (b.status === ChallengeStatus.ACTIVE && a.status !== ChallengeStatus.ACTIVE) return 1;
        return b.participants.length - a.participants.length;
      });

      return sortedChallenges.slice(0, limit);
    } catch (error) {
      console.error('Failed to get featured challenges:', error);
      throw new APIError(500, 'Failed to get featured challenges', error);
    }
  }

  /**
   * Subscribe to real-time challenge updates
   */
  subscribeToChallenges(
    eventId: string,
    callback: (challenges: Challenge[]) => void
  ): Unsubscribe {
    const q = query(
      collection(eventsDb, this.CHALLENGES_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('startDate', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const challenges = snapshot.docs.map(doc => firestoreToChallenge(doc));
        callback(challenges);
      },
      (error) => {
        console.error('Error in challenges subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to real-time challenge submissions
   */
  subscribeToSubmissions(
    challengeId: string,
    callback: (submissions: ChallengeSubmission[]) => void
  ): Unsubscribe {
    const q = query(
      collection(eventsDb, this.SUBMISSIONS_COLLECTION),
      where('challengeId', '==', challengeId),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const submissions = snapshot.docs.map(doc => firestoreToSubmission(doc));
        callback(submissions);
      },
      (error) => {
        console.error('Error in submissions subscription:', error);
      }
    );

    return unsubscribe;
  }
}

// Export singleton instance
export const challengeSystem = new ChallengeSystem();
export default challengeSystem;

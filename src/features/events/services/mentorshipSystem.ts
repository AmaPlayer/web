import { Timestamp } from 'firebase/firestore';
import { 
  MentorProfile, 
  MentorshipConnection, 
  MentorshipRequest, 
  MentorshipStatus, 
  MentorshipProgress,
  MentorshipOpportunity 
} from '@features/events/types/social.types';
import { SkillLevel } from '@features/events/types/user.types';

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

// Mentorship matching criteria interface
export interface MentorshipMatchCriteria {
  sport: string;
  skillLevel: SkillLevel;
  location?: string;
  timezone?: string;
  languages?: string[];
  specialties?: string[];
}

// Mentorship communication interface
export interface MentorshipCommunication {
  id: string;
  connectionId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

// LocalStorage keys
const MENTOR_PROFILES_STORAGE_KEY = 'mentor_profiles_data';
const MENTORSHIP_CONNECTIONS_STORAGE_KEY = 'mentorship_connections_data';
const MENTORSHIP_REQUESTS_STORAGE_KEY = 'mentorship_requests_data';
const MENTORSHIP_COMMUNICATIONS_STORAGE_KEY = 'mentorship_communications_data';
const MENTORSHIP_COUNTER_KEY = 'mentorship_counter';

class MentorshipSystem {
  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize localStorage with default data
   */
  private initializeStorage(): void {
    if (!localStorage.getItem(MENTOR_PROFILES_STORAGE_KEY)) {
      localStorage.setItem(MENTOR_PROFILES_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(MENTORSHIP_CONNECTIONS_STORAGE_KEY)) {
      localStorage.setItem(MENTORSHIP_CONNECTIONS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(MENTORSHIP_REQUESTS_STORAGE_KEY)) {
      localStorage.setItem(MENTORSHIP_REQUESTS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(MENTORSHIP_COMMUNICATIONS_STORAGE_KEY)) {
      localStorage.setItem(MENTORSHIP_COMMUNICATIONS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(MENTORSHIP_COUNTER_KEY)) {
      localStorage.setItem(MENTORSHIP_COUNTER_KEY, '1');
    }
  }

  /**
   * Generate next ID
   */
  private getNextId(): string {
    const counter = parseInt(localStorage.getItem(MENTORSHIP_COUNTER_KEY) || '1');
    localStorage.setItem(MENTORSHIP_COUNTER_KEY, (counter + 1).toString());
    return `mentorship_${counter}`;
  }

  /**
   * Get stored mentor profiles
   */
  private getStoredMentorProfiles(): MentorProfile[] {
    const data = localStorage.getItem(MENTOR_PROFILES_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  }

  /**
   * Save mentor profiles to storage
   */
  private saveMentorProfiles(profiles: MentorProfile[]): void {
    localStorage.setItem(MENTOR_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }

  /**
   * Get stored mentorship connections
   */
  private getStoredConnections(): MentorshipConnection[] {
    const data = localStorage.getItem(MENTORSHIP_CONNECTIONS_STORAGE_KEY);
    if (!data) return [];

    const connections = JSON.parse(data);
    return connections.map((connection: any) => ({
      ...connection,
      startDate: new Date(connection.startDate),
      endDate: connection.endDate ? new Date(connection.endDate) : undefined,
      progress: connection.progress.map((p: any) => ({
        ...p,
        date: new Date(p.date)
      }))
    }));
  }

  /**
   * Save mentorship connections to storage
   */
  private saveConnections(connections: MentorshipConnection[]): void {
    localStorage.setItem(MENTORSHIP_CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
  }

  /**
   * Get stored mentorship requests
   */
  private getStoredRequests(): MentorshipRequest[] {
    const data = localStorage.getItem(MENTORSHIP_REQUESTS_STORAGE_KEY);
    if (!data) return [];

    const requests = JSON.parse(data);
    return requests.map((request: any) => ({
      ...request,
      requestedAt: new Date(request.requestedAt)
    }));
  }

  /**
   * Save mentorship requests to storage
   */
  private saveRequests(requests: MentorshipRequest[]): void {
    localStorage.setItem(MENTORSHIP_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  }

  /**
   * Get stored communications
   */
  private getStoredCommunications(): MentorshipCommunication[] {
    const data = localStorage.getItem(MENTORSHIP_COMMUNICATIONS_STORAGE_KEY);
    if (!data) return [];

    const communications = JSON.parse(data);
    return communications.map((comm: any) => ({
      ...comm,
      timestamp: new Date(comm.timestamp)
    }));
  }

  /**
   * Save communications to storage
   */
  private saveCommunications(communications: MentorshipCommunication[]): void {
    localStorage.setItem(MENTORSHIP_COMMUNICATIONS_STORAGE_KEY, JSON.stringify(communications));
  }

  /**
   * Find mentors based on matching criteria
   * Requirements: 6.1 - Mentor-mentee matching algorithm
   */
  async findMentors(userId: string, criteria: MentorshipMatchCriteria): Promise<MentorProfile[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const mentorProfiles = this.getStoredMentorProfiles();
      const connections = this.getStoredConnections();

      // Filter out mentors who are already connected to this user
      const existingMentorIds = connections
        .filter(conn => conn.menteeId === userId && 
                       (conn.status === MentorshipStatus.ACTIVE || conn.status === MentorshipStatus.ACCEPTED))
        .map(conn => conn.mentorId);

      let availableMentors = mentorProfiles.filter(mentor => 
        mentor.isAvailable && 
        mentor.userId !== userId &&
        !existingMentorIds.includes(mentor.userId) &&
        mentor.menteeCount < mentor.maxMentees
      );

      // Apply matching criteria
      if (criteria.sport) {
        availableMentors = availableMentors.filter(mentor => 
          mentor.sports.includes(criteria.sport)
        );
      }

      if (criteria.specialties && criteria.specialties.length > 0) {
        availableMentors = availableMentors.filter(mentor =>
          criteria.specialties!.some(specialty => mentor.specialties.includes(specialty))
        );
      }

      if (criteria.languages && criteria.languages.length > 0) {
        availableMentors = availableMentors.filter(mentor =>
          criteria.languages!.some(language => mentor.languages.includes(language))
        );
      }

      if (criteria.timezone) {
        availableMentors = availableMentors.filter(mentor =>
          mentor.timezone === criteria.timezone
        );
      }

      // Sort by rating and availability
      availableMentors.sort((a, b) => {
        // First by rating (higher is better)
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Then by availability (fewer mentees is better)
        const aAvailability = (a.maxMentees - a.menteeCount) / a.maxMentees;
        const bAvailability = (b.maxMentees - b.menteeCount) / b.maxMentees;
        return bAvailability - aAvailability;
      });

      // Return top 10 matches
      return availableMentors.slice(0, 10);

    } catch (error) {
      throw new APIError(500, 'Failed to find mentors', error);
    }
  }

  /**
   * Request mentorship from a mentor
   * Requirements: 6.2 - Mentorship request and acceptance workflow
   */
  async requestMentorship(
    menteeId: string, 
    mentorId: string, 
    sport: string, 
    message: string, 
    goals: string[]
  ): Promise<MentorshipRequest> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const mentorProfiles = this.getStoredMentorProfiles();
      const requests = this.getStoredRequests();
      const connections = this.getStoredConnections();

      // Validate mentor exists and is available
      const mentor = mentorProfiles.find(m => m.userId === mentorId);
      if (!mentor) {
        throw new APIError(404, 'Mentor not found');
      }

      if (!mentor.isAvailable || mentor.menteeCount >= mentor.maxMentees) {
        throw new APIError(400, 'Mentor is not available for new mentees');
      }

      // Check if there's already a pending request
      const existingRequest = requests.find(req => 
        req.menteeId === menteeId && 
        req.mentorId === mentorId && 
        req.status === 'pending'
      );

      if (existingRequest) {
        throw new APIError(400, 'Mentorship request already pending');
      }

      // Check if there's already an active connection
      const existingConnection = connections.find(conn => 
        conn.menteeId === menteeId && 
        conn.mentorId === mentorId && 
        (conn.status === MentorshipStatus.ACTIVE || conn.status === MentorshipStatus.ACCEPTED)
      );

      if (existingConnection) {
        throw new APIError(400, 'Mentorship connection already exists');
      }

      // Validate sport is supported by mentor
      if (!mentor.sports.includes(sport)) {
        throw new APIError(400, 'Mentor does not support this sport');
      }

      // Create mentorship request
      const request: MentorshipRequest = {
        id: this.getNextId(),
        menteeId,
        mentorId,
        sport,
        message: message.trim(),
        goals: goals.filter(goal => goal.trim().length > 0),
        requestedAt: Timestamp.now(),
        status: 'pending'
      };

      requests.push(request);
      this.saveRequests(requests);

      return request;

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to request mentorship', error);
    }
  }

  /**
   * Accept a mentorship request
   * Requirements: 6.2 - Mentorship request and acceptance workflow
   */
  async acceptMentorshipRequest(requestId: string, mentorId: string): Promise<MentorshipConnection> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const requests = this.getStoredRequests();
      const connections = this.getStoredConnections();
      const mentorProfiles = this.getStoredMentorProfiles();

      const requestIndex = requests.findIndex(req => req.id === requestId);
      if (requestIndex === -1) {
        throw new APIError(404, 'Mentorship request not found');
      }

      const request = requests[requestIndex];

      if (request.mentorId !== mentorId) {
        throw new APIError(403, 'Not authorized to accept this request');
      }

      if (request.status !== 'pending') {
        throw new APIError(400, 'Request is no longer pending');
      }

      // Check mentor availability
      const mentor = mentorProfiles.find(m => m.userId === mentorId);
      if (!mentor || mentor.menteeCount >= mentor.maxMentees) {
        throw new APIError(400, 'Mentor is no longer available');
      }

      // Create mentorship connection
      const connection: MentorshipConnection = {
        id: this.getNextId(),
        mentorId: request.mentorId,
        menteeId: request.menteeId,
        sport: request.sport,
        status: MentorshipStatus.ACCEPTED,
        startDate: Timestamp.now(),
        goals: request.goals,
        progress: [],
        communicationChannel: `mentorship_chat_${this.getNextId()}`
      };

      connections.push(connection);
      this.saveConnections(connections);

      // Update request status
      request.status = 'accepted';
      requests[requestIndex] = request;
      this.saveRequests(requests);

      // Update mentor's mentee count
      const mentorIndex = mentorProfiles.findIndex(m => m.userId === mentorId);
      if (mentorIndex !== -1) {
        mentorProfiles[mentorIndex].menteeCount += 1;
        this.saveMentorProfiles(mentorProfiles);
      }

      return connection;

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to accept mentorship request', error);
    }
  }

  /**
   * Decline a mentorship request
   * Requirements: 6.2 - Mentorship request and acceptance workflow
   */
  async declineMentorshipRequest(requestId: string, mentorId: string, reason?: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const requests = this.getStoredRequests();
      const requestIndex = requests.findIndex(req => req.id === requestId);

      if (requestIndex === -1) {
        throw new APIError(404, 'Mentorship request not found');
      }

      const request = requests[requestIndex];

      if (request.mentorId !== mentorId) {
        throw new APIError(403, 'Not authorized to decline this request');
      }

      if (request.status !== 'pending') {
        throw new APIError(400, 'Request is no longer pending');
      }

      // Update request status
      request.status = 'declined';
      requests[requestIndex] = request;
      this.saveRequests(requests);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to decline mentorship request', error);
    }
  }

  /**
   * Start active mentorship (after acceptance)
   * Requirements: 6.3 - Mentorship communication and tracking tools
   */
  async startMentorship(connectionId: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const connections = this.getStoredConnections();
      const connectionIndex = connections.findIndex(conn => conn.id === connectionId);

      if (connectionIndex === -1) {
        throw new APIError(404, 'Mentorship connection not found');
      }

      const connection = connections[connectionIndex];

      if (connection.status !== MentorshipStatus.ACCEPTED) {
        throw new APIError(400, 'Mentorship must be accepted before starting');
      }

      connection.status = MentorshipStatus.ACTIVE;
      connections[connectionIndex] = connection;
      this.saveConnections(connections);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to start mentorship', error);
    }
  }

  /**
   * Add progress milestone to mentorship
   * Requirements: 6.3 - Mentorship communication and tracking tools
   */
  async addMentorshipProgress(
    connectionId: string, 
    milestone: string, 
    description: string, 
    completedBy: 'mentor' | 'mentee'
  ): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const connections = this.getStoredConnections();
      const connectionIndex = connections.findIndex(conn => conn.id === connectionId);

      if (connectionIndex === -1) {
        throw new APIError(404, 'Mentorship connection not found');
      }

      const connection = connections[connectionIndex];

      if (connection.status !== MentorshipStatus.ACTIVE) {
        throw new APIError(400, 'Mentorship must be active to add progress');
      }

      const progress: MentorshipProgress = {
        id: this.getNextId(),
        date: Timestamp.now(),
        milestone: milestone.trim(),
        description: description.trim(),
        completedBy
      };

      connection.progress.push(progress);
      connections[connectionIndex] = connection;
      this.saveConnections(connections);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to add mentorship progress', error);
    }
  }

  /**
   * Complete mentorship with rating and review
   * Requirements: 6.4 - Mentorship success tracking
   */
  async completeMentorship(
    connectionId: string, 
    rating: number, 
    review: string, 
    completedBy: 'mentor' | 'mentee'
  ): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const connections = this.getStoredConnections();
      const mentorProfiles = this.getStoredMentorProfiles();

      const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
      if (connectionIndex === -1) {
        throw new APIError(404, 'Mentorship connection not found');
      }

      const connection = connections[connectionIndex];

      if (connection.status !== MentorshipStatus.ACTIVE) {
        throw new APIError(400, 'Only active mentorships can be completed');
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new APIError(400, 'Rating must be between 1 and 5');
      }

      // Update connection
      connection.status = MentorshipStatus.COMPLETED;
      connection.endDate = Timestamp.now();
      connection.rating = rating;
      connection.review = review.trim();

      connections[connectionIndex] = connection;
      this.saveConnections(connections);

      // Update mentor's rating and stats
      const mentorIndex = mentorProfiles.findIndex(m => m.userId === connection.mentorId);
      if (mentorIndex !== -1) {
        const mentor = mentorProfiles[mentorIndex];
        
        // Calculate new average rating
        const totalRating = (mentor.rating * mentor.reviewCount) + rating;
        mentor.reviewCount += 1;
        mentor.rating = totalRating / mentor.reviewCount;
        
        // Decrease mentee count
        mentor.menteeCount = Math.max(0, mentor.menteeCount - 1);

        mentorProfiles[mentorIndex] = mentor;
        this.saveMentorProfiles(mentorProfiles);
      }

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to complete mentorship', error);
    }
  }

  /**
   * Cancel mentorship
   */
  async cancelMentorship(connectionId: string, reason?: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const connections = this.getStoredConnections();
      const mentorProfiles = this.getStoredMentorProfiles();

      const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
      if (connectionIndex === -1) {
        throw new APIError(404, 'Mentorship connection not found');
      }

      const connection = connections[connectionIndex];

      if (connection.status === MentorshipStatus.COMPLETED || 
          connection.status === MentorshipStatus.CANCELLED) {
        throw new APIError(400, 'Mentorship is already completed or cancelled');
      }

      // Store original status before changing
      const wasActive = connection.status === MentorshipStatus.ACTIVE || 
                        connection.status === MentorshipStatus.ACCEPTED;

      connection.status = MentorshipStatus.CANCELLED;
      connection.endDate = Timestamp.now();

      connections[connectionIndex] = connection;
      this.saveConnections(connections);

      // Update mentor's mentee count if connection was active
      if (wasActive) {
        const mentorIndex = mentorProfiles.findIndex(m => m.userId === connection.mentorId);
        if (mentorIndex !== -1) {
          mentorProfiles[mentorIndex].menteeCount = Math.max(0, mentorProfiles[mentorIndex].menteeCount - 1);
          this.saveMentorProfiles(mentorProfiles);
        }
      }

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to cancel mentorship', error);
    }
  }

  /**
   * Send message in mentorship communication channel
   * Requirements: 6.3 - Mentorship communication and tracking tools
   */
  async sendMentorshipMessage(
    connectionId: string, 
    fromUserId: string, 
    message: string, 
    attachments?: string[]
  ): Promise<MentorshipCommunication> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const connections = this.getStoredConnections();
      const communications = this.getStoredCommunications();

      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) {
        throw new APIError(404, 'Mentorship connection not found');
      }

      if (connection.status !== MentorshipStatus.ACTIVE) {
        throw new APIError(400, 'Can only send messages in active mentorships');
      }

      // Validate sender is part of the mentorship
      if (fromUserId !== connection.mentorId && fromUserId !== connection.menteeId) {
        throw new APIError(403, 'Not authorized to send messages in this mentorship');
      }

      const toUserId = fromUserId === connection.mentorId ? connection.menteeId : connection.mentorId;

      const communication: MentorshipCommunication = {
        id: this.getNextId(),
        connectionId,
        fromUserId,
        toUserId,
        message: message.trim(),
        timestamp: new Date(),
        isRead: false,
        attachments: attachments || []
      };

      communications.push(communication);
      this.saveCommunications(communications);

      return communication;

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to send mentorship message', error);
    }
  }

  /**
   * Get mentorship connections for a user
   * Requirements: 6.5 - Display mentorship connections
   */
  async getUserMentorships(userId: string): Promise<MentorshipConnection[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const connections = this.getStoredConnections();
      return connections.filter(conn => 
        conn.mentorId === userId || conn.menteeId === userId
      );

    } catch (error) {
      throw new APIError(500, 'Failed to get user mentorships', error);
    }
  }

  /**
   * Get pending mentorship requests for a user
   */
  async getUserMentorshipRequests(userId: string, type: 'sent' | 'received' = 'received'): Promise<MentorshipRequest[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const requests = this.getStoredRequests();
      
      if (type === 'sent') {
        return requests.filter(req => req.menteeId === userId && req.status === 'pending');
      } else {
        return requests.filter(req => req.mentorId === userId && req.status === 'pending');
      }

    } catch (error) {
      throw new APIError(500, 'Failed to get mentorship requests', error);
    }
  }

  /**
   * Get mentorship communication history
   */
  async getMentorshipCommunications(connectionId: string, userId: string): Promise<MentorshipCommunication[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const connections = this.getStoredConnections();
      const communications = this.getStoredCommunications();

      // Verify user is part of the mentorship
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) {
        throw new APIError(404, 'Mentorship connection not found');
      }

      if (userId !== connection.mentorId && userId !== connection.menteeId) {
        throw new APIError(403, 'Not authorized to view this mentorship communication');
      }

      return communications
        .filter(comm => comm.connectionId === connectionId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to get mentorship communications', error);
    }
  }

  /**
   * Create or update mentor profile
   */
  async createMentorProfile(profile: Omit<MentorProfile, 'id' | 'menteeCount' | 'rating' | 'reviewCount'>): Promise<MentorProfile> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const mentorProfiles = this.getStoredMentorProfiles();
      
      // Check if profile already exists
      const existingIndex = mentorProfiles.findIndex(p => p.userId === profile.userId);
      
      const mentorProfile: MentorProfile = {
        id: existingIndex !== -1 ? mentorProfiles[existingIndex].id : this.getNextId(),
        ...profile,
        menteeCount: existingIndex !== -1 ? mentorProfiles[existingIndex].menteeCount : 0,
        rating: existingIndex !== -1 ? mentorProfiles[existingIndex].rating : 5.0,
        reviewCount: existingIndex !== -1 ? mentorProfiles[existingIndex].reviewCount : 0
      };

      if (existingIndex !== -1) {
        mentorProfiles[existingIndex] = mentorProfile;
      } else {
        mentorProfiles.push(mentorProfile);
      }

      this.saveMentorProfiles(mentorProfiles);
      return mentorProfile;

    } catch (error) {
      throw new APIError(500, 'Failed to create mentor profile', error);
    }
  }

  /**
   * Get mentor profile by user ID
   */
  async getMentorProfile(userId: string): Promise<MentorProfile | null> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const mentorProfiles = this.getStoredMentorProfiles();
      return mentorProfiles.find(profile => profile.userId === userId) || null;

    } catch (error) {
      throw new APIError(500, 'Failed to get mentor profile', error);
    }
  }

  /**
   * Get mentorship success metrics for a mentor
   * Requirements: 6.4 - Mentorship success tracking
   */
  async getMentorshipSuccessMetrics(mentorId: string): Promise<{
    totalMentorships: number;
    completedMentorships: number;
    averageRating: number;
    successRate: number;
    totalMenteesHelped: number;
  }> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const connections = this.getStoredConnections();
      const mentorConnections = connections.filter(conn => conn.mentorId === mentorId);

      const completedConnections = mentorConnections.filter(conn => 
        conn.status === MentorshipStatus.COMPLETED
      );

      const totalRatings = completedConnections
        .filter(conn => conn.rating !== undefined)
        .reduce((sum, conn) => sum + (conn.rating || 0), 0);

      const ratedConnections = completedConnections.filter(conn => conn.rating !== undefined).length;

      return {
        totalMentorships: mentorConnections.length,
        completedMentorships: completedConnections.length,
        averageRating: ratedConnections > 0 ? totalRatings / ratedConnections : 0,
        successRate: mentorConnections.length > 0 ? 
          (completedConnections.length / mentorConnections.length) * 100 : 0,
        totalMenteesHelped: new Set(mentorConnections.map(conn => conn.menteeId)).size
      };

    } catch (error) {
      throw new APIError(500, 'Failed to get mentorship success metrics', error);
    }
  }

  /**
   * Utility method to clear all mentorship data (for testing)
   */
  clearAllMentorshipData(): void {
    localStorage.removeItem(MENTOR_PROFILES_STORAGE_KEY);
    localStorage.removeItem(MENTORSHIP_CONNECTIONS_STORAGE_KEY);
    localStorage.removeItem(MENTORSHIP_REQUESTS_STORAGE_KEY);
    localStorage.removeItem(MENTORSHIP_COMMUNICATIONS_STORAGE_KEY);
    localStorage.removeItem(MENTORSHIP_COUNTER_KEY);
    this.initializeStorage();
  }


}

// Export singleton instance
export const mentorshipSystem = new MentorshipSystem();
export default mentorshipSystem;
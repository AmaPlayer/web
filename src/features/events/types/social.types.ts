import { Timestamp } from 'firebase/firestore';

// Social Features and Interaction Types
export interface CustomEmoji {
    id: string;
    name: string;
    url: string;
    sport: string;
    animated: boolean;
    category: EmojiCategory;
    usage_count: number;
}

export enum EmojiCategory {
    SPORT_SPECIFIC = 'sport_specific',
    CELEBRATION = 'celebration',
    MOTIVATION = 'motivation',
    REACTION = 'reaction',
    CUSTOM = 'custom'
}

export interface SocialReactionSummary {
    reactions: { [reactionType: string]: number };
    total: number;
    userReaction?: string; // Current user's reaction if any
}

export interface EnhancedReaction {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    targetType: 'event' | 'comment' | 'submission' | 'challenge';
    targetId: string;
    reactionType: string;
    timestamp: Timestamp;
    animated?: boolean;
}

// Mentorship System Types
export interface MentorProfile {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    sports: string[];
    experience: string;
    achievements: string[];
    rating: number;
    reviewCount: number;
    isAvailable: boolean;
    menteeCount: number;
    maxMentees: number;
    bio: string;
    specialties: string[];
    languages: string[];
    timezone: string;
    responseTime: string; // e.g., "Usually responds within 2 hours"
}

export interface MentorshipConnection {
    id: string;
    mentorId: string;
    menteeId: string;
    sport: string;
    status: MentorshipStatus;
    startDate: Timestamp;
    endDate?: Timestamp;
    goals: string[];
    progress: MentorshipProgress[];
    rating?: number;
    review?: string;
    communicationChannel: string; // chat room ID or similar
}

export enum MentorshipStatus {
    REQUESTED = 'requested',
    ACCEPTED = 'accepted',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface MentorshipProgress {
    id: string;
    date: Timestamp;
    milestone: string;
    description: string;
    completedBy: 'mentor' | 'mentee';
}

export interface MentorshipRequest {
    id: string;
    menteeId: string;
    mentorId: string;
    sport: string;
    message: string;
    goals: string[];
    requestedAt: Timestamp;
    status: 'pending' | 'accepted' | 'declined';
}

export interface MentorshipOpportunity {
    eventId: string;
    mentorId: string;
    mentorName: string;
    sport: string;
    availableSlots: number;
    description: string;
    requirements?: string[];
}

// Motivational Messaging Types
export interface MotivationalMessage {
    id: string;
    template: string;
    category: MessageCategory;
    sport?: string;
    variables: string[]; // placeholders like {userName}, {achievement}
    usage_count: number;
}

export enum MessageCategory {
    ENCOURAGEMENT = 'encouragement',
    CONGRATULATIONS = 'congratulations',
    MOTIVATION = 'motivation',
    SUPPORT = 'support',
    CELEBRATION = 'celebration'
}

export interface PersonalizedMessage {
    id: string;
    fromUserId: string;
    toUserId: string;
    templateId: string;
    content: string;
    context: MessageContext;
    sentAt: Timestamp;
    readAt?: Timestamp;
}

export interface MessageContext {
    eventId?: string;
    achievementId?: string;
    challengeId?: string;
    type: 'achievement' | 'participation' | 'support' | 'celebration';
}

// Interactive Event Features
export interface Poll {
    id: string;
    eventId: string;
    createdBy: string;
    question: string;
    options: PollOption[];
    isActive: boolean;
    allowMultiple: boolean;
    isAnonymous: boolean;
    createdAt: Timestamp;
    endsAt?: Timestamp;
    totalVotes: number;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
    percentage: number;
    voterIds: string[];
}

export interface PollVote {
    id: string;
    pollId: string;
    userId: string;
    optionIds: string[];
    votedAt: Timestamp;
}

export interface QASession {
    id: string;
    eventId: string;
    title: string;
    description?: string;
    isActive: boolean;
    moderatorIds: string[];
    questions: Question[];
    createdAt: Timestamp;
}

export interface Question {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    upvotes: number;
    upvoterIds: string[];
    isAnswered: boolean;
    answer?: string;
    answeredBy?: string;
    answeredAt?: Timestamp;
    submittedAt: Timestamp;
    isPinned: boolean;
}

export interface LiveDiscussion {
    id: string;
    eventId: string;
    title: string;
    isActive: boolean;
    moderatorIds: string[];
    messages: DiscussionMessage[];
    participantCount: number;
    rules?: string[];
}

export interface DiscussionMessage {
    id: string;
    discussionId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: Timestamp;
    isModerated: boolean;
    isPinned: boolean;
    reactions: EnhancedReaction[];
    replyTo?: string;
}

import { Timestamp } from 'firebase/firestore';
import { 
  Poll, 
  PollOption, 
  PollVote, 
  QASession, 
  Question, 
  LiveDiscussion, 
  DiscussionMessage 
} from '@features/events/types/social.types';

/**
 * Interactive Event Service
 * Handles real-time polling, Q&A sessions, and live discussions
 */
export class InteractiveEventService {
  private polls: Map<string, Poll> = new Map();
  private pollVotes: Map<string, PollVote[]> = new Map();
  private qaSessions: Map<string, QASession> = new Map();
  private liveDiscussions: Map<string, LiveDiscussion> = new Map();

  // ===== POLLING SYSTEM =====

  /**
   * Create a new poll for an event
   */
  async createPoll(
    eventId: string,
    createdBy: string,
    question: string,
    options: string[],
    allowMultiple: boolean = false,
    isAnonymous: boolean = false,
    duration?: number // in minutes
  ): Promise<Poll> {
    const poll: Poll = {
      id: `poll_${eventId}_${Date.now()}`,
      eventId,
      createdBy,
      question,
      options: options.map((text, index) => ({
        id: `option_${index}`,
        text,
        votes: 0,
        percentage: 0,
        voterIds: []
      })),
      isActive: true,
      allowMultiple,
      isAnonymous,
      createdAt: Timestamp.now(),
      endsAt: duration ? Timestamp.fromMillis(Date.now() + duration * 60000) : undefined,
      totalVotes: 0
    };

    this.polls.set(poll.id, poll);
    this.pollVotes.set(poll.id, []);
    return poll;
  }

  /**
   * Vote on a poll
   */
  async votePoll(pollId: string, userId: string, optionIds: string[]): Promise<PollVote> {
    const poll = this.polls.get(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    if (!poll.isActive) {
      throw new Error('Poll is not active');
    }

    if (poll.endsAt && Timestamp.now().toMillis() > poll.endsAt.toMillis()) {
      throw new Error('Poll has ended');
    }

    // Remove existing vote if any
    await this.removeVote(pollId, userId);

    // Validate options
    if (!poll.allowMultiple && optionIds.length > 1) {
      throw new Error('Multiple votes not allowed');
    }

    const validOptionIds = optionIds.filter(id => 
      poll.options.some(option => option.id === id)
    );

    if (validOptionIds.length === 0) {
      throw new Error('No valid options selected');
    }

    // Create vote
    const vote: PollVote = {
      id: `vote_${pollId}_${userId}_${Date.now()}`,
      pollId,
      userId,
      optionIds: validOptionIds,
      votedAt: Timestamp.now()
    };

    // Update poll statistics
    validOptionIds.forEach(optionId => {
      const option = poll.options.find(o => o.id === optionId);
      if (option) {
        option.votes++;
        if (!poll.isAnonymous) {
          option.voterIds.push(userId);
        }
      }
    });

    poll.totalVotes++;
    this.updatePollPercentages(poll);

    // Store vote
    const votes = this.pollVotes.get(pollId) || [];
    votes.push(vote);
    this.pollVotes.set(pollId, votes);

    return vote;
  }

  /**
   * Get poll results
   */
  async getPoll(pollId: string): Promise<Poll | null> {
    return this.polls.get(pollId) || null;
  }

  /**
   * Get all polls for an event
   */
  async getEventPolls(eventId: string): Promise<Poll[]> {
    return Array.from(this.polls.values())
      .filter(poll => poll.eventId === eventId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }

  /**
   * Close a poll
   */
  async closePoll(pollId: string, userId: string): Promise<void> {
    const poll = this.polls.get(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.createdBy !== userId) {
      throw new Error('Only poll creator can close the poll');
    }

    poll.isActive = false;
  }

  // ===== Q&A SYSTEM =====

  /**
   * Create a Q&A session for an event
   */
  async createQASession(
    eventId: string,
    title: string,
    moderatorIds: string[],
    description?: string
  ): Promise<QASession> {
    const session: QASession = {
      id: `qa_${eventId}_${Date.now()}`,
      eventId,
      title,
      description,
      isActive: true,
      moderatorIds,
      questions: [],
      createdAt: Timestamp.now()
    };

    this.qaSessions.set(session.id, session);
    return session;
  }

  /**
   * Submit a question to Q&A session
   */
  async submitQuestion(
    sessionId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<Question> {
    const session = this.qaSessions.get(sessionId);
    if (!session) {
      throw new Error('Q&A session not found');
    }

    if (!session.isActive) {
      throw new Error('Q&A session is not active');
    }

    const question: Question = {
      id: `q_${sessionId}_${Date.now()}`,
      sessionId,
      userId,
      userName,
      userAvatar,
      content: content.trim(),
      upvotes: 0,
      upvoterIds: [],
      isAnswered: false,
      submittedAt: Timestamp.now(),
      isPinned: false
    };

    session.questions.push(question);
    return question;
  }

  /**
   * Upvote a question
   */
  async upvoteQuestion(questionId: string, userId: string): Promise<void> {
    const session = Array.from(this.qaSessions.values())
      .find(s => s.questions.some(q => q.id === questionId));
    
    if (!session) {
      throw new Error('Question not found');
    }

    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Toggle upvote
    const existingIndex = question.upvoterIds.indexOf(userId);
    if (existingIndex >= 0) {
      question.upvoterIds.splice(existingIndex, 1);
      question.upvotes--;
    } else {
      question.upvoterIds.push(userId);
      question.upvotes++;
    }
  }

  /**
   * Answer a question (moderator only)
   */
  async answerQuestion(
    questionId: string,
    moderatorId: string,
    answer: string
  ): Promise<void> {
    const session = Array.from(this.qaSessions.values())
      .find(s => s.questions.some(q => q.id === questionId));
    
    if (!session) {
      throw new Error('Question not found');
    }

    if (!session.moderatorIds.includes(moderatorId)) {
      throw new Error('Only moderators can answer questions');
    }

    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    question.answer = answer;
    question.answeredBy = moderatorId;
    question.answeredAt = Timestamp.now();
    question.isAnswered = true;
  }

  /**
   * Get Q&A session
   */
  async getQASession(sessionId: string): Promise<QASession | null> {
    return this.qaSessions.get(sessionId) || null;
  }

  /**
   * Get all Q&A sessions for an event
   */
  async getEventQASessions(eventId: string): Promise<QASession[]> {
    return Array.from(this.qaSessions.values())
      .filter(session => session.eventId === eventId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }

  // ===== LIVE DISCUSSION SYSTEM =====

  /**
   * Create a live discussion for an event
   */
  async createLiveDiscussion(
    eventId: string,
    title: string,
    moderatorIds: string[],
    rules?: string[]
  ): Promise<LiveDiscussion> {
    const discussion: LiveDiscussion = {
      id: `disc_${eventId}_${Date.now()}`,
      eventId,
      title,
      isActive: true,
      moderatorIds,
      messages: [],
      participantCount: 0,
      rules
    };

    this.liveDiscussions.set(discussion.id, discussion);
    return discussion;
  }

  /**
   * Post a message to live discussion
   */
  async postDiscussionMessage(
    discussionId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string,
    replyTo?: string
  ): Promise<DiscussionMessage> {
    const discussion = this.liveDiscussions.get(discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    if (!discussion.isActive) {
      throw new Error('Discussion is not active');
    }

    const message: DiscussionMessage = {
      id: `msg_${discussionId}_${Date.now()}`,
      discussionId,
      userId,
      userName,
      userAvatar,
      content: content.trim(),
      timestamp: Timestamp.now(),
      isModerated: false,
      isPinned: false,
      reactions: [],
      replyTo
    };

    discussion.messages.push(message);
    
    // Update participant count (unique users)
    const uniqueUsers = new Set(discussion.messages.map(m => m.userId));
    discussion.participantCount = uniqueUsers.size;

    return message;
  }

  /**
   * Moderate a discussion message (moderator only)
   */
  async moderateMessage(
    messageId: string,
    moderatorId: string,
    action: 'pin' | 'unpin' | 'hide'
  ): Promise<void> {
    const discussion = Array.from(this.liveDiscussions.values())
      .find(d => d.messages.some(m => m.id === messageId));
    
    if (!discussion) {
      throw new Error('Message not found');
    }

    if (!discussion.moderatorIds.includes(moderatorId)) {
      throw new Error('Only moderators can moderate messages');
    }

    const message = discussion.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    switch (action) {
      case 'pin':
        message.isPinned = true;
        break;
      case 'unpin':
        message.isPinned = false;
        break;
      case 'hide':
        message.isModerated = true;
        break;
    }
  }

  /**
   * Get live discussion
   */
  async getLiveDiscussion(discussionId: string): Promise<LiveDiscussion | null> {
    return this.liveDiscussions.get(discussionId) || null;
  }

  /**
   * Get all live discussions for an event
   */
  async getEventDiscussions(eventId: string): Promise<LiveDiscussion[]> {
    return Array.from(this.liveDiscussions.values())
      .filter(discussion => discussion.eventId === eventId)
      .sort((a, b) => b.messages.length - a.messages.length); // Sort by activity
  }

  // ===== UTILITY METHODS =====

  /**
   * Remove user's vote from poll
   */
  private async removeVote(pollId: string, userId: string): Promise<void> {
    const poll = this.polls.get(pollId);
    const votes = this.pollVotes.get(pollId) || [];
    
    if (!poll) return;

    // Find and remove existing vote
    const existingVoteIndex = votes.findIndex(v => v.userId === userId);
    if (existingVoteIndex >= 0) {
      const existingVote = votes[existingVoteIndex];
      
      // Update poll statistics
      existingVote.optionIds.forEach(optionId => {
        const option = poll.options.find(o => o.id === optionId);
        if (option) {
          option.votes--;
          const voterIndex = option.voterIds.indexOf(userId);
          if (voterIndex >= 0) {
            option.voterIds.splice(voterIndex, 1);
          }
        }
      });

      poll.totalVotes--;
      votes.splice(existingVoteIndex, 1);
      this.updatePollPercentages(poll);
    }
  }

  /**
   * Update poll option percentages
   */
  private updatePollPercentages(poll: Poll): void {
    poll.options.forEach(option => {
      option.percentage = poll.totalVotes > 0 
        ? Math.round((option.votes / poll.totalVotes) * 100)
        : 0;
    });
  }
}

// Export singleton instance
export const interactiveEventService = new InteractiveEventService();
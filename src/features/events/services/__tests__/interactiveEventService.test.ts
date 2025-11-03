import { describe, it, expect, beforeEach } from 'vitest';
import { InteractiveEventService } from '@features/events/services/interactiveEventService';

describe('InteractiveEventService', () => {
  let interactiveService: InteractiveEventService;

  beforeEach(() => {
    interactiveService = new InteractiveEventService();
  });

  describe('Polling System', () => {
    describe('createPoll', () => {
      it('should create a poll with basic options', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'What is your favorite sport?',
          ['Basketball', 'Soccer', 'Tennis'],
          false,
          false
        );

        expect(poll).toBeDefined();
        expect(poll.eventId).toBe('event_1');
        expect(poll.createdBy).toBe('creator_1');
        expect(poll.question).toBe('What is your favorite sport?');
        expect(poll.options).toHaveLength(3);
        expect(poll.isActive).toBe(true);
        expect(poll.allowMultiple).toBe(false);
        expect(poll.isAnonymous).toBe(false);
        expect(poll.totalVotes).toBe(0);
      });

      it('should create poll with duration', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Quick poll',
          ['Yes', 'No'],
          false,
          false,
          30 // 30 minutes
        );

        expect(poll.endsAt).toBeDefined();
        expect(poll.endsAt!.getTime()).toBeGreaterThan(Date.now());
      });

      it('should initialize poll options correctly', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Test poll',
          ['Option A', 'Option B']
        );

        poll.options.forEach((option, index) => {
          expect(option.id).toBe(`option_${index}`);
          expect(option.votes).toBe(0);
          expect(option.percentage).toBe(0);
          expect(option.voterIds).toEqual([]);
        });
      });
    });

    describe('votePoll', () => {
      it('should allow user to vote on poll', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Test poll',
          ['Option A', 'Option B']
        );

        const vote = await interactiveService.votePoll(poll.id, 'user_1', ['option_0']);

        expect(vote).toBeDefined();
        expect(vote.pollId).toBe(poll.id);
        expect(vote.userId).toBe('user_1');
        expect(vote.optionIds).toEqual(['option_0']);

        // Check poll statistics updated
        const updatedPoll = await interactiveService.getPoll(poll.id);
        expect(updatedPoll!.totalVotes).toBe(1);
        expect(updatedPoll!.options[0].votes).toBe(1);
        expect(updatedPoll!.options[0].percentage).toBe(100);
      });

      it('should replace existing vote from same user', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Test poll',
          ['Option A', 'Option B']
        );

        // First vote
        await interactiveService.votePoll(poll.id, 'user_1', ['option_0']);
        
        // Second vote from same user
        await interactiveService.votePoll(poll.id, 'user_1', ['option_1']);

        const updatedPoll = await interactiveService.getPoll(poll.id);
        expect(updatedPoll!.totalVotes).toBe(1);
        expect(updatedPoll!.options[0].votes).toBe(0);
        expect(updatedPoll!.options[1].votes).toBe(1);
      });

      it('should allow multiple votes when enabled', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Multiple choice poll',
          ['Option A', 'Option B', 'Option C'],
          true // allow multiple
        );

        await interactiveService.votePoll(poll.id, 'user_1', ['option_0', 'option_2']);

        const updatedPoll = await interactiveService.getPoll(poll.id);
        expect(updatedPoll!.totalVotes).toBe(1);
        expect(updatedPoll!.options[0].votes).toBe(1);
        expect(updatedPoll!.options[1].votes).toBe(0);
        expect(updatedPoll!.options[2].votes).toBe(1);
      });

      it('should reject multiple votes when not allowed', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Single choice poll',
          ['Option A', 'Option B'],
          false // single choice only
        );

        await expect(
          interactiveService.votePoll(poll.id, 'user_1', ['option_0', 'option_1'])
        ).rejects.toThrow('Multiple votes not allowed');
      });

      it('should reject votes on inactive poll', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Test poll',
          ['Option A', 'Option B']
        );

        await interactiveService.closePoll(poll.id, 'creator_1');

        await expect(
          interactiveService.votePoll(poll.id, 'user_1', ['option_0'])
        ).rejects.toThrow('Poll is not active');
      });

      it('should reject votes on expired poll', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Expired poll',
          ['Option A', 'Option B'],
          false,
          false,
          -1 // Expired 1 minute ago
        );

        await expect(
          interactiveService.votePoll(poll.id, 'user_1', ['option_0'])
        ).rejects.toThrow('Poll has ended');
      });
    });

    describe('getEventPolls', () => {
      it('should return polls for specific event', async () => {
        const freshService = new InteractiveEventService();
        
        const poll1 = await freshService.createPoll(
          'event_1',
          'creator_1',
          'Poll 1',
          ['A', 'B']
        );

        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        const poll2 = await freshService.createPoll(
          'event_1',
          'creator_1',
          'Poll 2',
          ['C', 'D']
        );

        await new Promise(resolve => setTimeout(resolve, 10));

        const poll3 = await freshService.createPoll(
          'event_2',
          'creator_1',
          'Poll 3',
          ['E', 'F']
        );

        const event1Polls = await freshService.getEventPolls('event_1');
        expect(event1Polls).toHaveLength(2);
        expect(event1Polls.every(poll => poll.eventId === 'event_1')).toBe(true);
        expect(event1Polls.map(p => p.id)).toContain(poll1.id);
        expect(event1Polls.map(p => p.id)).toContain(poll2.id);
        expect(event1Polls.map(p => p.id)).not.toContain(poll3.id);
      });

      it('should return polls sorted by creation date (newest first)', async () => {
        const poll1 = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'First poll',
          ['A', 'B']
        );

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        const poll2 = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Second poll',
          ['C', 'D']
        );

        const polls = await interactiveService.getEventPolls('event_1');
        expect(polls[0].id).toBe(poll2.id); // Newest first
        expect(polls[1].id).toBe(poll1.id);
      });
    });

    describe('closePoll', () => {
      it('should allow creator to close poll', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Test poll',
          ['A', 'B']
        );

        await interactiveService.closePoll(poll.id, 'creator_1');

        const updatedPoll = await interactiveService.getPoll(poll.id);
        expect(updatedPoll!.isActive).toBe(false);
      });

      it('should reject non-creator from closing poll', async () => {
        const poll = await interactiveService.createPoll(
          'event_1',
          'creator_1',
          'Test poll',
          ['A', 'B']
        );

        await expect(
          interactiveService.closePoll(poll.id, 'other_user')
        ).rejects.toThrow('Only poll creator can close the poll');
      });
    });
  });

  describe('Q&A System', () => {
    describe('createQASession', () => {
      it('should create Q&A session', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Ask the Expert',
          ['moderator_1', 'moderator_2'],
          'Submit your questions about training'
        );

        expect(session).toBeDefined();
        expect(session.eventId).toBe('event_1');
        expect(session.title).toBe('Ask the Expert');
        expect(session.moderatorIds).toEqual(['moderator_1', 'moderator_2']);
        expect(session.description).toBe('Submit your questions about training');
        expect(session.isActive).toBe(true);
        expect(session.questions).toEqual([]);
      });
    });

    describe('submitQuestion', () => {
      it('should allow users to submit questions', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Q&A Session',
          ['moderator_1']
        );

        const question = await interactiveService.submitQuestion(
          session.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'How do I improve my shooting accuracy?'
        );

        expect(question).toBeDefined();
        expect(question.sessionId).toBe(session.id);
        expect(question.userId).toBe('user_1');
        expect(question.userName).toBe('John Doe');
        expect(question.content).toBe('How do I improve my shooting accuracy?');
        expect(question.upvotes).toBe(0);
        expect(question.isAnswered).toBe(false);
      });

      it('should reject questions for inactive session', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Q&A Session',
          ['moderator_1']
        );

        // Manually deactivate session
        session.isActive = false;

        await expect(
          interactiveService.submitQuestion(
            session.id,
            'user_1',
            'John Doe',
            'avatar.jpg',
            'Test question'
          )
        ).rejects.toThrow('Q&A session is not active');
      });
    });

    describe('upvoteQuestion', () => {
      it('should allow users to upvote questions', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Q&A Session',
          ['moderator_1']
        );

        const question = await interactiveService.submitQuestion(
          session.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Test question'
        );

        await interactiveService.upvoteQuestion(question.id, 'user_2');

        const updatedSession = await interactiveService.getQASession(session.id);
        const updatedQuestion = updatedSession!.questions.find(q => q.id === question.id);
        expect(updatedQuestion!.upvotes).toBe(1);
        expect(updatedQuestion!.upvoterIds).toContain('user_2');
      });

      it('should toggle upvote when user votes again', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Q&A Session',
          ['moderator_1']
        );

        const question = await interactiveService.submitQuestion(
          session.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Test question'
        );

        // First upvote
        await interactiveService.upvoteQuestion(question.id, 'user_2');
        
        // Second upvote (should remove)
        await interactiveService.upvoteQuestion(question.id, 'user_2');

        const updatedSession = await interactiveService.getQASession(session.id);
        const updatedQuestion = updatedSession!.questions.find(q => q.id === question.id);
        expect(updatedQuestion!.upvotes).toBe(0);
        expect(updatedQuestion!.upvoterIds).not.toContain('user_2');
      });
    });

    describe('answerQuestion', () => {
      it('should allow moderators to answer questions', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Q&A Session',
          ['moderator_1']
        );

        const question = await interactiveService.submitQuestion(
          session.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'How do I improve my shooting?'
        );

        await interactiveService.answerQuestion(
          question.id,
          'moderator_1',
          'Practice daily and focus on your form.'
        );

        const updatedSession = await interactiveService.getQASession(session.id);
        const answeredQuestion = updatedSession!.questions.find(q => q.id === question.id);
        expect(answeredQuestion!.isAnswered).toBe(true);
        expect(answeredQuestion!.answer).toBe('Practice daily and focus on your form.');
        expect(answeredQuestion!.answeredBy).toBe('moderator_1');
        expect(answeredQuestion!.answeredAt).toBeDefined();
      });

      it('should reject non-moderators from answering', async () => {
        const session = await interactiveService.createQASession(
          'event_1',
          'Q&A Session',
          ['moderator_1']
        );

        const question = await interactiveService.submitQuestion(
          session.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Test question'
        );

        await expect(
          interactiveService.answerQuestion(
            question.id,
            'regular_user',
            'Unauthorized answer'
          )
        ).rejects.toThrow('Only moderators can answer questions');
      });
    });
  });

  describe('Live Discussion System', () => {
    describe('createLiveDiscussion', () => {
      it('should create live discussion', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1'],
          ['Be respectful', 'Stay on topic']
        );

        expect(discussion).toBeDefined();
        expect(discussion.eventId).toBe('event_1');
        expect(discussion.title).toBe('Live Chat');
        expect(discussion.moderatorIds).toEqual(['moderator_1']);
        expect(discussion.isActive).toBe(true);
        expect(discussion.messages).toEqual([]);
        expect(discussion.participantCount).toBe(0);
        expect(discussion.rules).toEqual(['Be respectful', 'Stay on topic']);
      });
    });

    describe('postDiscussionMessage', () => {
      it('should allow users to post messages', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        const message = await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Great event so far!'
        );

        expect(message).toBeDefined();
        expect(message.discussionId).toBe(discussion.id);
        expect(message.userId).toBe('user_1');
        expect(message.userName).toBe('John Doe');
        expect(message.content).toBe('Great event so far!');
        expect(message.isModerated).toBe(false);
        expect(message.isPinned).toBe(false);

        // Check participant count updated
        const updatedDiscussion = await interactiveService.getLiveDiscussion(discussion.id);
        expect(updatedDiscussion!.participantCount).toBe(1);
      });

      it('should support reply messages', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        const originalMessage = await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'What do you think about the game?'
        );

        const replyMessage = await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_2',
          'Jane Smith',
          'avatar2.jpg',
          'It was amazing!',
          originalMessage.id
        );

        expect(replyMessage.replyTo).toBe(originalMessage.id);
      });

      it('should update participant count correctly', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        // Same user posts multiple messages
        await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'First message'
        );

        await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Second message'
        );

        // Different user posts message
        await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_2',
          'Jane Smith',
          'avatar2.jpg',
          'Third message'
        );

        const updatedDiscussion = await interactiveService.getLiveDiscussion(discussion.id);
        expect(updatedDiscussion!.participantCount).toBe(2); // Unique users only
      });

      it('should reject messages for inactive discussion', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        // Manually deactivate discussion
        discussion.isActive = false;

        await expect(
          interactiveService.postDiscussionMessage(
            discussion.id,
            'user_1',
            'John Doe',
            'avatar.jpg',
            'Test message'
          )
        ).rejects.toThrow('Discussion is not active');
      });
    });

    describe('moderateMessage', () => {
      it('should allow moderators to pin messages', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        const message = await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Important announcement'
        );

        await interactiveService.moderateMessage(message.id, 'moderator_1', 'pin');

        const updatedDiscussion = await interactiveService.getLiveDiscussion(discussion.id);
        const pinnedMessage = updatedDiscussion!.messages.find(m => m.id === message.id);
        expect(pinnedMessage!.isPinned).toBe(true);
      });

      it('should allow moderators to hide messages', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        const message = await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Inappropriate content'
        );

        await interactiveService.moderateMessage(message.id, 'moderator_1', 'hide');

        const updatedDiscussion = await interactiveService.getLiveDiscussion(discussion.id);
        const moderatedMessage = updatedDiscussion!.messages.find(m => m.id === message.id);
        expect(moderatedMessage!.isModerated).toBe(true);
      });

      it('should reject non-moderators from moderating', async () => {
        const discussion = await interactiveService.createLiveDiscussion(
          'event_1',
          'Live Chat',
          ['moderator_1']
        );

        const message = await interactiveService.postDiscussionMessage(
          discussion.id,
          'user_1',
          'John Doe',
          'avatar.jpg',
          'Test message'
        );

        await expect(
          interactiveService.moderateMessage(message.id, 'regular_user', 'pin')
        ).rejects.toThrow('Only moderators can moderate messages');
      });
    });

    describe('getEventDiscussions', () => {
      it('should return discussions sorted by activity', async () => {
        const freshService = new InteractiveEventService();
        
        const discussion1 = await freshService.createLiveDiscussion(
          'event_1',
          'Chat 1',
          ['moderator_1']
        );

        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        const discussion2 = await freshService.createLiveDiscussion(
          'event_1',
          'Chat 2',
          ['moderator_1']
        );

        // Add more messages to discussion2
        await freshService.postDiscussionMessage(
          discussion2.id,
          'user_1',
          'John',
          'avatar.jpg',
          'Message 1'
        );

        await freshService.postDiscussionMessage(
          discussion2.id,
          'user_2',
          'Jane',
          'avatar2.jpg',
          'Message 2'
        );

        const discussions = await freshService.getEventDiscussions('event_1');
        expect(discussions).toHaveLength(2);
        expect(discussions[0].id).toBe(discussion2.id); // More active first
        expect(discussions[1].id).toBe(discussion1.id);
      });
    });
  });
});
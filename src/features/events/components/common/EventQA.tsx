import React, { useState, useEffect } from 'react';
import { interactiveEventService } from '@features/events/services/interactiveEventService';
import { QASession, Question } from '@features/events/types/social.types';

interface EventQAProps {
  eventId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isModerator?: boolean;
  className?: string;
}

export const EventQA: React.FC<EventQAProps> = ({
  eventId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isModerator = false,
  className = ''
}) => {
  const [sessions, setSessions] = useState<QASession[]>([]);
  const [activeSession, setActiveSession] = useState<QASession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQASessions();
    
    // Poll for updates every 15 seconds
    const interval = setInterval(loadQASessions, 15000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadQASessions = async () => {
    try {
      const eventSessions = await interactiveEventService.getEventQASessions(eventId);
      setSessions(eventSessions);
      
      // Set active session to the first active one
      const active = eventSessions.find(s => s.isActive);
      if (active) {
        setActiveSession(active);
      }
    } catch (error) {
      console.error('Failed to load Q&A sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (sessionId: string, content: string) => {
    try {
      await interactiveEventService.submitQuestion(
        sessionId,
        currentUserId,
        currentUserName,
        currentUserAvatar,
        content
      );
      await loadQASessions();
    } catch (error) {
      console.error('Failed to submit question:', error);
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    try {
      await interactiveEventService.upvoteQuestion(questionId, currentUserId);
      await loadQASessions();
    } catch (error) {
      console.error('Failed to upvote question:', error);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      await interactiveEventService.answerQuestion(questionId, currentUserId, answer);
      await loadQASessions();
    } catch (error) {
      console.error('Failed to answer question:', error);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>❓</span>
          Q&A Sessions
        </h3>
        {isModerator && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
          >
            Create Session
          </button>
        )}
      </div>

      {/* Create session form */}
      {showCreateForm && (
        <CreateQASessionForm
          eventId={eventId}
          moderatorId={currentUserId}
          onSessionCreated={() => {
            setShowCreateForm(false);
            loadQASessions();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Session tabs */}
      {sessions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                ${activeSession?.id === session.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${!session.isActive ? 'opacity-60' : ''}
              `}
            >
              {session.title}
              {!session.isActive && ' (Closed)'}
            </button>
          ))}
        </div>
      )}

      {/* Active session */}
      {activeSession ? (
        <QASessionView
          session={activeSession}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          isModerator={isModerator}
          onSubmitQuestion={handleSubmitQuestion}
          onUpvoteQuestion={handleUpvoteQuestion}
          onAnswerQuestion={handleAnswerQuestion}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">❓</div>
          <p>No Q&A sessions yet</p>
          {isModerator && (
            <p className="text-sm mt-1">Create a session to start collecting questions!</p>
          )}
        </div>
      )}
    </div>
  );
};

interface CreateQASessionFormProps {
  eventId: string;
  moderatorId: string;
  onSessionCreated: () => void;
  onCancel: () => void;
}

const CreateQASessionForm: React.FC<CreateQASessionFormProps> = ({
  eventId,
  moderatorId,
  onSessionCreated,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please provide a title');
      return;
    }

    setCreating(true);
    try {
      await interactiveEventService.createQASession(
        eventId,
        title.trim(),
        [moderatorId],
        description.trim() || undefined
      );
      onSessionCreated();
    } catch (error) {
      console.error('Failed to create Q&A session:', error);
      alert('Failed to create Q&A session');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Create Q&A Session</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Training Tips Q&A"
            className="w-full p-3 border border-gray-300 rounded-lg"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this Q&A session is about..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
            maxLength={300}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg"
          >
            {creating ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface QASessionViewProps {
  session: QASession;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isModerator: boolean;
  onSubmitQuestion: (sessionId: string, content: string) => void;
  onUpvoteQuestion: (questionId: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
}

const QASessionView: React.FC<QASessionViewProps> = ({
  session,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isModerator,
  onSubmitQuestion,
  onUpvoteQuestion,
  onAnswerQuestion
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitQuestion(session.id, newQuestion.trim());
      setNewQuestion('');
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const sortedQuestions = [...session.questions].sort((a, b) => {
    // Pinned questions first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by upvotes
    if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
    
    // Then by submission time
    return b.submittedAt.toMillis() - a.submittedAt.toMillis();
  });

  return (
    <div className="space-y-4">
      {/* Session info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900">{session.title}</h4>
        {session.description && (
          <p className="text-sm text-gray-600 mt-1">{session.description}</p>
        )}
        <div className="text-xs text-gray-500 mt-2">
          {session.questions.length} question{session.questions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Submit question form */}
      {session.isActive && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask a Question
            </label>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newQuestion.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {sortedQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions yet</p>
            {session.isActive && (
              <p className="text-sm mt-1">Be the first to ask a question!</p>
            )}
          </div>
        ) : (
          sortedQuestions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              currentUserId={currentUserId}
              isModerator={isModerator}
              onUpvote={() => onUpvoteQuestion(question.id)}
              onAnswer={(answer) => onAnswerQuestion(question.id, answer)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface QuestionCardProps {
  question: Question;
  currentUserId: string;
  isModerator: boolean;
  onUpvote: () => void;
  onAnswer: (answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentUserId,
  isModerator,
  onUpvote,
  onAnswer
}) => {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasUpvoted = question.upvoterIds.includes(currentUserId);

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) return;

    setSubmitting(true);
    try {
      await onAnswer(answer.trim());
      setShowAnswerForm(false);
      setAnswer('');
    } catch (error) {
      console.error('Failed to answer question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`
      bg-white border rounded-lg p-4
      ${question.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}
    `}>
      {/* Question header */}
      <div className="flex items-start gap-3 mb-3">
        {question.userAvatar && (
          <img
            src={question.userAvatar}
            alt={question.userName}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{question.userName}</span>
            {question.isPinned && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                📌 Pinned
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {question.submittedAt.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Question content */}
      <p className="text-gray-800 mb-3">{question.content}</p>

      {/* Answer */}
      {question.isAnswered && question.answer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="text-sm font-medium text-green-800 mb-1">Answer:</div>
          <p className="text-green-700">{question.answer}</p>
          {question.answeredAt && (
            <div className="text-xs text-green-600 mt-1">
              Answered {question.answeredAt.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Upvote */}
        <button
          onClick={onUpvote}
          className={`
            flex items-center gap-1 px-2 py-1 rounded text-sm
            ${hasUpvoted 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <span>👍</span>
          <span>{question.upvotes}</span>
        </button>

        {/* Answer button for moderators */}
        {isModerator && !question.isAnswered && (
          <button
            onClick={() => setShowAnswerForm(!showAnswerForm)}
            className="text-sm text-green-600 hover:text-green-800"
          >
            Answer
          </button>
        )}
      </div>

      {/* Answer form */}
      {showAnswerForm && (
        <form onSubmit={handleAnswer} className="mt-3 pt-3 border-t">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
            maxLength={1000}
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAnswerForm(false)}
              className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
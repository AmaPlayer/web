import React, { useState, useEffect, useRef } from 'react';
import { interactiveEventService } from '@features/events/services/interactiveEventService';
import { LiveDiscussion as LiveDiscussionType, DiscussionMessage } from '@features/events/types/social.types';

interface LiveDiscussionProps {
  eventId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isModerator?: boolean;
  className?: string;
}

export const LiveDiscussion: React.FC<LiveDiscussionProps> = ({
  eventId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isModerator = false,
  className = ''
}) => {
  const [discussions, setDiscussions] = useState<LiveDiscussionType[]>([]);
  const [activeDiscussion, setActiveDiscussion] = useState<LiveDiscussionType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscussions();
    
    // Poll for updates every 5 seconds for real-time feel
    const interval = setInterval(loadDiscussions, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadDiscussions = async () => {
    try {
      const eventDiscussions = await interactiveEventService.getEventDiscussions(eventId);
      setDiscussions(eventDiscussions);
      
      // Set active discussion to the first active one
      const active = eventDiscussions.find(d => d.isActive);
      if (active && (!activeDiscussion || activeDiscussion.id !== active.id)) {
        setActiveDiscussion(active);
      }
    } catch (error) {
      console.error('Failed to load discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostMessage = async (discussionId: string, content: string, replyTo?: string) => {
    try {
      await interactiveEventService.postDiscussionMessage(
        discussionId,
        currentUserId,
        currentUserName,
        currentUserAvatar,
        content,
        replyTo
      );
      await loadDiscussions();
    } catch (error) {
      console.error('Failed to post message:', error);
    }
  };

  const handleModerateMessage = async (messageId: string, action: 'pin' | 'unpin' | 'hide') => {
    try {
      await interactiveEventService.moderateMessage(messageId, currentUserId, action);
      await loadDiscussions();
    } catch (error) {
      console.error('Failed to moderate message:', error);
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
          <span>💬</span>
          Live Discussion
        </h3>
        {isModerator && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm"
          >
            Create Discussion
          </button>
        )}
      </div>

      {/* Create discussion form */}
      {showCreateForm && (
        <CreateDiscussionForm
          eventId={eventId}
          moderatorId={currentUserId}
          onDiscussionCreated={() => {
            setShowCreateForm(false);
            loadDiscussions();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Discussion tabs */}
      {discussions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {discussions.map(discussion => (
            <button
              key={discussion.id}
              onClick={() => setActiveDiscussion(discussion)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2
                ${activeDiscussion?.id === discussion.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${!discussion.isActive ? 'opacity-60' : ''}
              `}
            >
              <span>{discussion.title}</span>
              <span className="text-xs bg-white bg-opacity-20 px-1 rounded">
                {discussion.participantCount}
              </span>
              {!discussion.isActive && <span className="text-xs">(Closed)</span>}
            </button>
          ))}
        </div>
      )}

      {/* Active discussion */}
      {activeDiscussion ? (
        <DiscussionView
          discussion={activeDiscussion}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          isModerator={isModerator}
          onPostMessage={handlePostMessage}
          onModerateMessage={handleModerateMessage}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💬</div>
          <p>No live discussions yet</p>
          {isModerator && (
            <p className="text-sm mt-1">Create a discussion to start the conversation!</p>
          )}
        </div>
      )}
    </div>
  );
};

interface CreateDiscussionFormProps {
  eventId: string;
  moderatorId: string;
  onDiscussionCreated: () => void;
  onCancel: () => void;
}

const CreateDiscussionForm: React.FC<CreateDiscussionFormProps> = ({
  eventId,
  moderatorId,
  onDiscussionCreated,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [rules, setRules] = useState<string[]>(['Be respectful', 'Stay on topic']);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please provide a title');
      return;
    }

    setCreating(true);
    try {
      await interactiveEventService.createLiveDiscussion(
        eventId,
        title.trim(),
        [moderatorId],
        rules.filter(rule => rule.trim())
      );
      onDiscussionCreated();
    } catch (error) {
      console.error('Failed to create discussion:', error);
      alert('Failed to create discussion');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Create Live Discussion</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., General Discussion"
            className="w-full p-3 border border-gray-300 rounded-lg"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discussion Rules
          </label>
          <div className="space-y-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => {
                    const newRules = [...rules];
                    newRules[index] = e.target.value;
                    setRules(newRules);
                  }}
                  placeholder={`Rule ${index + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  maxLength={100}
                />
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRules(rules.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {rules.length < 5 && (
            <button
              type="button"
              onClick={() => setRules([...rules, ''])}
              className="mt-2 text-purple-600 hover:text-purple-800 text-sm"
            >
              + Add rule
            </button>
          )}
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
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg"
          >
            {creating ? 'Creating...' : 'Create Discussion'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface DiscussionViewProps {
  discussion: LiveDiscussionType;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isModerator: boolean;
  onPostMessage: (discussionId: string, content: string, replyTo?: string) => void;
  onModerateMessage: (messageId: string, action: 'pin' | 'unpin' | 'hide') => void;
}

const DiscussionView: React.FC<DiscussionViewProps> = ({
  discussion,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isModerator,
  onPostMessage,
  onModerateMessage
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussion.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSubmitting(true);
    try {
      await onPostMessage(discussion.id, newMessage.trim(), replyTo || undefined);
      setNewMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to post message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const sortedMessages = [...discussion.messages].sort((a, b) => {
    // Pinned messages first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by timestamp
    return a.timestamp.toMillis() - b.timestamp.toMillis();
  });

  const visibleMessages = sortedMessages.filter(msg => !msg.isModerated);

  const replyToMessage = replyTo ? discussion.messages.find(m => m.id === replyTo) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Discussion header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{discussion.title}</h4>
            <div className="text-sm text-gray-600">
              {discussion.participantCount} participant{discussion.participantCount !== 1 ? 's' : ''}
              {!discussion.isActive && ' • Discussion closed'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        
        {/* Rules */}
        {discussion.rules && discussion.rules.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <strong>Rules:</strong> {discussion.rules.join(' • ')}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet</p>
            {discussion.isActive && (
              <p className="text-sm mt-1">Start the conversation!</p>
            )}
          </div>
        ) : (
          visibleMessages.map(message => (
            <MessageCard
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              isModerator={isModerator}
              onReply={() => setReplyTo(message.id)}
              onModerate={(action) => onModerateMessage(message.id, action)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      {discussion.isActive && (
        <div className="border-t p-4">
          {replyToMessage && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center justify-between">
                <span>Replying to <strong>{replyToMessage.userName}</strong></span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
              <div className="text-gray-600 truncate">
                {replyToMessage.content}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={submitting || !newMessage.trim()}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg"
            >
              {submitting ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

interface MessageCardProps {
  message: DiscussionMessage;
  currentUserId: string;
  isModerator: boolean;
  onReply: () => void;
  onModerate: (action: 'pin' | 'unpin' | 'hide') => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  currentUserId,
  isModerator,
  onReply,
  onModerate
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`
        flex gap-3 p-2 rounded-lg hover:bg-gray-50 group
        ${message.isPinned ? 'bg-yellow-50 border border-yellow-200' : ''}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {message.userAvatar ? (
        <img
          src={message.userAvatar}
          alt={message.userName}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-xs">
          {message.userName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 text-sm">
            {message.userName}
          </span>
          {message.isPinned && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
              📌
            </span>
          )}
          <span className="text-xs text-gray-500">
            {message.timestamp.toDate().toLocaleTimeString()}
          </span>
        </div>
        
        <p className="text-gray-800 text-sm break-words">
          {message.content}
        </p>

        {/* Reply indicator */}
        {message.replyTo && (
          <div className="text-xs text-gray-500 mt-1">
            ↳ Reply to message
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onReply}
            className="p-1 text-gray-400 hover:text-gray-600 text-xs"
            title="Reply"
          >
            ↩️
          </button>
          
          {isModerator && (
            <>
              <button
                onClick={() => onModerate(message.isPinned ? 'unpin' : 'pin')}
                className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                title={message.isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
              <button
                onClick={() => onModerate('hide')}
                className="p-1 text-gray-400 hover:text-red-600 text-xs"
                title="Hide message"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
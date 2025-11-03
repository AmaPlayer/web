import React, { useState, useEffect } from 'react';
import { motivationalMessagingSystem } from '@features/events/services/motivationalMessaging';
import { PersonalizedMessage, MessageCategory } from '@features/events/types/social.types';
import { formatTimeAgo } from '@features/events/utils/timestampHelpers';

interface MotivationalMessageDisplayProps {
  userId: string;
  limit?: number;
  showUnreadOnly?: boolean;
  className?: string;
}

export const MotivationalMessageDisplay: React.FC<MotivationalMessageDisplayProps> = ({
  userId,
  limit = 10,
  showUnreadOnly = false,
  className = ''
}) => {
  const [messages, setMessages] = useState<PersonalizedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [userId, limit]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const userMessages = await motivationalMessagingSystem.getUserMessages(userId, limit);
      const filteredMessages = showUnreadOnly 
        ? userMessages.filter(m => !m.readAt)
        : userMessages;
      setMessages(filteredMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await motivationalMessagingSystem.markMessageAsRead(messageId, userId);
      const { Timestamp } = await import('firebase/firestore');
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, readAt: Timestamp.now() }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const getCategoryIcon = (category: MessageCategory): string => {
    switch (category) {
      case MessageCategory.ENCOURAGEMENT: return '💪';
      case MessageCategory.CONGRATULATIONS: return '🎉';
      case MessageCategory.MOTIVATION: return '🔥';
      case MessageCategory.SUPPORT: return '🤝';
      case MessageCategory.CELEBRATION: return '🥳';
      default: return '💬';
    }
  };

  const getCategoryColor = (category: MessageCategory): string => {
    switch (category) {
      case MessageCategory.ENCOURAGEMENT: return 'bg-blue-50 border-blue-200 text-blue-800';
      case MessageCategory.CONGRATULATIONS: return 'bg-green-50 border-green-200 text-green-800';
      case MessageCategory.MOTIVATION: return 'bg-orange-50 border-orange-200 text-orange-800';
      case MessageCategory.SUPPORT: return 'bg-purple-50 border-purple-200 text-purple-800';
      case MessageCategory.CELEBRATION: return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getContextInfo = (message: PersonalizedMessage): string => {
    if (message.context.eventId) return 'Event message';
    if (message.context.challengeId) return 'Challenge message';
    if (message.context.achievementId) return 'Achievement message';
    return 'General message';
  };

  // Use imported formatTimeAgo from timestampHelpers

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 text-4xl mb-2">💬</div>
        <p className="text-gray-600">
          {showUnreadOnly ? 'No new messages' : 'No motivational messages yet'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Keep participating and the community will cheer you on!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message) => {
        const isExpanded = expandedMessage === message.id;
        const isUnread = !message.readAt;
        
        return (
          <div
            key={message.id}
            className={`
              relative p-4 rounded-lg border transition-all duration-200
              ${isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
              hover:shadow-md cursor-pointer
            `}
            onClick={() => {
              if (isUnread) {
                handleMarkAsRead(message.id);
              }
              setExpandedMessage(isExpanded ? null : message.id);
            }}
          >
            {/* Unread indicator */}
            {isUnread && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}

            {/* Message header */}
            <div className="flex items-start gap-3 mb-2">
              <div className="text-2xl">💬</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    Motivational Message
                  </span>
                  <span className="text-xs text-gray-500">
                    {getContextInfo(message)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(message.sentAt)}
                </div>
              </div>
            </div>

            {/* Message content */}
            <div className="ml-11">
              <p className={`text-gray-800 ${isExpanded ? '' : 'line-clamp-2'}`}>
                {message.content}
              </p>
              
              {!isExpanded && message.content.length > 100 && (
                <button className="text-blue-600 hover:text-blue-800 text-sm mt-1">
                  Read more
                </button>
              )}
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="ml-11 mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>From: Community</span>
                  {message.context.eventId && (
                    <span>Event ID: {message.context.eventId.slice(-8)}</span>
                  )}
                  {message.context.achievementId && (
                    <span>Achievement: {message.context.achievementId}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface MotivationalMessageBadgeProps {
  userId: string;
  className?: string;
}

export const MotivationalMessageBadge: React.FC<MotivationalMessageBadgeProps> = ({
  userId,
  className = ''
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const messages = await motivationalMessagingSystem.getUserMessages(userId);
      const unread = messages.filter(m => !m.readAt).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
        <span>💬</span>
        <span>{unreadCount} new message{unreadCount > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};
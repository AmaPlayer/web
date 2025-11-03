import React, { useState, useEffect } from 'react';
import { reactionSystem } from '@features/events/services/reactionSystem';
import { CustomEmoji } from '@features/events/types/social.types';
import { ReactionSummary } from '@features/events/types/event.types';

interface ReactionButtonProps {
  targetId: string;
  targetType: 'event' | 'comment' | 'submission' | 'challenge';
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  sport?: string;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  className?: string;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  targetId,
  targetType,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  sport = 'general',
  size = 'medium',
  showCount = true,
  className = ''
}) => {
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary>({
    reactions: {},
    total: 0
  });
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);

  useEffect(() => {
    loadReactions();
    loadCustomEmojis();
  }, [targetId, sport]);

  const loadReactions = async () => {
    try {
      const summary = await reactionSystem.getReactions(targetId, currentUserId);
      setReactionSummary(summary);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  const loadCustomEmojis = async () => {
    try {
      const emojis = await reactionSystem.getCustomEmojis(sport);
      setCustomEmojis(emojis);
    } catch (error) {
      console.error('Failed to load custom emojis:', error);
    }
  };

  const handleReaction = async (reactionType: string, animated: boolean = false) => {
    try {
      if (reactionSummary.userReaction === reactionType) {
        // Remove reaction if clicking the same one
        await reactionSystem.removeReaction(targetId, currentUserId);
      } else {
        // Add new reaction
        await reactionSystem.addReaction(
          targetId,
          currentUserId,
          currentUserName,
          currentUserAvatar,
          targetType,
          reactionType,
          animated
        );
        
        // Trigger animation
        if (animated) {
          setAnimatingReaction(reactionType);
          setTimeout(() => setAnimatingReaction(null), 1000);
        }
      }
      
      await loadReactions();
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to handle reaction:', error);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'w-8 h-8 text-sm';
      case 'large': return 'w-12 h-12 text-lg';
      default: return 'w-10 h-10 text-base';
    }
  };

  const getEmojiSize = () => {
    switch (size) {
      case 'small': return 'text-lg';
      case 'large': return 'text-2xl';
      default: return 'text-xl';
    }
  };

  const topReactions = Object.entries(reactionSummary.reactions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Main reaction button */}
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className={`
          ${getButtonSize()}
          flex items-center justify-center
          bg-gray-100 hover:bg-gray-200 
          border border-gray-300 rounded-full
          transition-all duration-200
          ${reactionSummary.userReaction ? 'bg-blue-100 border-blue-300' : ''}
        `}
        aria-label="Add reaction"
      >
        {reactionSummary.userReaction ? (
          <span className={getEmojiSize()}>{reactionSummary.userReaction}</span>
        ) : (
          <span className="text-gray-500">😊</span>
        )}
      </button>

      {/* Reaction count */}
      {showCount && reactionSummary.total > 0 && (
        <span className="text-sm text-gray-600 font-medium">
          {reactionSummary.total}
        </span>
      )}

      {/* Top reactions display */}
      {topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map(([reaction, count]) => (
            <button
              key={reaction}
              onClick={() => handleReaction(reaction)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full
                bg-gray-50 hover:bg-gray-100 border border-gray-200
                transition-all duration-200 text-sm
                ${reactionSummary.userReaction === reaction ? 'bg-blue-50 border-blue-200' : ''}
              `}
            >
              <span className="text-base">{reaction}</span>
              <span className="text-xs text-gray-600">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64">
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {customEmojis.map((emoji) => (
              <button
                key={emoji.id}
                onClick={() => handleReaction(emoji.url, emoji.animated)}
                className={`
                  p-2 rounded-lg hover:bg-gray-100 transition-colors
                  flex flex-col items-center gap-1
                  ${emoji.animated ? 'hover:scale-110 transform transition-transform' : ''}
                `}
                title={emoji.name}
              >
                <span className="text-xl">{emoji.url}</span>
                <span className="text-xs text-gray-500 truncate w-full text-center">
                  {emoji.name}
                </span>
              </button>
            ))}
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setShowEmojiPicker(false)}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Animated reaction effect */}
      {animatingReaction && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-bounce text-2xl">
            {animatingReaction}
          </div>
        </div>
      )}

      {/* Click outside to close picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};
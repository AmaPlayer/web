import React, { useState, useEffect } from 'react';
import { reactionSystem } from '@features/events/services/reactionSystem';
import { EnhancedReaction } from '@features/events/types/social.types';
import { ReactionSummary } from '@features/events/types/event.types';
import { timestampToMillis, formatTimestampTime } from '@features/events/utils/timestampHelpers';

interface ReactionDisplayProps {
  targetId: string;
  showUserDetails?: boolean;
  maxVisible?: number;
  className?: string;
}

export const ReactionDisplay: React.FC<ReactionDisplayProps> = ({
  targetId,
  showUserDetails = false,
  maxVisible = 5,
  className = ''
}) => {
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary>({
    reactions: {},
    total: 0
  });
  const [detailedReactions, setDetailedReactions] = useState<EnhancedReaction[]>([]);
  const [showAllReactions, setShowAllReactions] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [targetId]);

  const loadReactions = async () => {
    try {
      const [summary, detailed] = await Promise.all([
        reactionSystem.getReactions(targetId),
        reactionSystem.getDetailedReactions(targetId)
      ]);
      
      setReactionSummary(summary);
      setDetailedReactions(detailed);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  if (reactionSummary.total === 0) {
    return null;
  }

  const reactionEntries = Object.entries(reactionSummary.reactions)
    .sort(([,a], [,b]) => b - a);

  const visibleReactions = showAllReactions 
    ? reactionEntries 
    : reactionEntries.slice(0, maxVisible);

  const hasMoreReactions = reactionEntries.length > maxVisible;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Reaction summary */}
      <div className="flex items-center gap-2 flex-wrap">
        {visibleReactions.map(([reaction, count]) => (
          <div
            key={reaction}
            className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full border border-gray-200"
          >
            <span className="text-base">{reaction}</span>
            <span className="text-sm text-gray-600 font-medium">{count}</span>
          </div>
        ))}
        
        {hasMoreReactions && !showAllReactions && (
          <button
            onClick={() => setShowAllReactions(true)}
            className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            +{reactionEntries.length - maxVisible} more
          </button>
        )}
        
        {showAllReactions && hasMoreReactions && (
          <button
            onClick={() => setShowAllReactions(false)}
            className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
          >
            Show less
          </button>
        )}
      </div>

      {/* User details */}
      {showUserDetails && detailedReactions.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700">
            Reactions ({reactionSummary.total})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {detailedReactions
              .sort((a, b) => timestampToMillis(b.timestamp) - timestampToMillis(a.timestamp))
              .map((reaction) => (
                <div
                  key={reaction.id}
                  className="flex items-center gap-2 text-sm"
                >
                  {reaction.userAvatar && (
                    <img
                      src={reaction.userAvatar}
                      alt={reaction.userName}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="font-medium text-gray-900">
                    {reaction.userName}
                  </span>
                  <span className="text-lg">{reaction.reactionType}</span>
                  {reaction.animated && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded">
                      animated
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {formatTimestampTime(reaction.timestamp)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
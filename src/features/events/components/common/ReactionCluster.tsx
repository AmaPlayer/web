import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { reactionSystem } from '@features/events/services/reactionSystem';
import { EnhancedReaction } from '@features/events/types/social.types';

interface ReactionClusterProps {
  targetId: string;
  maxClusters?: number;
  animationDuration?: number;
  className?: string;
}

interface ReactionCluster {
  reactionType: string;
  count: number;
  users: string[];
  lastReaction: Timestamp;
  isAnimating: boolean;
}

export const ReactionCluster: React.FC<ReactionClusterProps> = ({
  targetId,
  maxClusters = 6,
  animationDuration = 2000,
  className = ''
}) => {
  const [clusters, setClusters] = useState<ReactionCluster[]>([]);
  const [animatingClusters, setAnimatingClusters] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReactionClusters();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadReactionClusters, 5000);
    return () => clearInterval(interval);
  }, [targetId]);

  const loadReactionClusters = async () => {
    try {
      const reactions = await reactionSystem.getDetailedReactions(targetId);
      const newClusters = createClusters(reactions);
      
      // Check for new reactions to animate
      const previousClusters = new Map(clusters.map(c => [c.reactionType, c]));
      const animatingTypes = new Set<string>();
      
      newClusters.forEach(cluster => {
        const previous = previousClusters.get(cluster.reactionType);
        if (!previous || cluster.count > previous.count) {
          animatingTypes.add(cluster.reactionType);
        }
      });
      
      if (animatingTypes.size > 0) {
        setAnimatingClusters(animatingTypes);
        setTimeout(() => {
          setAnimatingClusters(new Set());
        }, animationDuration);
      }
      
      setClusters(newClusters);
    } catch (error) {
      console.error('Failed to load reaction clusters:', error);
    }
  };

  const createClusters = (reactions: EnhancedReaction[]): ReactionCluster[] => {
    const clusterMap = new Map<string, ReactionCluster>();
    
    reactions.forEach(reaction => {
      const existing = clusterMap.get(reaction.reactionType);
      
      if (existing) {
        existing.count++;
        existing.users.push(reaction.userName);
        if (reaction.timestamp.toMillis() > existing.lastReaction.toMillis()) {
          existing.lastReaction = reaction.timestamp;
        }
      } else {
        clusterMap.set(reaction.reactionType, {
          reactionType: reaction.reactionType,
          count: 1,
          users: [reaction.userName],
          lastReaction: reaction.timestamp,
          isAnimating: false
        });
      }
    });
    
    return Array.from(clusterMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxClusters);
  };

  const getClusterSize = (count: number): string => {
    if (count >= 20) return 'text-2xl';
    if (count >= 10) return 'text-xl';
    if (count >= 5) return 'text-lg';
    return 'text-base';
  };

  const getClusterAnimation = (reactionType: string): string => {
    if (animatingClusters.has(reactionType)) {
      return 'animate-pulse scale-110 transform transition-all duration-500';
    }
    return 'transition-all duration-300 hover:scale-105';
  };

  if (clusters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {clusters.map((cluster) => (
        <div
          key={cluster.reactionType}
          className={`
            relative flex items-center gap-1 px-3 py-2
            bg-white border-2 border-gray-200 rounded-full
            shadow-sm hover:shadow-md cursor-pointer
            ${getClusterAnimation(cluster.reactionType)}
          `}
          title={`${cluster.users.slice(0, 3).join(', ')}${cluster.users.length > 3 ? ` and ${cluster.users.length - 3} others` : ''} reacted with ${cluster.reactionType}`}
        >
          {/* Reaction emoji */}
          <span className={`${getClusterSize(cluster.count)} select-none`}>
            {cluster.reactionType}
          </span>
          
          {/* Count */}
          <span className="text-sm font-semibold text-gray-700 min-w-[1rem] text-center">
            {cluster.count}
          </span>
          
          {/* Animation effect for new reactions */}
          {animatingClusters.has(cluster.reactionType) && (
            <>
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
              
              {/* Floating emoji */}
              <div className="absolute -top-2 -right-2 animate-bounce">
                <span className="text-lg">✨</span>
              </div>
            </>
          )}
          
          {/* Recent indicator */}
          {Date.now() - cluster.lastReaction.toMillis() < 30000 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
      ))}
      
      {/* Floating reaction animation */}
      {Array.from(animatingClusters).map(reactionType => (
        <div
          key={`floating-${reactionType}`}
          className="fixed pointer-events-none z-50"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'floatingReaction 2s ease-out forwards'
          }}
        >
          <span className="text-4xl opacity-90">
            {reactionType}
          </span>
        </div>
      ))}
    </div>
  );
};
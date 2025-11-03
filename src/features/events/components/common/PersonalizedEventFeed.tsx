import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { EventRecommendation, ReasonType, recommendationService } from '@features/events/services/recommendationService';
import { EventCard } from '@features/events/components/events/EventCard';

interface PersonalizedEventFeedProps {
  userId: string;
  limit?: number;
  showReasons?: boolean;
  onEventInteraction?: (eventId: string, interactionType: string) => void;
}

export const PersonalizedEventFeed: React.FC<PersonalizedEventFeedProps> = ({
  userId,
  limit = 10,
  showReasons = true,
  onEventInteraction
}) => {
  const [recommendations, setRecommendations] = useState<EventRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId, limit]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const recs = await recommendationService.getPersonalizedEvents(userId, limit);
      setRecommendations(recs);
    } catch (err) {
      setError('Failed to load personalized recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear cache to force fresh recommendations
    recommendationService.clearAllData();
    await loadRecommendations();
    setRefreshing(false);
  };

  const handleEventClick = (eventId: string) => {
    // Track view interaction
    recommendationService.trackUserInteraction({
      userId,
      eventId,
      type: 'view' as any,
      timestamp: Timestamp.now()
    });

    onEventInteraction?.(eventId, 'view');
  };

  const getReasonIcon = (reasonType: ReasonType): string => {
    switch (reasonType) {
      case ReasonType.SPORT_PREFERENCE: return '🏃‍♂️';
      case ReasonType.SKILL_LEVEL_MATCH: return '🎯';
      case ReasonType.LOCATION_PROXIMITY: return '📍';
      case ReasonType.PAST_PARTICIPATION: return '📈';
      case ReasonType.SOCIAL_CONNECTION: return '👥';
      case ReasonType.TRENDING: return '🔥';
      case ReasonType.TIME_PREFERENCE: return '⏰';
      case ReasonType.ACHIEVEMENT_OPPORTUNITY: return '🏆';
      case ReasonType.SIMILAR_USERS: return '👤';
      default: return '💡';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Recommendations</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadRecommendations}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
        <p className="text-gray-600 mb-4">
          Start participating in events to get personalized recommendations!
        </p>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Recommendations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
          <p className="text-sm text-gray-600 mt-1">
            Based on your interests and activity
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
        >
          <span className={`${refreshing ? 'animate-spin' : ''}`}>🔄</span>
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div key={recommendation.event.id} className="relative">
            {/* Recommendation Score Badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(recommendation.confidence)} bg-white shadow-sm border`}>
                {Math.round(recommendation.confidence * 100)}% match
              </div>
            </div>

            {/* Event Card */}
            <EventCard 
              event={recommendation.event} 
              onClick={handleEventClick}
            />

            {/* Recommendation Reasons */}
            {showReasons && recommendation.reasons.length > 0 && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Why we recommend this:</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.reasons.slice(0, 3).map((reason, reasonIndex) => (
                    <div
                      key={reasonIndex}
                      className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full text-xs text-blue-800 border border-blue-200"
                    >
                      <span>{getReasonIcon(reason.type)}</span>
                      <span>{reason.description}</span>
                    </div>
                  ))}
                  {recommendation.reasons.length > 3 && (
                    <div className="text-xs text-blue-600 px-2 py-1">
                      +{recommendation.reasons.length - 3} more reasons
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ranking indicator */}
            {index < 3 && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  #{index + 1}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {recommendations.length >= limit && (
        <div className="text-center">
          <button
            onClick={() => loadRecommendations()}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Load more recommendations
          </button>
        </div>
      )}
    </div>
  );
};
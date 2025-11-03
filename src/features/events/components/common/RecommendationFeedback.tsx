import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { EventRecommendation, ReasonType, recommendationService, InteractionType } from '@features/events/services/recommendationService';

interface RecommendationFeedbackProps {
  userId: string;
  recommendation: EventRecommendation;
  onFeedbackSubmitted?: (feedback: RecommendationFeedback) => void;
}

export interface RecommendationFeedback {
  eventId: string;
  helpful: boolean;
  reasons: string[];
  comment?: string;
  timestamp: Timestamp;
}

export const RecommendationFeedback: React.FC<RecommendationFeedbackProps> = ({
  userId,
  recommendation,
  onFeedbackSubmitted
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const feedbackReasons = {
    positive: [
      'Matches my interests perfectly',
      'Good timing for me',
      'I like this location',
      'Similar to events I enjoyed',
      'Helps me achieve my goals'
    ],
    negative: [
      'Not interested in this sport',
      'Wrong skill level for me',
      'Location is too far',
      'Bad timing',
      'Already participated in similar events'
    ]
  };

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmitFeedback = async () => {
    if (helpful === null) return;

    const feedback: RecommendationFeedback = {
      eventId: recommendation.event.id,
      helpful,
      reasons: selectedReasons,
      comment: comment.trim(),
      timestamp: Timestamp.now()
    };

    // Track the feedback as an interaction
    await recommendationService.trackUserInteraction({
      userId,
      eventId: recommendation.event.id,
      type: helpful ? InteractionType.BOOKMARK : InteractionType.SKIP,
      timestamp: Timestamp.now(),
      metadata: { feedback }
    });

    setSubmitted(true);
    onFeedbackSubmitted?.(feedback);

    // Hide feedback form after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
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

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-green-400 mr-3">✅</div>
          <div>
            <h4 className="text-sm font-medium text-green-800">Thank you for your feedback!</h4>
            <p className="text-sm text-green-700 mt-1">
              This helps us improve your recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {!showFeedback ? (
        <div className="space-y-3">
          {/* Recommendation Explanation */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Why we recommended this event:
            </h4>
            <div className="space-y-2">
              {recommendation.reasons.map((reason, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-lg">{getReasonIcon(reason.type)}</span>
                  <div>
                    <span className="text-gray-700">{reason.description}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round(reason.weight * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Confidence */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Match Score:</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${recommendation.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(recommendation.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Button */}
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Was this recommendation helpful? 💭
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            Help us improve your recommendations
          </h4>

          {/* Helpful/Not Helpful */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700">Was this recommendation helpful?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setHelpful(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  helpful === true 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } border`}
              >
                <span>👍</span>
                <span>Yes, helpful</span>
              </button>
              <button
                onClick={() => setHelpful(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  helpful === false 
                    ? 'bg-red-100 text-red-800 border-red-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } border`}
              >
                <span>👎</span>
                <span>Not helpful</span>
              </button>
            </div>
          </div>

          {/* Reason Selection */}
          {helpful !== null && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                {helpful ? 'What made it helpful?' : 'What went wrong?'}
              </p>
              <div className="space-y-2">
                {(helpful ? feedbackReasons.positive : feedbackReasons.negative).map((reason) => (
                  <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason)}
                      onChange={() => handleReasonToggle(reason)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm text-gray-700">Additional comments (optional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSubmitFeedback}
              disabled={helpful === null}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
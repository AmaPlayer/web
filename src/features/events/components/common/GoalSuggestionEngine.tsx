import React, { useState, useEffect } from 'react';
import { Goal, UserInsights } from '@features/events/types/user.types';
import { recommendationService } from '@features/events/services/recommendationService';

interface GoalSuggestionEngineProps {
  userId: string;
  onGoalAccept?: (goal: Goal) => void;
  onGoalDismiss?: (goalId: string) => void;
  maxSuggestions?: number;
}

export const GoalSuggestionEngine: React.FC<GoalSuggestionEngineProps> = ({
  userId,
  onGoalAccept,
  onGoalDismiss,
  maxSuggestions = 5
}) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedGoals, setDismissedGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInsights();
  }, [userId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const userInsights = await recommendationService.generateUserInsights(userId);
      setInsights(userInsights);
    } catch (err) {
      setError('Failed to load goal suggestions');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalAccept = (goal: Goal) => {
    onGoalAccept?.(goal);
  };

  const handleGoalDismiss = (goalId: string) => {
    setDismissedGoals(prev => new Set([...prev, goalId]));
    onGoalDismiss?.(goalId);
  };

  const getGoalCategoryIcon = (category: string): string => {
    switch (category) {
      case 'participation': return '🎯';
      case 'achievement': return '🏆';
      case 'social': return '👥';
      case 'skill': return '💪';
      default: return '📋';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Goal Suggestions</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <div className="text-gray-400 text-2xl mb-2">🎯</div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Unable to Load Suggestions</h3>
          <p className="text-xs text-gray-600 mb-3">{error || 'Something went wrong'}</p>
          <button
            onClick={loadInsights}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const availableGoals = insights.suggestedGoals
    .filter(goal => !dismissedGoals.has(goal.id))
    .slice(0, maxSuggestions);

  if (availableGoals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <div className="text-gray-400 text-2xl mb-2">✨</div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">All Caught Up!</h3>
          <p className="text-xs text-gray-600">No new goal suggestions at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Suggested Goals</h3>
          <p className="text-sm text-gray-600">Personalized recommendations to help you grow</p>
        </div>
        <button
          onClick={loadInsights}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-4">
        {availableGoals.map((goal) => (
          <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <span className="text-xl">{getGoalCategoryIcon(goal.category)}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${getDifficultyColor(goal.difficulty)}`}>
                {goal.difficulty}
              </span>
            </div>

            {/* Goal Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{goal.currentValue}/{goal.targetValue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (goal.currentValue / goal.targetValue) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Goal Details */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>Est. time: {goal.estimatedTime}</span>
              {goal.deadline && (
                <span>Due: {goal.deadline.toDate().toLocaleDateString()}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleGoalAccept(goal)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Accept Goal
              </button>
              <button
                onClick={() => handleGoalDismiss(goal.id)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Predictions */}
      {insights.nextAchievements.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-3">Upcoming Achievements</h4>
          <div className="space-y-3">
            {insights.nextAchievements.slice(0, 3).map((achievement) => (
              <div key={achievement.achievementId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏆</span>
                    <div>
                      <div className="text-sm font-medium text-yellow-900">{achievement.name}</div>
                      <div className="text-xs text-yellow-700">
                        Est. {achievement.estimatedDate.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-yellow-900">
                      {Math.round(achievement.probability * 100)}%
                    </div>
                    <div className="text-xs text-yellow-700">likely</div>
                  </div>
                </div>
                {achievement.requiredActions.length > 0 && (
                  <div className="mt-2 text-xs text-yellow-800">
                    Next: {achievement.requiredActions[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
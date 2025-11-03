import React, { useState, useEffect } from 'react';
import { UserInsights, PerformanceTrend, Goal, PredictedAchievement } from '@features/events/types/user.types';
import { recommendationService } from '@features/events/services/recommendationService';
import { ProgressChart } from '@features/events/components/common/ProgressChart';
import { formatTimestampDate } from '@features/events/utils/timestampHelpers';

interface UserInsightsDashboardProps {
  userId: string;
  onGoalSelect?: (goal: Goal) => void;
  onAchievementClick?: (achievement: PredictedAchievement) => void;
}

export const UserInsightsDashboard: React.FC<UserInsightsDashboardProps> = ({
  userId,
  onGoalSelect,
  onAchievementClick
}) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'goals' | 'predictions'>('overview');

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
      setError('Failed to load user insights');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50 border-green-200';
      case 'declining': return 'text-red-600 bg-red-50 border-red-200';
      case 'stable': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const TabButton: React.FC<{ tab: string; label: string; icon: string }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 border-blue-300'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      } border`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Insights</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Insights</h3>
          <p className="text-gray-600 mb-4">{error || 'Something went wrong'}</p>
          <button
            onClick={loadInsights}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Insights</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generated on {formatTimestampDate(insights.generatedAt)}
            </p>
          </div>
          <button
            onClick={loadInsights}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <TabButton tab="overview" label="Overview" icon="📊" />
          <TabButton tab="performance" label="Performance" icon="📈" />
          <TabButton tab="goals" label="Goals" icon="🎯" />
          <TabButton tab="predictions" label="Predictions" icon="🔮" />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Influence Score</p>
                      <p className="text-2xl font-bold text-blue-900">{insights.influenceScore}</p>
                    </div>
                    <div className="text-2xl">🌟</div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Strength Areas</p>
                      <p className="text-2xl font-bold text-green-900">{insights.strengthAreas.length}</p>
                    </div>
                    <div className="text-2xl">💪</div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Goals</p>
                      <p className="text-2xl font-bold text-purple-900">{insights.suggestedGoals.length}</p>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>
                </div>
              </div>

              {/* Collaboration Style */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your Collaboration Style</h3>
                <p className="text-gray-700">{insights.collaborationStyle}</p>
              </div>

              {/* Strength Areas */}
              {insights.strengthAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Your Strengths</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.strengthAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Areas */}
              {insights.improvementAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Growth</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.improvementAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Trends */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
                <div className="space-y-4">
                  {insights.performanceTrends.map((trend, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${getTrendColor(trend.trend)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getTrendIcon(trend.trend)}</span>
                          <div>
                            <h4 className="font-medium capitalize">
                              {trend.metric} - {trend.period}ly
                            </h4>
                            <p className="text-sm opacity-75">
                              {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}% change
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-white rounded-full opacity-75">
                          {trend.trend}
                        </span>
                      </div>
                      {trend.insights.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {trend.insights.map((insight, insightIndex) => (
                            <p key={insightIndex} className="text-sm opacity-90">
                              • {insight}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Patterns */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Patterns</h3>
                <div className="space-y-3">
                  {insights.engagementPatterns.map((pattern, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{pattern.pattern}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pattern.impact === 'high' ? 'bg-red-100 text-red-800' :
                          pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pattern.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Frequency: {pattern.frequency} times
                      </p>
                      <p className="text-sm text-blue-600">{pattern.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Activity Times */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Peak Activity Times</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {insights.peakActivityTimes.slice(0, 6).map((timeSlot, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][timeSlot.dayOfWeek]} at {timeSlot.hour}:00
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Activity level: {timeSlot.activityLevel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Suggested Goals</h3>
                <span className="text-sm text-gray-600">
                  {insights.suggestedGoals.length} goals available
                </span>
              </div>
              
              <div className="space-y-4">
                {insights.suggestedGoals.map((goal, index) => (
                  <div
                    key={goal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => onGoalSelect?.(goal)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getGoalCategoryIcon(goal.category)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="text-xs text-gray-500">
                              Progress: {goal.currentValue}/{goal.targetValue}
                            </div>
                            <div className="text-xs text-gray-500">
                              Est. time: {goal.estimatedTime}
                            </div>
                            {goal.deadline && (
                              <div className="text-xs text-gray-500">
                                Due: {formatTimestampDate(goal.deadline)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(goal.difficulty)}`}>
                        {goal.difficulty}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-6">
              {/* Next Achievements */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Achievements</h3>
                <div className="space-y-4">
                  {insights.nextAchievements.map((achievement, index) => (
                    <div
                      key={achievement.achievementId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors cursor-pointer"
                      onClick={() => onAchievementClick?.(achievement)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Estimated: {formatTimestampDate(achievement.estimatedDate)}
                            </p>
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Required actions:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {achievement.requiredActions.map((action, actionIndex) => (
                                  <li key={actionIndex}>• {action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">
                            {Math.round(achievement.probability * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">probability</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Progression */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Progression</h3>
                <div className="space-y-4">
                  {insights.skillProgression.map((prediction, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{prediction.sport}</h4>
                        <span className="text-sm text-blue-600 font-medium">
                          {prediction.timeframe}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Current</div>
                          <div className="text-sm font-medium capitalize">{prediction.currentLevel}</div>
                        </div>
                        <div className="flex-1 flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${prediction.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Predicted</div>
                          <div className="text-sm font-medium capitalize">{prediction.predictedLevel}</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Factors:</span> {prediction.factors.join(', ')}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Confidence: {Math.round(prediction.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
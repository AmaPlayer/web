import React, { useState, useEffect } from 'react';
import { UserInsights, ProgressMetric } from '@features/events/types/user.types';
import { recommendationService } from '@features/events/services/recommendationService';
import { ProgressChart } from '@features/events/components/common/ProgressChart';
import { formatTimestampDate } from '@features/events/utils/timestampHelpers';

interface PersonalizedPerformanceReportProps {
  userId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onExport?: (reportData: any) => void;
}

interface PerformanceMetrics {
  engagementScore: number;
  participationRate: number;
  achievementCount: number;
  socialConnections: number;
  skillImprovement: number;
  consistencyScore: number;
}

export const PersonalizedPerformanceReport: React.FC<PersonalizedPerformanceReportProps> = ({
  userId,
  timeRange = 'month',
  onExport
}) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadPerformanceData();
  }, [userId, timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInsights = await recommendationService.generateUserInsights(userId);
      setInsights(userInsights);
      
      // Calculate performance metrics
      const performanceMetrics = calculatePerformanceMetrics(userInsights);
      setMetrics(performanceMetrics);
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Error loading performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = (insights: UserInsights): PerformanceMetrics => {
    // Mock calculations - in real implementation, these would be based on actual user data
    return {
      engagementScore: Math.min(100, insights.influenceScore * 1.2),
      participationRate: Math.random() * 100,
      achievementCount: insights.nextAchievements.length * 3,
      socialConnections: insights.networkGrowth.length > 0 ? insights.networkGrowth[insights.networkGrowth.length - 1].connections : 0,
      skillImprovement: insights.skillProgression.reduce((avg, skill) => avg + skill.confidence, 0) / insights.skillProgression.length * 100,
      consistencyScore: insights.engagementPatterns.length > 0 ? 
        insights.engagementPatterns.reduce((avg, pattern) => avg + pattern.frequency, 0) / insights.engagementPatterns.length * 10 : 50
    };
  };

  const getMetricIcon = (metric: string): string => {
    switch (metric) {
      case 'engagement': return '🎯';
      case 'participation': return '🏃‍♂️';
      case 'achievements': return '🏆';
      case 'social': return '👥';
      case 'skills': return '💪';
      case 'consistency': return '📈';
      default: return '📊';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'D';
  };

  const generateRecommendations = (metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.participationRate < 50) {
      recommendations.push('Try participating in more events to boost your activity score');
    }
    
    if (metrics.socialConnections < 10) {
      recommendations.push('Connect with more athletes to expand your network');
    }
    
    if (metrics.consistencyScore < 60) {
      recommendations.push('Maintain regular activity to improve your consistency score');
    }
    
    if (metrics.achievementCount < 5) {
      recommendations.push('Focus on completing challenges to earn more achievements');
    }
    
    return recommendations;
  };

  const exportReport = () => {
    if (!insights || !metrics) return;
    
    const reportData = {
      userId,
      timeRange,
      generatedAt: new Date(),
      metrics,
      insights: {
        performanceTrends: insights.performanceTrends,
        strengthAreas: insights.strengthAreas,
        improvementAreas: insights.improvementAreas,
        collaborationStyle: insights.collaborationStyle
      },
      recommendations: generateRecommendations(metrics)
    };
    
    onExport?.(reportData);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance Report</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !insights || !metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Generate Report</h3>
          <p className="text-gray-600 mb-4">{error || 'Something went wrong'}</p>
          <button
            onClick={loadPerformanceData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const recommendations = generateRecommendations(metrics);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance Report</h2>
            <p className="text-sm text-gray-600 mt-1">
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly analysis • Generated {formatTimestampDate(insights.generatedAt)}
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={() => {/* Handle time range change */}}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={exportReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              📄 Export
            </button>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-900 mb-2">
              {getScoreGrade(metrics.engagementScore)}
            </div>
            <div className="text-lg font-medium text-blue-800 mb-1">Overall Performance</div>
            <div className="text-sm text-blue-600">
              {metrics.engagementScore.toFixed(1)}/100 points
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className={`border rounded-lg p-4 ${getScoreColor(metrics.engagementScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getMetricIcon('engagement')}</span>
              <span className="text-2xl font-bold">{metrics.engagementScore.toFixed(0)}</span>
            </div>
            <div className="text-sm font-medium">Engagement Score</div>
            <div className="text-xs opacity-75 mt-1">Your overall activity level</div>
          </div>

          <div className={`border rounded-lg p-4 ${getScoreColor(metrics.participationRate)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getMetricIcon('participation')}</span>
              <span className="text-2xl font-bold">{metrics.participationRate.toFixed(0)}%</span>
            </div>
            <div className="text-sm font-medium">Participation Rate</div>
            <div className="text-xs opacity-75 mt-1">Events joined vs available</div>
          </div>

          <div className={`border rounded-lg p-4 ${getScoreColor(metrics.achievementCount * 10)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getMetricIcon('achievements')}</span>
              <span className="text-2xl font-bold">{metrics.achievementCount}</span>
            </div>
            <div className="text-sm font-medium">Achievements</div>
            <div className="text-xs opacity-75 mt-1">Badges and milestones earned</div>
          </div>

          <div className={`border rounded-lg p-4 ${getScoreColor(metrics.socialConnections * 5)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getMetricIcon('social')}</span>
              <span className="text-2xl font-bold">{metrics.socialConnections}</span>
            </div>
            <div className="text-sm font-medium">Connections</div>
            <div className="text-xs opacity-75 mt-1">Network size and growth</div>
          </div>

          <div className={`border rounded-lg p-4 ${getScoreColor(metrics.skillImprovement)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getMetricIcon('skills')}</span>
              <span className="text-2xl font-bold">{metrics.skillImprovement.toFixed(0)}%</span>
            </div>
            <div className="text-sm font-medium">Skill Growth</div>
            <div className="text-xs opacity-75 mt-1">Improvement across sports</div>
          </div>

          <div className={`border rounded-lg p-4 ${getScoreColor(metrics.consistencyScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getMetricIcon('consistency')}</span>
              <span className="text-2xl font-bold">{metrics.consistencyScore.toFixed(0)}</span>
            </div>
            <div className="text-sm font-medium">Consistency</div>
            <div className="text-xs opacity-75 mt-1">Regular activity pattern</div>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <ProgressChart
              userId={userId}
              metrics={[ProgressMetric.ENGAGEMENT_SCORE]}
              days={30}
              height={200}
            />
          </div>
        </div>

        {/* Strengths and Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Your Strengths</h3>
            <div className="space-y-2">
              {insights.strengthAreas.length > 0 ? (
                insights.strengthAreas.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Keep participating to discover your strengths!</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Growth</h3>
            <div className="space-y-2">
              {insights.improvementAreas.length > 0 ? (
                insights.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="text-yellow-500">⚡</span>
                    <span className="text-gray-700">{area}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">You're doing great across all areas!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Recommendations for Improvement</h3>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <span className="text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration Style */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Your Collaboration Style</h3>
          <p className="text-purple-800">{insights.collaborationStyle}</p>
        </div>
      </div>
    </div>
  );
};
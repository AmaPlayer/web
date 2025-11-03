import React, { useState, useEffect } from 'react';
import { UserPreferences, SkillLevel } from '@features/events/types/user.types';
import { recommendationService } from '@features/events/services/recommendationService';

interface PreferenceManagerProps {
  userId: string;
  initialPreferences?: Partial<UserPreferences>;
  onPreferencesUpdated?: (preferences: UserPreferences) => void;
}

const SPORTS_OPTIONS = [
  'Basketball', 'Soccer', 'Tennis', 'Volleyball', 'Athletics', 'Swimming',
  'Baseball', 'Football', 'Hockey', 'Golf', 'Boxing', 'Wrestling',
  'Cycling', 'Running', 'Gymnastics', 'Martial Arts'
];

const SKILL_LEVELS = [
  { value: SkillLevel.BEGINNER, label: 'Beginner', description: 'Just starting out' },
  { value: SkillLevel.INTERMEDIATE, label: 'Intermediate', description: 'Some experience' },
  { value: SkillLevel.ADVANCED, label: 'Advanced', description: 'Experienced player' },
  { value: SkillLevel.PROFESSIONAL, label: 'Professional', description: 'Competing professionally' },
  { value: SkillLevel.ELITE, label: 'Elite', description: 'Top-level athlete' }
];

export const PreferenceManager: React.FC<PreferenceManagerProps> = ({
  userId,
  initialPreferences,
  onPreferencesUpdated
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredSports: [],
    skillLevelFilter: [SkillLevel.INTERMEDIATE],
    locationRadius: 25,
    gamificationEnabled: true,
    competitiveMode: true,
    mentorshipAvailable: true,
    teamParticipation: true,
    showRealTimeUpdates: true,
    showAchievementAnimations: true,
    showLeaderboards: true,
    showProgressTracking: true,
    allowDirectMessages: true,
    allowMentorshipRequests: true,
    allowTeamInvitations: true,
    personalizedRecommendations: true,
    challengeRecommendations: true,
    eventRecommendations: true,
    socialRecommendations: true,
    ...initialPreferences
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'sports' | 'engagement' | 'social' | 'recommendations'>('sports');

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(prev => ({ ...prev, ...initialPreferences }));
    }
  }, [initialPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would save to backend
      // For now, we'll just trigger the callback
      onPreferencesUpdated?.(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleSport = (sport: string) => {
    const newSports = preferences.preferredSports.includes(sport)
      ? preferences.preferredSports.filter(s => s !== sport)
      : [...preferences.preferredSports, sport];
    updatePreference('preferredSports', newSports);
  };

  const toggleSkillLevel = (level: SkillLevel) => {
    const newLevels = preferences.skillLevelFilter.includes(level)
      ? preferences.skillLevelFilter.filter(l => l !== level)
      : [...preferences.skillLevelFilter, level];
    updatePreference('skillLevelFilter', newLevels);
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

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: (enabled: boolean) => void;
    label: string;
    description?: string;
  }> = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize your experience and recommendations
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } border ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <TabButton tab="sports" label="Sports & Skills" icon="🏃‍♂️" />
          <TabButton tab="engagement" label="Engagement" icon="🎯" />
          <TabButton tab="social" label="Social" icon="👥" />
          <TabButton tab="recommendations" label="Recommendations" icon="💡" />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'sports' && (
            <div className="space-y-6">
              {/* Preferred Sports */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preferred Sports</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select the sports you're most interested in
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {SPORTS_OPTIONS.map(sport => (
                    <button
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                        preferences.preferredSports.includes(sport)
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill Level Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Skill Level Interest</h3>
                <p className="text-sm text-gray-600 mb-4">
                  What skill levels are you interested in competing with?
                </p>
                <div className="space-y-3">
                  {SKILL_LEVELS.map(level => (
                    <label key={level.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.skillLevelFilter.includes(level.value)}
                        onChange={() => toggleSkillLevel(level.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{level.label}</div>
                        <div className="text-xs text-gray-500">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Radius */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Location Radius</h3>
                <p className="text-sm text-gray-600 mb-4">
                  How far are you willing to travel for events?
                </p>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={preferences.locationRadius}
                    onChange={(e) => updatePreference('locationRadius', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>5 km</span>
                    <span className="font-medium text-blue-600">{preferences.locationRadius} km</span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Engagement Features</h3>
              
              <ToggleSwitch
                enabled={preferences.gamificationEnabled}
                onChange={(enabled) => updatePreference('gamificationEnabled', enabled)}
                label="Gamification"
                description="Enable badges, achievements, and progress tracking"
              />
              
              <ToggleSwitch
                enabled={preferences.competitiveMode}
                onChange={(enabled) => updatePreference('competitiveMode', enabled)}
                label="Competitive Mode"
                description="Show leaderboards and competitive challenges"
              />
              
              <ToggleSwitch
                enabled={preferences.showRealTimeUpdates}
                onChange={(enabled) => updatePreference('showRealTimeUpdates', enabled)}
                label="Real-time Updates"
                description="Get live activity feeds and notifications"
              />
              
              <ToggleSwitch
                enabled={preferences.showAchievementAnimations}
                onChange={(enabled) => updatePreference('showAchievementAnimations', enabled)}
                label="Achievement Animations"
                description="Show celebration animations for achievements"
              />
              
              <ToggleSwitch
                enabled={preferences.showLeaderboards}
                onChange={(enabled) => updatePreference('showLeaderboards', enabled)}
                label="Leaderboards"
                description="Display ranking and leaderboard information"
              />
              
              <ToggleSwitch
                enabled={preferences.showProgressTracking}
                onChange={(enabled) => updatePreference('showProgressTracking', enabled)}
                label="Progress Tracking"
                description="Track and display your progress over time"
              />
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Social Features</h3>
              
              <ToggleSwitch
                enabled={preferences.mentorshipAvailable}
                onChange={(enabled) => updatePreference('mentorshipAvailable', enabled)}
                label="Mentorship"
                description="Participate in mentorship programs"
              />
              
              <ToggleSwitch
                enabled={preferences.teamParticipation}
                onChange={(enabled) => updatePreference('teamParticipation', enabled)}
                label="Team Participation"
                description="Join team-based events and challenges"
              />
              
              <ToggleSwitch
                enabled={preferences.allowDirectMessages}
                onChange={(enabled) => updatePreference('allowDirectMessages', enabled)}
                label="Direct Messages"
                description="Allow other users to send you messages"
              />
              
              <ToggleSwitch
                enabled={preferences.allowMentorshipRequests}
                onChange={(enabled) => updatePreference('allowMentorshipRequests', enabled)}
                label="Mentorship Requests"
                description="Allow others to request mentorship from you"
              />
              
              <ToggleSwitch
                enabled={preferences.allowTeamInvitations}
                onChange={(enabled) => updatePreference('allowTeamInvitations', enabled)}
                label="Team Invitations"
                description="Allow others to invite you to teams"
              />
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recommendation Settings</h3>
              
              <ToggleSwitch
                enabled={preferences.personalizedRecommendations}
                onChange={(enabled) => updatePreference('personalizedRecommendations', enabled)}
                label="Personalized Recommendations"
                description="Get recommendations based on your activity and preferences"
              />
              
              <ToggleSwitch
                enabled={preferences.eventRecommendations}
                onChange={(enabled) => updatePreference('eventRecommendations', enabled)}
                label="Event Recommendations"
                description="Receive suggestions for events you might like"
              />
              
              <ToggleSwitch
                enabled={preferences.challengeRecommendations}
                onChange={(enabled) => updatePreference('challengeRecommendations', enabled)}
                label="Challenge Recommendations"
                description="Get notified about relevant challenges"
              />
              
              <ToggleSwitch
                enabled={preferences.socialRecommendations}
                onChange={(enabled) => updatePreference('socialRecommendations', enabled)}
                label="Social Recommendations"
                description="Discover potential mentors and team members"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
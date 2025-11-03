import React, { useState, useEffect } from 'react';
import { AthleteProfile, AthleteStats, ProgressEntry, ProgressMetric } from '@features/events/types/user.types';
import { Achievement } from '@features/events/types/engagement.types';

import { StatsDashboard } from '@features/events/components/common/StatsDashboard';
import { ProgressChart } from '@features/events/components/common/ProgressChart';
import { MentorshipManagement } from '@features/events/components/common/MentorshipManagement';
import { TeamManagement } from '@features/events/components/common/TeamManagement';
import { achievementEngine } from '@features/events/services/achievementEngine';
import { statisticsService } from '@features/events/services/statisticsService';
import { useAuth } from '@contexts/AuthContext';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';



interface AthleteProfilePageProps {
  userId: string;
  isOwnProfile?: boolean;
  onBack?: () => void;
}

/**
 * AthleteProfilePage Component
 * Comprehensive athlete profile with achievements, statistics, and management sections
 * Requirements: 2.4, 6.3, 8.1, 9.2
 */
export const AthleteProfilePage: React.FC<AthleteProfilePageProps> = ({
  userId,
  isOwnProfile = false,
  onBack
}) => {
  // Get authentication and preferences from main app contexts
  const { currentUser } = useAuth();
  const { t, isDarkMode } = useAppPreferences();
  
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'stats' | 'mentorship' | 'teams'>('overview');

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load basic profile data (mock implementation)
      const profileData: AthleteProfile = {
        id: userId,
        basicInfo: {
          id: userId,
          name: `Athlete ${userId}`,
          email: `athlete${userId}@example.com`,
          avatar: `/avatars/athlete_${userId}.jpg`,
          bio: 'Passionate athlete dedicated to excellence and continuous improvement.',
          location: 'New York, NY',
          timezone: 'America/New_York',
          primarySports: ['Basketball', 'Soccer', 'Tennis'],
          skillLevel: 'intermediate' as any,
          verified: Math.random() > 0.5
        },
        achievements: [],
        badges: [],
        engagementScore: 1250,
        level: 5,
        experiencePoints: 1250,
        nextLevelPoints: 1500,
        stats: {} as AthleteStats,
        progressHistory: [],
        streaks: [],
        mentorships: [],
        teamMemberships: [],
        followingIds: [],
        followerIds: [],
        preferences: {} as any,
        notifications: {} as any,
        privacy: {} as any,
        lastActive: new Date() as any,
        joinedAt: new Date('2023-01-15') as any,
        isOnline: true
      };
      setProfile(profileData);

      // Load athlete statistics
      const statsData = await statisticsService.getUserStatistics(userId);
      setStats(statsData);

      // Load achievements
      const userAchievements = await achievementEngine.getUserAchievementsAsync(userId);
      setAchievements(userAchievements);

      // Load progress data - simplified for now
      setProgressData([]);

      // Additional profile data loaded successfully

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (date: any) => {
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getDisplayName = () => profile?.basicInfo.name || 'Athlete';
  const getAvatar = () => profile?.basicInfo.avatar;
  const getBio = () => profile?.basicInfo.bio;
  const getLocation = () => profile?.basicInfo.location;
  const isVerified = () => profile?.basicInfo.verified || false;
  const getPrimarySports = () => profile?.basicInfo.primarySports || [];
  const getSkillLevel = () => profile?.basicInfo.skillLevel || 'beginner';

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#6b7280',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getSkillLevelIcon = (level: string) => {
    const icons = {
      beginner: '🌱',
      intermediate: '⭐',
      advanced: '🏆',
      expert: '👑'
    };
    return icons[level as keyof typeof icons] || '⭐';
  };

  if (loading) {
    return (
      <div className={`athlete-profile-page loading ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="loading-spinner"></div>
        <p>{t('loadingProfile') || 'Loading profile...'}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`athlete-profile-page error ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <h2>{t('errorLoadingProfile') || 'Error Loading Profile'}</h2>
        <p>{error || t('profileNotFound') || 'Profile not found'}</p>
        {onBack && (
          <button onClick={onBack} className="button button-primary">
            {t('goBack') || 'Go Back'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`athlete-profile-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="back-button"
          aria-label={t('goBack') || 'Go back'}
        >
          <span aria-hidden="true">←</span> {t('back') || 'Back'}
        </button>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-hero">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {getAvatar() ? (
                <img src={getAvatar()} alt={`${getDisplayName()}'s avatar`} />
              ) : (
                <div className="avatar-placeholder">
                  <span>{getDisplayName().charAt(0).toUpperCase()}</span>
                </div>
              )}
              {isVerified() && (
                <div className="verified-badge" title="Verified Athlete">
                  ✓
                </div>
              )}
            </div>
            
            {isOwnProfile && (
              <button className="edit-profile-btn">
                {t('editProfile') || 'Edit Profile'}
              </button>
            )}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{getDisplayName()}</h1>
            <p className="profile-username">@{profile.basicInfo.name.toLowerCase().replace(/\s+/g, '_')}</p>
            
            {getBio() && (
              <p className="profile-bio">{getBio()}</p>
            )}

            <div className="profile-meta">
              {getLocation() && (
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{getLocation()}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span>Joined {formatJoinDate(profile.joinedAt)}</span>
              </div>
            </div>

            {/* Sports and skill levels */}
            <div className="profile-sports">
              <h3>{t('sportsAndSkills') || 'Sports & Skills'}</h3>
              <div className="sports-list">
                {getPrimarySports().map((sport) => (
                  <div key={sport} className="sport-item">
                    <span className="sport-name">{sport}</span>
                    <span className="skill-level">
                      {getSkillLevelIcon(getSkillLevel())}
                      {getSkillLevel()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social links placeholder */}
            <div className="profile-social">
              <button className="social-link instagram" onClick={() => {}}>
                📷 Instagram
              </button>
              <button className="social-link twitter" onClick={() => {}}>
                🐦 Twitter
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="profile-quick-stats">
            <div className="quick-stat">
              <span className="stat-value">{stats.eventsJoined}</span>
              <span className="stat-label">{t('events') || 'Events'}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">{achievements.length}</span>
              <span className="stat-label">{t('achievements') || 'Achievements'}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">{stats.challengesCompleted}</span>
              <span className="stat-label">{t('challenges') || 'Challenges'}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">{stats.currentStreak}</span>
              <span className="stat-label">{t('dayStreak') || 'Day Streak'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <div className="tab-buttons" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('overview') || 'Overview'}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'achievements'}
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            {t('achievements') || 'Achievements'} ({achievements.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'stats'}
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            {t('statistics') || 'Statistics'}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'mentorship'}
            className={`tab-button ${activeTab === 'mentorship' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentorship')}
          >
            {t('mentorship') || 'Mentorship'}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'teams'}
            className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            {t('teams') || 'Teams'}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="tab-panel overview-panel" role="tabpanel">
              {/* Recent achievements */}
              <section className="profile-section">
                <h2 className="section-title">🏆 {t('recentAchievements') || 'Recent Achievements'}</h2>
                {achievements.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('noAchievementsYet') || 'No achievements yet. Start participating in events to earn your first achievement!'}</p>
                  </div>
                ) : (
                  <div className="achievements-preview">
                    {achievements.slice(0, 6).map((achievement) => (
                      <div key={achievement.id} className="achievement-item">
                        <div className="achievement-icon">
                          {achievement.iconUrl ? (
                            <img src={achievement.iconUrl} alt={achievement.name} />
                          ) : (
                            <span style={{ color: getRarityColor(achievement.rarity) }}>
                              🏅
                            </span>
                          )}
                        </div>
                        <div className="achievement-info">
                          <h4>{achievement.name}</h4>
                          <p>{achievement.description}</p>
                          <span className={`rarity-badge ${achievement.rarity}`}>
                            {achievement.rarity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Progress chart */}
              {progressData.length > 0 && (
                <section className="profile-section">
                  <h2 className="section-title">📈 {t('progressTracking') || 'Progress Tracking'}</h2>
                  <ProgressChart
                    userId={userId}
                    metrics={[ProgressMetric.ENGAGEMENT_SCORE]}
                  />
                </section>
              )}

              {/* Activity summary */}
              {stats && (
                <section className="profile-section">
                  <h2 className="section-title">📊 {t('activitySummary') || 'Activity Summary'}</h2>
                  <div className="activity-grid">
                    <div className="activity-item">
                      <span className="activity-icon">🎯</span>
                      <div className="activity-details">
                        <span className="activity-value">{stats.participationRate}%</span>
                        <span className="activity-label">{t('participationRate') || 'Participation Rate'}</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <span className="activity-icon">🏆</span>
                      <div className="activity-details">
                        <span className="activity-value">{stats.challengeWinRate.toFixed(1)}%</span>
                        <span className="activity-label">{t('challengeWinRate') || 'Challenge Win Rate'}</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <span className="activity-icon">❤️</span>
                      <div className="activity-details">
                        <span className="activity-value">{stats.reactionsReceived}</span>
                        <span className="activity-label">{t('reactionsReceived') || 'Reactions Received'}</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <span className="activity-icon">🔥</span>
                      <div className="activity-details">
                        <span className="activity-value">{stats.longestStreak}</span>
                        <span className="activity-label">{t('longestStreak') || 'Longest Streak'}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="tab-panel achievements-panel" role="tabpanel">
              <section className="profile-section">
                <h2 className="section-title">🏆 {t('allAchievements') || 'All Achievements'}</h2>
                {achievements.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('noAchievementsEarned') || 'No achievements earned yet.'}</p>
                    <p>{t('earnAchievementsPrompt') || 'Participate in events, complete challenges, and engage with the community to earn achievements!'}</p>
                  </div>
                ) : (
                  <div className="achievements-grid">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="achievement-card">
                        <div className="achievement-header">
                          <div className="achievement-icon-large">
                            {achievement.iconUrl ? (
                              <img src={achievement.iconUrl} alt={achievement.name} />
                            ) : (
                              <span style={{ color: getRarityColor(achievement.rarity) }}>
                                🏅
                              </span>
                            )}
                          </div>
                          <span className={`rarity-badge ${achievement.rarity}`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        <div className="achievement-content">
                          <h3>{achievement.name}</h3>
                          <p>{achievement.description}</p>
                          <div className="achievement-meta">
                            <span className="points">+{achievement.points} {t('points') || 'points'}</span>
                            {achievement.unlockedAt && (
                              <span className="unlock-date">
                                {t('earned') || 'Earned'} {(() => {
                                  const date = achievement.unlockedAt as any;
                                  const dateObj = date?.toDate ? date.toDate() : new Date(date);
                                  return dateObj.toLocaleDateString();
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="tab-panel stats-panel" role="tabpanel">
              <section className="profile-section">
                <h2 className="section-title">📊 {t('detailedStatistics') || 'Detailed Statistics'}</h2>
                <StatsDashboard
                  userId={userId}
                />
              </section>
            </div>
          )}

          {activeTab === 'mentorship' && (
            <div className="tab-panel mentorship-panel" role="tabpanel">
              <section className="profile-section">
                <h2 className="section-title">🤝 {t('mentorship') || 'Mentorship'}</h2>
                <MentorshipManagement
                  userId={userId}
                  userName={getDisplayName()}
                />
              </section>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="tab-panel teams-panel" role="tabpanel">
              <section className="profile-section">
                <h2 className="section-title">👥 {t('teamManagement') || 'Team Management'}</h2>
                <TeamManagement
                  userId={userId}
                  userName={getDisplayName()}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfilePage;
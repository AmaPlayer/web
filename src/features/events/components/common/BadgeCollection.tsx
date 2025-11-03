import React, { useState } from 'react';
import { Achievement } from '@features/events/types/engagement.types';
import BadgeDisplay from '@features/events/components/common/BadgeDisplay';
import { useAppPreferences } from '@contexts/UnifiedPreferencesContext';

interface BadgeCollectionProps {
  achievements: Achievement[];
  title?: string;
  maxVisible?: number;
  showFilters?: boolean;
  showStats?: boolean;
  className?: string;
}

type FilterType = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
type SortType = 'recent' | 'rarity' | 'points' | 'name';

/**
 * BadgeCollection Component
 * Displays a collection of achievement badges with filtering and sorting
 * Requirements: 2.4 - Badge collection and profile display
 */
export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  achievements,
  title = 'Achievements',
  maxVisible = 12,
  showFilters = true,
  showStats = true,
  className = ''
}) => {
  const { t } = useAppPreferences();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [showAll, setShowAll] = useState(false);

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'all') return true;
    return achievement.rarity === filter;
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sort) {
      case 'recent':
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return b.unlockedAt.toMillis() - a.unlockedAt.toMillis();
      case 'rarity':
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
      case 'points':
        return b.points - a.points;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Limit visible achievements
  const visibleAchievements = showAll 
    ? sortedAchievements 
    : sortedAchievements.slice(0, maxVisible);

  // Calculate stats
  const stats = {
    total: achievements.length,
    common: achievements.filter(a => a.rarity === 'common').length,
    rare: achievements.filter(a => a.rarity === 'rare').length,
    epic: achievements.filter(a => a.rarity === 'epic').length,
    legendary: achievements.filter(a => a.rarity === 'legendary').length,
    totalPoints: achievements.reduce((sum, a) => sum + a.points, 0)
  };

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'all') return achievements.length;
    return achievements.filter(a => a.rarity === filterType).length;
  };

  return (
    <div className={`badge-collection ${className}`}>
      {/* Header */}
      <div className="collection-header">
        <h3 className="collection-title">{title}</h3>
        {showStats && (
          <div className="collection-stats">
            <span className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">{t('total')}</span>
            </span>
            <span className="stat-item">
              <span className="stat-value">{stats.totalPoints}</span>
              <span className="stat-label">{t('points')}</span>
            </span>
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      {showFilters && (
        <div className="collection-controls">
          <div className="filter-tabs">
            {(['all', 'legendary', 'epic', 'rare', 'common'] as FilterType[]).map(filterType => (
              <button
                key={filterType}
                className={`filter-tab ${filter === filterType ? 'active' : ''}`}
                onClick={() => setFilter(filterType)}
                aria-pressed={filter === filterType}
              >
                <span className="filter-label">
                  {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </span>
                <span className="filter-count">({getFilterCount(filterType)})</span>
              </button>
            ))}
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-select" className="sort-label">{t('sortBy')}:</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="sort-select"
            >
              <option value="recent">{t('mostRecent')}</option>
              <option value="rarity">{t('rarity')}</option>
              <option value="points">{t('points')}</option>
              <option value="name">{t('name')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      {visibleAchievements.length > 0 ? (
        <div className="achievements-grid">
          {visibleAchievements.map((achievement) => (
            <BadgeDisplay
              key={achievement.id}
              achievement={achievement}
              size="medium"
              showAnimation={true}
              showTooltip={true}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🏅</div>
          <h4 className="empty-title">{t('noAchievements')}</h4>
          <p className="empty-description">
            {filter === 'all' 
              ? t('startParticipating')
              : `No ${filter} achievements yet`
            }
          </p>
        </div>
      )}

      {/* Show More/Less Button */}
      {sortedAchievements.length > maxVisible && (
        <div className="collection-actions">
          <button
            className="btn-secondary show-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll 
              ? t('showLess')
              : `Show ${sortedAchievements.length - maxVisible} More`
            }
          </button>
        </div>
      )}

      {/* Rarity Legend */}
      {showStats && achievements.length > 0 && (
        <div className="rarity-legend">
          <h4 className="legend-title">{t('rarityBreakdown')}</h4>
          <div className="legend-items">
            {stats.legendary > 0 && (
              <div className="legend-item legendary">
                <span className="legend-icon">👑</span>
                <span className="legend-label">{t('legendary')}</span>
                <span className="legend-count">{stats.legendary}</span>
              </div>
            )}
            {stats.epic > 0 && (
              <div className="legend-item epic">
                <span className="legend-icon">🥇</span>
                <span className="legend-label">{t('epic')}</span>
                <span className="legend-count">{stats.epic}</span>
              </div>
            )}
            {stats.rare > 0 && (
              <div className="legend-item rare">
                <span className="legend-icon">🥈</span>
                <span className="legend-label">{t('rare')}</span>
                <span className="legend-count">{stats.rare}</span>
              </div>
            )}
            {stats.common > 0 && (
              <div className="legend-item common">
                <span className="legend-icon">🥉</span>
                <span className="legend-label">{t('common')}</span>
                <span className="legend-count">{stats.common}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;
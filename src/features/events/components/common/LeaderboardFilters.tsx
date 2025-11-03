import React from 'react';
import { LeaderboardType, LeaderboardPeriod } from '@features/events/types/engagement.types';

interface LeaderboardFiltersProps {
  selectedType: LeaderboardType;
  selectedPeriod: LeaderboardPeriod;
  onTypeChange: (type: LeaderboardType) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  availableTypes?: LeaderboardType[];
  availablePeriods?: LeaderboardPeriod[];
  showTypeFilter?: boolean;
  showPeriodFilter?: boolean;
  layout?: 'horizontal' | 'vertical' | 'tabs';
  className?: string;
}

export const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({
  selectedType,
  selectedPeriod,
  onTypeChange,
  onPeriodChange,
  availableTypes = Object.values(LeaderboardType),
  availablePeriods = Object.values(LeaderboardPeriod),
  showTypeFilter = true,
  showPeriodFilter = true,
  layout = 'horizontal',
  className = ''
}) => {
  const getTypeLabel = (type: LeaderboardType): string => {
    const labels = {
      [LeaderboardType.ENGAGEMENT_SCORE]: 'Engagement',
      [LeaderboardType.PARTICIPATION]: 'Participation',
      [LeaderboardType.ACHIEVEMENTS]: 'Achievements',
      [LeaderboardType.CHALLENGE_WINS]: 'Challenges',
      [LeaderboardType.SOCIAL_IMPACT]: 'Social Impact',
      [LeaderboardType.TEAM_PERFORMANCE]: 'Team Performance'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: LeaderboardType): string => {
    const icons = {
      [LeaderboardType.ENGAGEMENT_SCORE]: '⚡',
      [LeaderboardType.PARTICIPATION]: '🎯',
      [LeaderboardType.ACHIEVEMENTS]: '🏆',
      [LeaderboardType.CHALLENGE_WINS]: '🥇',
      [LeaderboardType.SOCIAL_IMPACT]: '🤝',
      [LeaderboardType.TEAM_PERFORMANCE]: '👥'
    };
    return icons[type] || '📊';
  };

  const getPeriodLabel = (period: LeaderboardPeriod): string => {
    const labels = {
      [LeaderboardPeriod.DAILY]: 'Today',
      [LeaderboardPeriod.WEEKLY]: 'This Week',
      [LeaderboardPeriod.MONTHLY]: 'This Month',
      [LeaderboardPeriod.ALL_TIME]: 'All Time',
      [LeaderboardPeriod.EVENT_SPECIFIC]: 'Event'
    };
    return labels[period] || period;
  };

  const getPeriodIcon = (period: LeaderboardPeriod): string => {
    const icons = {
      [LeaderboardPeriod.DAILY]: '📅',
      [LeaderboardPeriod.WEEKLY]: '📆',
      [LeaderboardPeriod.MONTHLY]: '🗓️',
      [LeaderboardPeriod.ALL_TIME]: '⏰',
      [LeaderboardPeriod.EVENT_SPECIFIC]: '🎪'
    };
    return icons[period] || '📊';
  };

  const renderTypeFilter = () => {
    if (!showTypeFilter) return null;

    if (layout === 'tabs') {
      return (
        <div className="filter-tabs type-tabs" role="tablist" aria-label="Leaderboard categories">
          {availableTypes.map((type) => (
            <button
              key={type}
              role="tab"
              aria-selected={selectedType === type}
              aria-controls={`leaderboard-${type}`}
              className={`filter-tab ${selectedType === type ? 'active' : ''}`}
              onClick={() => onTypeChange(type)}
            >
              <span className="tab-icon" aria-hidden="true">{getTypeIcon(type)}</span>
              <span className="tab-label">{getTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="filter-group type-filter">
        <label htmlFor="type-select" className="filter-label">
          <span className="label-icon" aria-hidden="true">📊</span>
          Category
        </label>
        <select
          id="type-select"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as LeaderboardType)}
          className="filter-select"
          aria-label="Select leaderboard category"
        >
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {getTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderPeriodFilter = () => {
    if (!showPeriodFilter) return null;

    if (layout === 'tabs') {
      return (
        <div className="filter-tabs period-tabs" role="tablist" aria-label="Time periods">
          {availablePeriods.map((period) => (
            <button
              key={period}
              role="tab"
              aria-selected={selectedPeriod === period}
              aria-controls={`leaderboard-${period}`}
              className={`filter-tab ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => onPeriodChange(period)}
            >
              <span className="tab-icon" aria-hidden="true">{getPeriodIcon(period)}</span>
              <span className="tab-label">{getPeriodLabel(period)}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="filter-group period-filter">
        <label htmlFor="period-select" className="filter-label">
          <span className="label-icon" aria-hidden="true">⏰</span>
          Period
        </label>
        <select
          id="period-select"
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value as LeaderboardPeriod)}
          className="filter-select"
          aria-label="Select time period"
        >
          {availablePeriods.map((period) => (
            <option key={period} value={period}>
              {getPeriodLabel(period)}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className={`leaderboard-filters ${layout} ${className}`}>
      {layout === 'vertical' ? (
        <div className="filters-vertical">
          {renderTypeFilter()}
          {renderPeriodFilter()}
        </div>
      ) : layout === 'tabs' ? (
        <div className="filters-tabs">
          {renderTypeFilter()}
          {renderPeriodFilter()}
        </div>
      ) : (
        <div className="filters-horizontal">
          {renderTypeFilter()}
          {renderPeriodFilter()}
        </div>
      )}
    </div>
  );
};

// Quick filter buttons component for common combinations
interface QuickFiltersProps {
  onFilterSelect: (type: LeaderboardType, period: LeaderboardPeriod) => void;
  className?: string;
}

export const QuickLeaderboardFilters: React.FC<QuickFiltersProps> = ({
  onFilterSelect,
  className = ''
}) => {
  const quickFilters = [
    {
      label: 'Top Engaged',
      icon: '⚡',
      type: LeaderboardType.ENGAGEMENT_SCORE,
      period: LeaderboardPeriod.ALL_TIME
    },
    {
      label: 'Most Active',
      icon: '🎯',
      type: LeaderboardType.PARTICIPATION,
      period: LeaderboardPeriod.WEEKLY
    },
    {
      label: 'Achievement Masters',
      icon: '🏆',
      type: LeaderboardType.ACHIEVEMENTS,
      period: LeaderboardPeriod.ALL_TIME
    },
    {
      label: 'Challenge Champions',
      icon: '🥇',
      type: LeaderboardType.CHALLENGE_WINS,
      period: LeaderboardPeriod.MONTHLY
    },
    {
      label: 'Community Leaders',
      icon: '🤝',
      type: LeaderboardType.SOCIAL_IMPACT,
      period: LeaderboardPeriod.ALL_TIME
    }
  ];

  return (
    <div className={`quick-leaderboard-filters ${className}`}>
      <h4 className="quick-filters-title">Popular Rankings</h4>
      <div className="quick-filters-grid">
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            className="quick-filter-button"
            onClick={() => onFilterSelect(filter.type, filter.period)}
            aria-label={`View ${filter.label} leaderboard`}
          >
            <span className="filter-icon" aria-hidden="true">{filter.icon}</span>
            <span className="filter-label">{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Compact filter toggle component
interface CompactFiltersProps {
  selectedType: LeaderboardType;
  selectedPeriod: LeaderboardPeriod;
  onTypeChange: (type: LeaderboardType) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  className?: string;
}

export const CompactLeaderboardFilters: React.FC<CompactFiltersProps> = ({
  selectedType,
  selectedPeriod,
  onTypeChange,
  onPeriodChange,
  className = ''
}) => {
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = React.useState(false);

  const getTypeLabel = (type: LeaderboardType): string => {
    const labels = {
      [LeaderboardType.ENGAGEMENT_SCORE]: 'Engagement',
      [LeaderboardType.PARTICIPATION]: 'Participation',
      [LeaderboardType.ACHIEVEMENTS]: 'Achievements',
      [LeaderboardType.CHALLENGE_WINS]: 'Challenges',
      [LeaderboardType.SOCIAL_IMPACT]: 'Social Impact',
      [LeaderboardType.TEAM_PERFORMANCE]: 'Team Performance'
    };
    return labels[type] || type;
  };

  const getPeriodLabel = (period: LeaderboardPeriod): string => {
    const labels = {
      [LeaderboardPeriod.DAILY]: 'Daily',
      [LeaderboardPeriod.WEEKLY]: 'Weekly',
      [LeaderboardPeriod.MONTHLY]: 'Monthly',
      [LeaderboardPeriod.ALL_TIME]: 'All Time',
      [LeaderboardPeriod.EVENT_SPECIFIC]: 'Event'
    };
    return labels[period] || period;
  };

  return (
    <div className={`compact-leaderboard-filters ${className}`}>
      <div className="compact-filter-group">
        <div className="compact-filter-dropdown">
          <button
            className="compact-filter-button"
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            aria-expanded={showTypeDropdown}
            aria-haspopup="true"
          >
            {getTypeLabel(selectedType)}
            <span className="dropdown-arrow" aria-hidden="true">▼</span>
          </button>
          
          {showTypeDropdown && (
            <div className="compact-dropdown-menu" role="menu">
              {Object.values(LeaderboardType).map((type) => (
                <button
                  key={type}
                  role="menuitem"
                  className={`dropdown-item ${selectedType === type ? 'selected' : ''}`}
                  onClick={() => {
                    onTypeChange(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="filter-separator" aria-hidden="true">•</div>

        <div className="compact-filter-dropdown">
          <button
            className="compact-filter-button"
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            aria-expanded={showPeriodDropdown}
            aria-haspopup="true"
          >
            {getPeriodLabel(selectedPeriod)}
            <span className="dropdown-arrow" aria-hidden="true">▼</span>
          </button>
          
          {showPeriodDropdown && (
            <div className="compact-dropdown-menu" role="menu">
              {Object.values(LeaderboardPeriod).map((period) => (
                <button
                  key={period}
                  role="menuitem"
                  className={`dropdown-item ${selectedPeriod === period ? 'selected' : ''}`}
                  onClick={() => {
                    onPeriodChange(period);
                    setShowPeriodDropdown(false);
                  }}
                >
                  {getPeriodLabel(period)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
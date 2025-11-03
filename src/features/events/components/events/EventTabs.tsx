import React from 'react';
import { EventCategory } from '@features/events/types/event.types';

interface EventTabsProps {
  activeTab: EventCategory;
  onTabChange: (tab: EventCategory) => void;
}

interface TabConfig {
  id: EventCategory;
  label: string;
}

const tabs: TabConfig[] = [
  { id: EventCategory.UPCOMING, label: 'Upcoming Events' },
  { id: EventCategory.ONGOING_TOURNAMENT, label: 'Ongoing Tournaments' },
  { id: EventCategory.AMAPLAYER, label: 'Events from AmaPlayer' }
];

export const EventTabs: React.FC<EventTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="event-tabs" role="tablist" aria-label="Event categories">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            className={`event-tab ${isActive ? 'event-tab-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                const currentIndex = tabs.findIndex(t => t.id === tab.id);
                const nextIndex = (currentIndex + 1) % tabs.length;
                onTabChange(tabs[nextIndex].id);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = tabs.findIndex(t => t.id === tab.id);
                const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                onTabChange(tabs[prevIndex].id);
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

import React, { memo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../contexts/UnifiedPreferencesContext';
import { ThemeToggleProps } from '../../../types/components/common';
import './ThemeToggle.css';

interface ThemeToggleComponentProps {
  inline?: boolean;
  showLabel?: boolean;
}

const ThemeToggle = memo<ThemeToggleComponentProps>(function ThemeToggle({ inline = false, showLabel = false }) {
  const { isDarkMode, toggleTheme } = useTheme();

  const buttonClass = inline ? 'theme-toggle-inline' : 'theme-toggle';
  const iconSize = inline ? 18 : 20;

  if (inline) {
    return (
      <div className="theme-toggle-inline-container">
        {showLabel && (
          <span className="theme-toggle-label">
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
        )}
        <div className="theme-toggle-switch">
          <button
            className={`theme-toggle-option ${!isDarkMode ? 'active' : ''}`}
            onClick={!isDarkMode ? null : toggleTheme}
            aria-label="Switch to light mode"
            aria-pressed={!isDarkMode}
          >
            <Sun size={iconSize} />
          </button>
          <button
            className={`theme-toggle-option ${isDarkMode ? 'active' : ''}`}
            onClick={isDarkMode ? null : toggleTheme}
            aria-label="Switch to dark mode"
            aria-pressed={isDarkMode}
          >
            <Moon size={iconSize} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button 
      className={buttonClass}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <Sun size={iconSize} className="theme-icon" />
      ) : (
        <Moon size={iconSize} className="theme-icon" />
      )}
    </button>
  );
});

export default ThemeToggle;
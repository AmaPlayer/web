/**
 * ThemeToggle Component
 * 
 * A unified theme toggle component that allows users to switch between light and dark modes.
 * Supports multiple variants (icon, switch, button) and is fully accessible with keyboard
 * navigation and screen reader support.
 * 
 * Features:
 * - Multiple variants: icon, switch, button
 * - Sun/moon icon that changes based on current theme
 * - Smooth transition animations
 * - Keyboard support (Enter and Space keys)
 * - ARIA labels and pressed state for accessibility
 * - Screen reader announcements for theme changes
 * 
 * @example
 * // Icon variant (default) - compact for navigation bars
 * <ThemeToggle />
 * 
 * @example
 * // Switch variant - best for settings pages
 * <ThemeToggle variant="switch" showLabel={true} />
 * 
 * @example
 * // Button variant - prominent placement
 * <ThemeToggle variant="button" size="large" />
 * 
 * @example
 * // Custom styling
 * <ThemeToggle className="my-theme-toggle" size="small" />
 */

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/UnifiedPreferencesContext';
import './ThemeToggle.css';

/**
 * Props for the ThemeToggle component
 */
export interface ThemeToggleProps {
  /**
   * Visual variant of the toggle
   * - 'icon': Simple icon button with sun/moon (default, best for compact spaces)
   * - 'switch': Toggle switch with sliding animation (best for settings)
   * - 'button': Full button with icon and text (best for prominent placement)
   * @default 'icon'
   * @example
   * <ThemeToggle variant="switch" />
   */
  variant?: 'icon' | 'switch' | 'button';
  
  /**
   * Whether to show a text label alongside the icon
   * Only applies to 'icon' and 'switch' variants
   * The 'button' variant always shows text
   * @default false
   * @example
   * <ThemeToggle showLabel={true} />
   */
  showLabel?: boolean;
  
  /**
   * Size of the toggle component
   * - 'small': 16px icon size (best for compact layouts)
   * - 'medium': 20px icon size (default, best for most cases)
   * - 'large': 24px icon size (best for touch interfaces)
   * @default 'medium'
   * @example
   * <ThemeToggle size="large" />
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Additional CSS class name to apply to the component
   * Useful for custom styling or positioning
   * @example
   * <ThemeToggle className="my-custom-class" />
   */
  className?: string;
}

/**
 * ThemeToggle Component
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  showLabel = false,
  size = 'medium',
  className = ''
}) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const announcementRef = useRef<HTMLDivElement>(null);

  /**
   * Handle theme toggle with screen reader announcement
   */
  const handleToggle = () => {
    toggleTheme();
    
    // Announce theme change to screen readers
    if (announcementRef.current) {
      const newTheme = !isDarkMode ? 'dark' : 'light';
      announcementRef.current.textContent = `${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`;
    }
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Support both Enter and Space keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  // Sun icon SVG
  const SunIcon = () => (
    <svg 
      className="theme-toggle__icon theme-toggle__icon--sun" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  );

  // Moon icon SVG
  const MoonIcon = () => (
    <svg 
      className="theme-toggle__icon theme-toggle__icon--moon" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );

  /**
   * Render icon variant
   */
  const renderIconVariant = () => (
    <button
      className={`theme-toggle theme-toggle--icon theme-toggle--${size} ${className}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-pressed={isDarkMode}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      type="button"
    >
      {isDarkMode ? <SunIcon /> : <MoonIcon />}
      {showLabel && (
        <span className="theme-toggle__label">
          {isDarkMode ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );

  /**
   * Render switch variant
   */
  const renderSwitchVariant = () => (
    <button
      className={`theme-toggle theme-toggle--switch theme-toggle--${size} ${className}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={isDarkMode}
      aria-label={`${isDarkMode ? 'Dark' : 'Light'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      type="button"
    >
      <span className="theme-toggle__switch-track">
        <span className="theme-toggle__switch-thumb">
          {isDarkMode ? <MoonIcon /> : <SunIcon />}
        </span>
      </span>
      {showLabel && (
        <span className="theme-toggle__label">
          {isDarkMode ? 'Dark' : 'Light'} Mode
        </span>
      )}
    </button>
  );

  /**
   * Render button variant
   */
  const renderButtonVariant = () => (
    <button
      className={`theme-toggle theme-toggle--button theme-toggle--${size} ${className}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-pressed={isDarkMode}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      type="button"
    >
      <span className="theme-toggle__button-icon">
        {isDarkMode ? <SunIcon /> : <MoonIcon />}
      </span>
      <span className="theme-toggle__button-text">
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );

  /**
   * Render appropriate variant
   */
  const renderToggle = () => {
    switch (variant) {
      case 'switch':
        return renderSwitchVariant();
      case 'button':
        return renderButtonVariant();
      case 'icon':
      default:
        return renderIconVariant();
    }
  };

  return (
    <>
      {renderToggle()}
      {/* Screen reader announcement area */}
      <div
        ref={announcementRef}
        className="theme-toggle__sr-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </>
  );
};

export default ThemeToggle;

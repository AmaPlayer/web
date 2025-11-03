/**
 * LanguageSelector Component
 * 
 * A unified language selector component that supports multiple variants (dropdown, modal, inline)
 * and provides full keyboard navigation and accessibility support.
 * 
 * Features:
 * - Displays all 12 supported languages with native names
 * - Visual indicator for currently selected language
 * - Keyboard navigation (arrow keys, Enter, Escape, Home, End)
 * - ARIA labels and roles for accessibility
 * - Multiple variants: dropdown, modal, inline
 * - Screen reader announcements for language changes
 * 
 * @example
 * // Dropdown variant (default)
 * <LanguageSelector />
 * 
 * @example
 * // Modal variant
 * <LanguageSelector variant="modal" />
 * 
 * @example
 * // Inline variant (for settings pages)
 * <LanguageSelector variant="inline" showNativeNames={true} />
 * 
 * @example
 * // With callback
 * <LanguageSelector 
 *   variant="dropdown"
 *   onLanguageChange={(lang) => console.log('Language changed to:', lang)}
 * />
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/UnifiedPreferencesContext';
import { LanguageCode } from '../../types/contexts/preferences';
import './LanguageSelector.css';

/**
 * Props for the LanguageSelector component
 */
interface LanguageSelectorProps {
  /**
   * Visual variant of the language selector
   * - 'dropdown': Compact dropdown menu (default, best for navigation bars)
   * - 'modal': Full-screen modal dialog (best for mobile devices)
   * - 'inline': Expanded list view (best for settings pages)
   * @default 'dropdown'
   */
  variant?: 'dropdown' | 'modal' | 'inline';
  
  /**
   * Whether to show language names in their native script alongside English names
   * When true, displays both "Hindi" and "हिन्दी"
   * @default true
   */
  showNativeNames?: boolean;
  
  /**
   * Optional callback function called when language is changed
   * Receives the new language code as parameter
   * @param language - The newly selected language code
   * @example
   * onLanguageChange={(lang) => console.log('Language changed to:', lang)}
   */
  onLanguageChange?: (language: LanguageCode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showNativeNames = true,
  onLanguageChange
}) => {
  const { currentLanguage, changeLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Get current language display name
   */
  const getCurrentLanguageName = useCallback((): string => {
    const language = languages.find(lang => lang.code === currentLanguage);
    return language ? (showNativeNames ? language.nativeName : language.name) : 'English';
  }, [currentLanguage, languages, showNativeNames]);

  /**
   * Handle click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open dropdown on Enter or Space when closed
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(languages.findIndex(lang => lang.code === currentLanguage));
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev < languages.length - 1 ? prev + 1 : 0;
          optionsRef.current[nextIndex]?.focus();
          return nextIndex;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev > 0 ? prev - 1 : languages.length - 1;
          optionsRef.current[nextIndex]?.focus();
          return nextIndex;
        });
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < languages.length) {
          handleLanguageSelect(languages[focusedIndex].code);
        }
        break;

      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        optionsRef.current[0]?.focus();
        break;

      case 'End': {
        event.preventDefault();
        const lastIndex = languages.length - 1;
        setFocusedIndex(lastIndex);
        optionsRef.current[lastIndex]?.focus();
        break;
      }

      default:
        break;
    }
  }, [isOpen, focusedIndex, languages, currentLanguage]);

  /**
   * Handle language selection
   */
  const handleLanguageSelect = useCallback((languageCode: LanguageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
    setFocusedIndex(-1);
    
    // Call optional callback
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }

    // Announce change to screen readers
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      const announcement = `Language changed to ${language.name}`;
      announceToScreenReader(announcement);
    }
  }, [changeLanguage, onLanguageChange, languages]);

  /**
   * Announce message to screen readers
   */
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  /**
   * Toggle dropdown open/closed
   */
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setFocusedIndex(languages.findIndex(lang => lang.code === currentLanguage));
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, languages, currentLanguage]);

  /**
   * Render dropdown variant
   */
  const renderDropdown = () => (
    <div 
      className="language-selector language-selector--dropdown" 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button 
        className="language-selector__toggle"
        onClick={toggleDropdown}
        aria-label={t('selectLanguage') || 'Select Language'}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <svg 
          className="language-selector__icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span className="language-selector__current">{getCurrentLanguageName()}</span>
        <svg 
          className={`language-selector__arrow ${isOpen ? 'language-selector__arrow--open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="language-selector__dropdown">
          <div className="language-selector__header">
            <svg 
              className="language-selector__header-icon"
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>{t('chooseLanguage') || 'Choose Language'}</span>
          </div>
          <div 
            className="language-selector__options"
            role="listbox"
            aria-label={t('availableLanguages') || 'Available languages'}
          >
            {languages.map((language, index) => (
              <button
                key={language.code}
                ref={el => { optionsRef.current[index] = el; }}
                className={`language-selector__option ${currentLanguage === language.code ? 'language-selector__option--active' : ''}`}
                onClick={() => handleLanguageSelect(language.code)}
                role="option"
                aria-selected={currentLanguage === language.code}
                tabIndex={isOpen ? 0 : -1}
                type="button"
              >
                <div className="language-selector__option-info">
                  <span className="language-selector__option-name">{language.name}</span>
                  {showNativeNames && (
                    <span className="language-selector__option-native">{language.nativeName}</span>
                  )}
                </div>
                {currentLanguage === language.code && (
                  <span className="language-selector__check" aria-label="Selected">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render modal variant
   */
  const renderModal = () => (
    <div className="language-selector language-selector--modal">
      <button 
        className="language-selector__toggle"
        onClick={toggleDropdown}
        aria-label={t('selectLanguage') || 'Select Language'}
        type="button"
      >
        <svg 
          className="language-selector__icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span className="language-selector__current">{getCurrentLanguageName()}</span>
      </button>
      
      {isOpen && (
        <div 
          className="language-selector__modal-overlay"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div 
            className="language-selector__modal-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={t('selectLanguage') || 'Select Language'}
          >
            <div className="language-selector__modal-header">
              <h2>{t('chooseLanguage') || 'Choose Language'}</h2>
              <button
                className="language-selector__modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="language-selector__modal-body">
              {languages.map((language, index) => (
                <button
                  key={language.code}
                  ref={el => { optionsRef.current[index] = el; }}
                  className={`language-selector__option ${currentLanguage === language.code ? 'language-selector__option--active' : ''}`}
                  onClick={() => handleLanguageSelect(language.code)}
                  type="button"
                >
                  <div className="language-selector__option-info">
                    <span className="language-selector__option-name">{language.name}</span>
                    {showNativeNames && (
                      <span className="language-selector__option-native">{language.nativeName}</span>
                    )}
                  </div>
                  {currentLanguage === language.code && (
                    <span className="language-selector__check" aria-label="Selected">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render inline variant
   */
  const renderInline = () => (
    <div className="language-selector language-selector--inline">
      <div className="language-selector__inline-header">
        <svg 
          className="language-selector__icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>{t('chooseLanguage') || 'Choose Language'}</span>
      </div>
      <div className="language-selector__inline-options">
        {languages.map((language) => (
          <button
            key={language.code}
            className={`language-selector__inline-option ${currentLanguage === language.code ? 'language-selector__inline-option--active' : ''}`}
            onClick={() => handleLanguageSelect(language.code)}
            aria-pressed={currentLanguage === language.code}
            type="button"
          >
            <div className="language-selector__option-info">
              <span className="language-selector__option-name">{language.name}</span>
              {showNativeNames && (
                <span className="language-selector__option-native">{language.nativeName}</span>
              )}
            </div>
            {currentLanguage === language.code && (
              <span className="language-selector__check" aria-label="Selected">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'modal':
      return renderModal();
    case 'inline':
      return renderInline();
    case 'dropdown':
    default:
      return renderDropdown();
  }
};

export default LanguageSelector;

/**
 * Unified Preferences Context
 * 
 * Centralized context provider for managing both language and theme preferences
 * across the entire application. Consolidates functionality from LanguageContext,
 * ThemeContext, and LoginLanguageContext into a single source of truth.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { localStorageManager, firebaseSyncManager } from '../services/preferencesService';
import { languages, getTranslation } from '../translations';
import { applyThemeToDOM } from '../utils/theme/themeOptimization';
import {
  UnifiedPreferencesContextValue,
  UnifiedPreferencesProviderProps,
  LanguageCode,
  ThemeMode,
  Language,
  TranslationKey,
  StoredPreferences
} from '../types/contexts/preferences';

/**
 * Default preferences
 */
const DEFAULT_LANGUAGE: LanguageCode = 'en';
const DEFAULT_THEME: ThemeMode = 'dark';

/**
 * Create the unified preferences context
 */
const UnifiedPreferencesContext = createContext<UnifiedPreferencesContextValue | undefined>(undefined);

/**
 * UnifiedPreferencesProvider Component
 * 
 * Provides language and theme preferences to the entire application.
 * Handles initialization from localStorage, Firebase sync, and preference updates.
 */
export function UnifiedPreferencesProvider({ children }: UnifiedPreferencesProviderProps): React.ReactElement {
  const { currentUser } = useAuth();
  
  // State management
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(DEFAULT_THEME === 'dark');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /**
   * Initialize preferences from localStorage on mount
   */
  useEffect(() => {
    const initializePreferences = () => {
      try {
        // Load from localStorage
        const stored = localStorageManager.load();
        
        if (stored) {
          setCurrentLanguage(stored.language);
          setIsDarkMode(stored.theme === 'dark');
          
          // Apply theme immediately to prevent FOUC
          applyThemeToDocument(stored.theme);
        } else {
          // Apply default theme
          applyThemeToDocument(DEFAULT_THEME);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize preferences:', error);
        
        // Fall back to defaults
        setCurrentLanguage(DEFAULT_LANGUAGE);
        setIsDarkMode(DEFAULT_THEME === 'dark');
        applyThemeToDocument(DEFAULT_THEME);
        setIsInitialized(true);
      }
    };

    initializePreferences();
  }, []);

  /**
   * Sync preferences to Firebase when user is authenticated
   */
  useEffect(() => {
    const syncToFirebase = async () => {
      if (!currentUser || !isInitialized) {
        return;
      }

      try {
        // Load preferences from Firebase
        const firebasePrefs = await firebaseSyncManager.loadFromFirebase(currentUser.uid);
        
        if (firebasePrefs) {
          // Firebase preferences take precedence
          setCurrentLanguage(firebasePrefs.language);
          setIsDarkMode(firebasePrefs.theme === 'dark');
          applyThemeToDocument(firebasePrefs.theme);
          
          // Update localStorage to match Firebase
          localStorageManager.save(firebasePrefs);
        } else {
          // No Firebase preferences, sync current preferences to Firebase
          const currentPrefs: StoredPreferences = {
            language: currentLanguage,
            theme: isDarkMode ? 'dark' : 'light',
            lastUpdated: Date.now()
          };
          
          await firebaseSyncManager.syncToFirebase(currentUser.uid, currentPrefs);
        }
      } catch (error) {
        console.error('Failed to sync preferences with Firebase:', error);
        // Continue with local preferences
      }
    };

    syncToFirebase();
  }, [currentUser, isInitialized]);

  /**
   * Apply theme to document root with performance tracking
   */
  const applyThemeToDocument = useCallback((theme: ThemeMode) => {
    applyThemeToDOM(theme);
  }, []);

  /**
   * Change language preference
   */
  const changeLanguage = useCallback(async (languageCode: LanguageCode) => {
    try {
      // Validate language code
      const isValidLanguage = languages.some(lang => lang.code === languageCode);
      if (!isValidLanguage) {
        console.error(`Invalid language code: ${languageCode}`);
        return;
      }

      // Update state
      setCurrentLanguage(languageCode);

      // Save to localStorage
      const preferences: StoredPreferences = {
        language: languageCode,
        theme: isDarkMode ? 'dark' : 'light',
        lastUpdated: Date.now()
      };
      
      localStorageManager.save(preferences);

      // Sync to Firebase if authenticated
      if (currentUser) {
        try {
          await firebaseSyncManager.syncToFirebase(currentUser.uid, preferences);
        } catch (error) {
          console.error('Failed to sync language change to Firebase:', error);
          // Continue - localStorage is already updated
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [currentUser, isDarkMode]);

  /**
   * Toggle theme between dark and light
   */
  const toggleTheme = useCallback(async () => {
    try {
      const newTheme: ThemeMode = isDarkMode ? 'light' : 'dark';
      
      // Update state
      setIsDarkMode(!isDarkMode);
      
      // Apply theme to document
      applyThemeToDocument(newTheme);

      // Save to localStorage
      const preferences: StoredPreferences = {
        language: currentLanguage,
        theme: newTheme,
        lastUpdated: Date.now()
      };
      
      localStorageManager.save(preferences);

      // Sync to Firebase if authenticated
      if (currentUser) {
        try {
          await firebaseSyncManager.syncToFirebase(currentUser.uid, preferences);
        } catch (error) {
          console.error('Failed to sync theme change to Firebase:', error);
          // Continue - localStorage is already updated
        }
      }
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  }, [currentUser, currentLanguage, isDarkMode, applyThemeToDocument]);

  /**
   * Set theme to a specific mode
   */
  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      // Update state
      setIsDarkMode(mode === 'dark');
      
      // Apply theme to document
      applyThemeToDocument(mode);

      // Save to localStorage
      const preferences: StoredPreferences = {
        language: currentLanguage,
        theme: mode,
        lastUpdated: Date.now()
      };
      
      localStorageManager.save(preferences);

      // Sync to Firebase if authenticated
      if (currentUser) {
        try {
          await firebaseSyncManager.syncToFirebase(currentUser.uid, preferences);
        } catch (error) {
          console.error('Failed to sync theme change to Firebase:', error);
          // Continue - localStorage is already updated
        }
      }
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  }, [currentUser, currentLanguage, applyThemeToDocument]);

  /**
   * Get current language object
   * Memoized to prevent recreation on every render
   */
  const getCurrentLanguage = useCallback((): Language => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  }, [currentLanguage]);

  /**
   * Translation function with fallback to English
   * Optimized with:
   * - Map-based O(1) lookups
   * - LRU caching for frequently accessed translations
   * - Stable reference - only recreates when language changes
   */
  const t = useCallback((key: TranslationKey): string => {
    return getTranslation(currentLanguage, key);
  }, [currentLanguage]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   * Only recreates when actual state or stable callbacks change
   */
  const contextValue = useMemo<UnifiedPreferencesContextValue>(() => {
    return {
      // Language
      currentLanguage,
      changeLanguage,
      getCurrentLanguage,
      t,
      languages,
      
      // Theme
      isDarkMode,
      toggleTheme,
      setTheme,
      theme: isDarkMode ? 'dark' : 'light',
      
      // State
      isInitialized
    };
  }, [
    currentLanguage,
    changeLanguage,
    getCurrentLanguage,
    t,
    isDarkMode,
    toggleTheme,
    setTheme,
    isInitialized
  ]);

  return (
    <UnifiedPreferencesContext.Provider value={contextValue}>
      {children}
    </UnifiedPreferencesContext.Provider>
  );
}

/**
 * Primary hook - provides all functionality for language and theme preferences
 * 
 * This is the main hook for accessing the unified preferences system. It provides
 * access to both language and theme state and methods.
 * 
 * @returns {UnifiedPreferencesContextValue} The complete preferences context value
 * @throws {Error} If used outside of UnifiedPreferencesProvider
 * 
 * @example
 * // Access all preferences
 * function MyComponent() {
 *   const { currentLanguage, changeLanguage, isDarkMode, toggleTheme, t } = useAppPreferences();
 *   
 *   return (
 *     <div>
 *       <p>{t('welcome')}</p>
 *       <button onClick={() => changeLanguage('hi')}>Switch to Hindi</button>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Use translation function
 * function Header() {
 *   const { t } = useAppPreferences();
 *   return <h1>{t('appTitle')}</h1>;
 * }
 */
export function useAppPreferences(): UnifiedPreferencesContextValue {
  const context = useContext(UnifiedPreferencesContext);
  
  if (context === undefined) {
    throw new Error('useAppPreferences must be used within a UnifiedPreferencesProvider');
  }
  
  return context;
}

/**
 * Convenience hook for language functionality (backward compatibility)
 * 
 * This hook provides access to only the language-related functionality from the
 * unified preferences system. Use this when you only need language features.
 * 
 * @returns {Object} Language-related state and methods
 * @returns {LanguageCode} currentLanguage - The currently selected language code
 * @returns {Function} changeLanguage - Function to change the language
 * @returns {Function} getCurrentLanguage - Function to get the current language object
 * @returns {Function} t - Translation function
 * @returns {Language[]} languages - Array of all supported languages
 * @throws {Error} If used outside of UnifiedPreferencesProvider
 * 
 * @example
 * // Basic usage
 * function LanguageSelector() {
 *   const { currentLanguage, changeLanguage, languages } = useLanguage();
 *   
 *   return (
 *     <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
 *       {languages.map(lang => (
 *         <option key={lang.code} value={lang.code}>{lang.name}</option>
 *       ))}
 *     </select>
 *   );
 * }
 * 
 * @example
 * // Using translation function
 * function WelcomeMessage() {
 *   const { t } = useLanguage();
 *   return <h1>{t('welcome')}</h1>;
 * }
 * 
 * @example
 * // Get current language details
 * function LanguageDisplay() {
 *   const { getCurrentLanguage } = useLanguage();
 *   const lang = getCurrentLanguage();
 *   return <p>Current: {lang.nativeName}</p>;
 * }
 */
export function useLanguage() {
  const context = useContext(UnifiedPreferencesContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a UnifiedPreferencesProvider');
  }
  
  return {
    currentLanguage: context.currentLanguage,
    changeLanguage: context.changeLanguage,
    getCurrentLanguage: context.getCurrentLanguage,
    t: context.t,
    languages: context.languages
  };
}

/**
 * Convenience hook for theme functionality (backward compatibility)
 * 
 * This hook provides access to only the theme-related functionality from the
 * unified preferences system. Use this when you only need theme features.
 * 
 * @returns {Object} Theme-related state and methods
 * @returns {boolean} isDarkMode - Whether dark mode is currently enabled
 * @returns {Function} toggleTheme - Function to toggle between light and dark modes
 * @returns {Function} setTheme - Function to set a specific theme mode
 * @returns {ThemeMode} theme - The current theme mode ('light' or 'dark')
 * @throws {Error} If used outside of UnifiedPreferencesProvider
 * 
 * @example
 * // Basic theme toggle
 * function ThemeToggleButton() {
 *   const { isDarkMode, toggleTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
 *     </button>
 *   );
 * }
 * 
 * @example
 * // Set specific theme
 * function ThemeSelector() {
 *   const { theme, setTheme } = useTheme();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <p>Current: {theme}</p>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Conditional rendering based on theme
 * function ThemedComponent() {
 *   const { isDarkMode } = useTheme();
 *   
 *   return (
 *     <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
 *       Content
 *     </div>
 *   );
 * }
 */
export function useTheme() {
  const context = useContext(UnifiedPreferencesContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a UnifiedPreferencesProvider');
  }
  
  return {
    isDarkMode: context.isDarkMode,
    toggleTheme: context.toggleTheme,
    setTheme: context.setTheme,
    theme: context.theme
  };
}

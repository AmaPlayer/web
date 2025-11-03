/**
 * Unified Preferences Context Type Definitions
 * 
 * Defines types for the UnifiedPreferencesContext which manages both
 * language and theme preferences in a single, centralized context.
 */

import { ReactNode } from 'react';

/**
 * Supported language codes for all 12 Indian regional languages
 */
export type LanguageCode = 
  | 'en'  // English
  | 'hi'  // Hindi
  | 'pa'  // Punjabi
  | 'mr'  // Marathi
  | 'bn'  // Bengali
  | 'ta'  // Tamil
  | 'te'  // Telugu
  | 'kn'  // Kannada
  | 'ml'  // Malayalam
  | 'gu'  // Gujarati
  | 'or'  // Odia
  | 'as'; // Assamese

/**
 * Language information with native names
 */
export interface Language {
  /** ISO language code */
  code: LanguageCode;
  
  /** English name of the language */
  name: string;
  
  /** Native name of the language (in its own script) */
  nativeName: string;
}

/**
 * Available theme modes
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Translation keys for the application
 * Using string type to allow dynamic keys while maintaining type safety
 */
export type TranslationKey = string;

/**
 * Translation dictionary mapping keys to translated strings
 */
export type TranslationDictionary = Record<string, string>;

/**
 * All translations organized by language code
 */
export type Translations = Record<LanguageCode, Partial<TranslationDictionary>>;

/**
 * The unified context value providing both language and theme functionality
 */
export interface UnifiedPreferencesContextValue {
  // Language state and methods
  /** The currently selected language code */
  currentLanguage: LanguageCode;
  
  /** Change the application language */
  changeLanguage: (languageCode: LanguageCode) => void;
  
  /** Get the current language object with full details */
  getCurrentLanguage: () => Language;
  
  /** Translate a key to the current language with fallback to English */
  t: (key: TranslationKey) => string;
  
  /** Array of all available languages */
  languages: Language[];
  
  // Theme state and methods
  /** Whether dark mode is currently enabled */
  isDarkMode: boolean;
  
  /** Toggle between dark and light mode */
  toggleTheme: () => void;
  
  /** Set theme to a specific mode */
  setTheme: (mode: ThemeMode) => void;
  
  /** The current theme as a string ('dark' or 'light') */
  theme: ThemeMode;
  
  // Initialization state
  /** Whether the context has finished initializing from storage */
  isInitialized: boolean;
}

/**
 * Props for the UnifiedPreferencesProvider component
 */
export interface UnifiedPreferencesProviderProps {
  /** Child components that will have access to the unified preferences context */
  children: ReactNode;
}

/**
 * Stored preferences structure for localStorage and Firebase
 */
export interface StoredPreferences {
  /** Selected language code */
  language: LanguageCode;
  
  /** Selected theme mode */
  theme: ThemeMode;
  
  /** Timestamp of last update */
  lastUpdated: number;
}

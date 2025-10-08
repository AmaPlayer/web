/**
 * Language Context Type Definitions
 * 
 * Defines types for the LanguageContext which manages the application's
 * internationalization (i18n) state and provides translation methods.
 */

import { ReactNode } from 'react';

/**
 * Supported language codes
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
 * Language information
 */
export interface Language {
  /** ISO language code */
  code: LanguageCode;
  
  /** English name of the language */
  name: string;
  
  /** Native name of the language */
  nativeName: string;
}

/**
 * Translation keys for the application
 * This is a subset of available keys - extend as needed
 */
export type TranslationKey = 
  // Navigation
  | 'amaplayer'
  | 'home'
  | 'search'
  | 'add'
  | 'activity'
  | 'messages'
  | 'profile'
  // Landing Page
  | 'heroTitle'
  | 'heroSubtitle'
  | 'heroDescription'
  | 'getStarted'
  | 'learnMore'
  | 'features'
  | 'featuresTitle'
  // Features
  | 'shareAchievements'
  | 'shareAchievementsDesc'
  | 'talentShowcase'
  | 'talentShowcaseDesc'
  | 'connectAthletes'
  | 'connectAthletesDesc'
  // Authentication
  | 'login'
  | 'signup'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'fullName'
  | 'forgotPassword'
  | 'dontHaveAccount'
  | 'alreadyHaveAccount'
  | 'signInWithGoogle'
  | 'signInWithApple'
  | 'continueAsGuest'
  // Common
  | 'loading'
  | 'error'
  | 'success'
  | 'cancel'
  | 'save'
  | 'delete'
  | 'edit'
  | 'back'
  | 'next'
  | 'previous'
  | 'close'
  // Posts
  | 'createPost'
  | 'whatsOnYourMind'
  | 'sharePost'
  | 'addPhoto'
  | 'addVideo'
  | 'postShared'
  | 'writeCaption'
  // Profile
  | 'followers'
  | 'following'
  | 'posts'
  | 'editProfile'
  | 'bio'
  | 'location'
  | 'website'
  // Comments
  | 'writeComment'
  | 'comments'
  | 'reply'
  | 'like'
  // Guest Mode
  | 'guestMode'
  | 'signUpToInteract'
  | 'signUpToComment'
  // Footer
  | 'copyright'
  // Language
  | 'chooseLanguage';

/**
 * Translation dictionary mapping keys to translated strings
 */
export type TranslationDictionary = Record<TranslationKey, string>;

/**
 * All translations organized by language code
 */
export type Translations = Record<LanguageCode, Partial<TranslationDictionary>>;

/**
 * The value provided by the LanguageContext
 */
export interface LanguageContextValue {
  /** The currently selected language code */
  currentLanguage: LanguageCode;
  
  /** Change the application language */
  changeLanguage: (languageCode: LanguageCode) => void;
  
  /** Get the current language object with full details */
  getCurrentLanguage: () => Language;
  
  /** Translate a key to the current language */
  t: (key: TranslationKey) => string;
  
  /** Array of all available languages */
  languages: Language[];
}

/**
 * Props for the LanguageProvider component
 */
export interface LanguageProviderProps {
  /** Child components that will have access to the language context */
  children: ReactNode;
}

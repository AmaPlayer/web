/**
 * Unit Tests for UnifiedPreferencesContext
 * 
 * Tests provider initialization, language changes, theme changes,
 * translation function, and Firebase sync functionality.
 * 
 * Requirements tested: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { UnifiedPreferencesProvider, useAppPreferences } from '../UnifiedPreferencesContext';
import { localStorageManager, firebaseSyncManager } from '../../services/preferencesService';
import { StoredPreferences } from '../../types/contexts/preferences';

// Mock AuthContext
const mockCurrentUser = { uid: 'test-user-123' };
const mockUseAuth = jest.fn(() => ({ currentUser: null }));

jest.mock('../AuthContext', () => {
  const actual = jest.requireActual('../AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

// Mock theme optimization utility
jest.mock('../../utils/theme/themeOptimization', () => ({
  applyThemeToDOM: jest.fn()
}));

// Mock translations
const mockTranslations: Record<string, Record<string, string>> = {
  en: { home: 'Home', settings: 'Settings', welcome: 'Welcome' },
  hi: { home: 'होम', settings: 'सेटिंग्स', welcome: 'स्वागत है' },
  pa: { home: 'ਘਰ', settings: 'ਸੈਟਿੰਗਜ਼', welcome: 'ਸੁਆਗਤ ਹੈ' }
};

jest.mock('../../translations', () => ({
  languages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
  ],
  getTranslation: (lang: string, key: string) => {
    const translations = mockTranslations;
    return translations[lang]?.[key] || key;
  }
}));

describe('UnifiedPreferencesContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UnifiedPreferencesProvider>{children}</UnifiedPreferencesProvider>
  );

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset auth mock to default (no user)
    mockUseAuth.mockReturnValue({ currentUser: null });
    
    // Reset localStorage mock
    jest.spyOn(localStorageManager, 'load').mockReturnValue(null);
    jest.spyOn(localStorageManager, 'save').mockReturnValue(true);
    jest.spyOn(localStorageManager, 'clear').mockImplementation(() => {});
    
    // Reset Firebase mock
    jest.spyOn(firebaseSyncManager, 'loadFromFirebase').mockResolvedValue(null);
    jest.spyOn(firebaseSyncManager, 'syncToFirebase').mockResolvedValue(undefined);
    jest.spyOn(firebaseSyncManager, 'deleteFromFirebase').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize with default values when localStorage is empty', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.currentLanguage).toBe('en');
      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.theme).toBe('dark');
    });

    it('should load preferences from localStorage on mount', async () => {
      const storedPrefs: StoredPreferences = {
        language: 'hi',
        theme: 'light',
        lastUpdated: Date.now()
      };

      jest.spyOn(localStorageManager, 'load').mockReturnValue(storedPrefs);

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.currentLanguage).toBe('hi');
      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.theme).toBe('light');
      expect(localStorageManager.load).toHaveBeenCalled();
    });

    it('should handle localStorage load errors gracefully', async () => {
      jest.spyOn(localStorageManager, 'load').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should fall back to defaults
      expect(result.current.currentLanguage).toBe('en');
      expect(result.current.isDarkMode).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize preferences:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Language Changes', () => {
    it('should update currentLanguage state when changeLanguage is called', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      expect(result.current.currentLanguage).toBe('hi');
    });

    it('should save to localStorage when language changes', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('pa');
      });

      expect(localStorageManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'pa',
          theme: 'dark',
          lastUpdated: expect.any(Number)
        })
      );
    });

    it('should not change language for invalid language code', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const initialLanguage = result.current.currentLanguage;

      await act(async () => {
        await result.current.changeLanguage('invalid' as any);
      });

      expect(result.current.currentLanguage).toBe(initialLanguage);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid language code: invalid'
      );

      consoleSpy.mockRestore();
    });

    it('should handle localStorage save errors gracefully', async () => {
      jest.spyOn(localStorageManager, 'save').mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      // Language should still change even if save fails
      expect(result.current.currentLanguage).toBe('hi');

      consoleSpy.mockRestore();
    });
  });

  describe('Theme Changes', () => {
    it('should toggle theme from dark to light', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isDarkMode).toBe(true);

      await act(async () => {
        await result.current.toggleTheme();
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.theme).toBe('light');
    });

    it('should toggle theme from light to dark', async () => {
      const storedPrefs: StoredPreferences = {
        language: 'en',
        theme: 'light',
        lastUpdated: Date.now()
      };

      jest.spyOn(localStorageManager, 'load').mockReturnValue(storedPrefs);

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isDarkMode).toBe(false);

      await act(async () => {
        await result.current.toggleTheme();
      });

      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.theme).toBe('dark');
    });

    it('should save to localStorage when theme toggles', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.toggleTheme();
      });

      expect(localStorageManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en',
          theme: 'light',
          lastUpdated: expect.any(Number)
        })
      );
    });

    it('should set theme to specific mode using setTheme', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.theme).toBe('light');

      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.theme).toBe('dark');
    });

    it('should handle theme change errors gracefully', async () => {
      jest.spyOn(localStorageManager, 'save').mockImplementation(() => {
        throw new Error('Save error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.toggleTheme();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to toggle theme:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Translation Function', () => {
    it('should return correct translation for current language', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.t('home')).toBe('Home');
      expect(result.current.t('settings')).toBe('Settings');
    });

    it('should return translations in selected language', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      expect(result.current.t('home')).toBe('होम');
      expect(result.current.t('settings')).toBe('सेटिंग्स');
    });

    it('should return key when translation is missing', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
    });
  });

  describe('Firebase Sync', () => {
    it('should sync to Firebase when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(firebaseSyncManager.loadFromFirebase).toHaveBeenCalledWith(
          mockCurrentUser.uid
        );
      });
    });

    it('should load preferences from Firebase when user logs in', async () => {
      const firebasePrefs: StoredPreferences = {
        language: 'pa',
        theme: 'light',
        lastUpdated: Date.now()
      };

      jest.spyOn(firebaseSyncManager, 'loadFromFirebase').mockResolvedValue(firebasePrefs);
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe('pa');
        expect(result.current.isDarkMode).toBe(false);
      });
    });

    it('should sync language changes to Firebase when authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      await waitFor(() => {
        expect(firebaseSyncManager.syncToFirebase).toHaveBeenCalledWith(
          mockCurrentUser.uid,
          expect.objectContaining({
            language: 'hi',
            theme: 'dark'
          })
        );
      });
    });

    it('should sync theme changes to Firebase when authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(firebaseSyncManager.syncToFirebase).toHaveBeenCalledWith(
          mockCurrentUser.uid,
          expect.objectContaining({
            language: 'en',
            theme: 'light'
          })
        );
      });
    });

    it('should handle Firebase sync failures gracefully', async () => {
      jest.spyOn(firebaseSyncManager, 'syncToFirebase').mockRejectedValue(
        new Error('Firebase error')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      // Language should still change locally
      expect(result.current.currentLanguage).toBe('hi');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to sync language change to Firebase:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not sync to Firebase when user is not authenticated', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      // Should not call Firebase sync
      expect(firebaseSyncManager.syncToFirebase).not.toHaveBeenCalled();
    });
  });

  describe('Context Value Memoization', () => {
    it('should not recreate context value when unrelated state changes', async () => {
      const { result, rerender } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const firstContextValue = result.current;

      // Force a rerender
      rerender();

      // Context value should be the same reference
      expect(result.current).toBe(firstContextValue);
    });

    it('should recreate context value when language changes', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const firstContextValue = result.current;

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      // Context value should be a new reference
      expect(result.current).not.toBe(firstContextValue);
      expect(result.current.currentLanguage).toBe('hi');
    });

    it('should recreate context value when theme changes', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const firstContextValue = result.current;

      await act(async () => {
        await result.current.toggleTheme();
      });

      // Context value should be a new reference
      expect(result.current).not.toBe(firstContextValue);
      expect(result.current.isDarkMode).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should return current language object with getCurrentLanguage', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const currentLang = result.current.getCurrentLanguage();
      expect(currentLang).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English'
      });
    });

    it('should return updated language object after language change', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.changeLanguage('hi');
      });

      const currentLang = result.current.getCurrentLanguage();
      expect(currentLang).toEqual({
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी'
      });
    });

    it('should provide languages array', async () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.languages).toHaveLength(3);
      expect(result.current.languages[0].code).toBe('en');
      expect(result.current.languages[1].code).toBe('hi');
      expect(result.current.languages[2].code).toBe('pa');
    });
  });
});

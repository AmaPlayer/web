/**
 * Tests for UnifiedPreferences convenience hooks
 * 
 * Tests the useAppPreferences, useLanguage, and useTheme hooks
 * to ensure they provide correct values and error handling.
 */

import { renderHook } from '@testing-library/react';
import { useAppPreferences, useLanguage, useTheme, UnifiedPreferencesProvider } from '../UnifiedPreferencesContext';
import { AuthProvider } from '../AuthContext';

// Mock the auth context
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: null }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock the preferences service
jest.mock('../../services/preferencesService', () => ({
  localStorageManager: {
    load: jest.fn(() => null),
    save: jest.fn(),
    clear: jest.fn()
  },
  firebaseSyncManager: {
    syncToFirebase: jest.fn(),
    loadFromFirebase: jest.fn(() => Promise.resolve(null)),
    deleteFromFirebase: jest.fn()
  }
}));

// Mock translations
jest.mock('../../translations', () => ({
  languages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
  ],
  translations: {
    en: { home: 'Home', settings: 'Settings' },
    hi: { home: 'होम', settings: 'सेटिंग्स' }
  }
}));

describe('UnifiedPreferences Hooks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <UnifiedPreferencesProvider>{children}</UnifiedPreferencesProvider>
    </AuthProvider>
  );

  describe('useAppPreferences', () => {
    it('should return the full context value', () => {
      const { result } = renderHook(() => useAppPreferences(), { wrapper });

      expect(result.current).toHaveProperty('currentLanguage');
      expect(result.current).toHaveProperty('changeLanguage');
      expect(result.current).toHaveProperty('getCurrentLanguage');
      expect(result.current).toHaveProperty('t');
      expect(result.current).toHaveProperty('languages');
      expect(result.current).toHaveProperty('isDarkMode');
      expect(result.current).toHaveProperty('toggleTheme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('isInitialized');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAppPreferences());
      }).toThrow('useAppPreferences must be used within a UnifiedPreferencesProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('useLanguage', () => {
    it('should return only language-related values', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current).toHaveProperty('currentLanguage');
      expect(result.current).toHaveProperty('changeLanguage');
      expect(result.current).toHaveProperty('getCurrentLanguage');
      expect(result.current).toHaveProperty('t');
      expect(result.current).toHaveProperty('languages');
      
      // Should not have theme properties
      expect(result.current).not.toHaveProperty('isDarkMode');
      expect(result.current).not.toHaveProperty('toggleTheme');
      expect(result.current).not.toHaveProperty('theme');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useLanguage());
      }).toThrow('useLanguage must be used within a UnifiedPreferencesProvider');

      consoleSpy.mockRestore();
    });

    it('should provide working translation function', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.t('home')).toBe('Home');
      expect(result.current.t('settings')).toBe('Settings');
    });
  });

  describe('useTheme', () => {
    it('should return only theme-related values', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toHaveProperty('isDarkMode');
      expect(result.current).toHaveProperty('toggleTheme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('theme');
      
      // Should not have language properties
      expect(result.current).not.toHaveProperty('currentLanguage');
      expect(result.current).not.toHaveProperty('changeLanguage');
      expect(result.current).not.toHaveProperty('t');
      expect(result.current).not.toHaveProperty('languages');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a UnifiedPreferencesProvider');

      consoleSpy.mockRestore();
    });

    it('should default to dark mode', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.theme).toBe('dark');
    });
  });
});

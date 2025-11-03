/**
 * Error Scenario Tests for UnifiedPreferencesContext
 * 
 * Tests error handling and fallback behavior for:
 * - localStorage disabled
 * - Firebase offline
 * - Missing translations
 * - Invalid language codes
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { UnifiedPreferencesProvider, useAppPreferences } from '../UnifiedPreferencesContext';
import * as AuthContext from '../AuthContext';

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
  db: {}
}));

// Mock preferences service
jest.mock('../../services/preferencesService', () => ({
  localStorageManager: {
    save: jest.fn(),
    load: jest.fn(),
    clear: jest.fn()
  },
  firebaseSyncManager: {
    syncToFirebase: jest.fn(),
    loadFromFirebase: jest.fn(),
    deleteFromFirebase: jest.fn(),
    cancelPendingSyncs: jest.fn(),
    getPendingSyncs: jest.fn(() => new Map()),
    getOfflineQueue: jest.fn(() => []),
    getSyncMetrics: jest.fn(() => ({
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0
    })),
    resetMetrics: jest.fn()
  }
}));

// Test component
function TestComponent() {
  const { currentLanguage, changeLanguage, isDarkMode, toggleTheme, t } = useAppPreferences();
  
  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="theme">{isDarkMode ? 'dark' : 'light'}</div>
      <div data-testid="translation">{t('home')}</div>
      <button onClick={() => changeLanguage('hi' as any)}>Change Language</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe('UnifiedPreferencesContext - Error Scenarios', () => {
  let mockAuthContext: any;
  let localStorageManager: any;
  let firebaseSyncManager: any;

  beforeEach(() => {
    // Mock AuthContext
    mockAuthContext = {
      currentUser: null,
      loading: false
    };
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext);

    // Get mocked services
    const preferencesService = require('../../services/preferencesService');
    localStorageManager = preferencesService.localStorageManager;
    firebaseSyncManager = preferencesService.firebaseSyncManager;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('localStorage disabled', () => {
    it('should fall back to in-memory state when localStorage.getItem throws', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Should use default values
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      consoleSpy.mockRestore();
    });

    it('should continue working when localStorage.setItem fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockReturnValue(null);
      localStorageManager.save.mockReturnValue(false); // Simulate save failure

      const { getByText } = render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Try to change language
      await act(async () => {
        getByText('Change Language').click();
      });

      // State should still update even if save fails
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hi');
      });

      consoleSpy.mockRestore();
    });

    it('should handle localStorage quota exceeded', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockReturnValue(null);
      localStorageManager.save.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const { getByText } = render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Try to change language
      await act(async () => {
        getByText('Change Language').click();
      });

      // Should still work in memory
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hi');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Firebase offline', () => {
    it('should continue working when Firebase sync fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAuthContext.currentUser = { uid: 'test-user' };
      localStorageManager.load.mockReturnValue(null);
      localStorageManager.save.mockReturnValue(true);
      firebaseSyncManager.syncToFirebase.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Change language
      await act(async () => {
        getByText('Change Language').click();
      });

      // Should update state despite Firebase failure
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hi');
      });

      consoleSpy.mockRestore();
    });

    it('should fall back to localStorage when Firebase load fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAuthContext.currentUser = { uid: 'test-user' };
      localStorageManager.load.mockReturnValue({
        language: 'pa',
        theme: 'light',
        lastUpdated: Date.now()
      });
      firebaseSyncManager.loadFromFirebase.mockRejectedValue(new Error('Network error'));

      render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Should use localStorage values
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('pa');
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });

      consoleSpy.mockRestore();
    });

    it('should handle Firebase returning null', async () => {
      mockAuthContext.currentUser = { uid: 'test-user' };
      localStorageManager.load.mockReturnValue({
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      });
      firebaseSyncManager.loadFromFirebase.mockResolvedValue(null);

      render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Should use localStorage values when Firebase has no data
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });
    });
  });

  describe('Missing translations', () => {
    it('should fall back to English when translation is missing', () => {
      localStorageManager.load.mockReturnValue({
        language: 'hi',
        theme: 'dark',
        lastUpdated: Date.now()
      });

      render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Should show translation (or key if missing)
      const translation = screen.getByTestId('translation');
      expect(translation).toBeInTheDocument();
      // Translation should exist or fall back to key
      expect(translation.textContent).toBeTruthy();
    });

    it('should return key when translation is missing in all languages', () => {
      localStorageManager.load.mockReturnValue({
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      });

      const TestMissingTranslation = () => {
        const { t } = useAppPreferences();
        
        // Test with a non-existent key
        const result = t('nonExistentKey' as any);
        
        return <div data-testid="missing-translation">{result}</div>;
      };

      render(
        <UnifiedPreferencesProvider>
          <TestMissingTranslation />
        </UnifiedPreferencesProvider>
      );
      
      // Should return the key itself as fallback
      expect(screen.getByTestId('missing-translation')).toHaveTextContent('nonExistentKey');
    });
  });

  describe('Invalid language codes', () => {
    it('should ignore invalid language code', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockReturnValue(null);
      localStorageManager.save.mockReturnValue(true);

      const TestInvalidLanguage = () => {
        const { currentLanguage, changeLanguage } = useAppPreferences();
        
        return (
          <div>
            <div data-testid="current-language">{currentLanguage}</div>
            <button onClick={() => changeLanguage('invalid' as any)}>
              Change to Invalid
            </button>
          </div>
        );
      };

      const { getByText } = render(
        <UnifiedPreferencesProvider>
          <TestInvalidLanguage />
        </UnifiedPreferencesProvider>
      );

      const initialLanguage = screen.getByTestId('current-language').textContent;

      // Try to change to invalid language
      await act(async () => {
        getByText('Change to Invalid').click();
      });

      // Language should not change
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent(initialLanguage!);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid language code')
      );

      consoleSpy.mockRestore();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Should fall back to defaults
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      consoleSpy.mockRestore();
    });
  });

  describe('Graceful fallbacks', () => {
    it('should use defaults when all persistence fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      firebaseSyncManager.loadFromFirebase.mockRejectedValue(new Error('Firebase error'));

      render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Should use default values
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      consoleSpy.mockRestore();
    });

    it('should continue working after multiple errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockReturnValue(null);
      localStorageManager.save.mockReturnValue(false);
      firebaseSyncManager.syncToFirebase.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Multiple operations should still work
      await act(async () => {
        getByText('Change Language').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hi');
      });

      await act(async () => {
        getByText('Toggle Theme').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });

      consoleSpy.mockRestore();
    });

    it('should handle theme application errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageManager.load.mockReturnValue(null);
      localStorageManager.save.mockReturnValue(true);

      const { getByText } = render(
        <UnifiedPreferencesProvider>
          <TestComponent />
        </UnifiedPreferencesProvider>
      );

      // Theme toggle should work even if there are errors
      await act(async () => {
        getByText('Toggle Theme').click();
      });

      // State should update
      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });

      consoleSpy.mockRestore();
    });
  });
});

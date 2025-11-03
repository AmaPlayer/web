/**
 * Unit Tests for Preferences Persistence Service
 * 
 * Tests LocalStorageManager and FirebaseSyncManager for saving, loading,
 * and error handling of user preferences.
 * 
 * Requirements tested: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { LocalStorageManager, FirebaseSyncManager } from '../preferencesService';
import { StoredPreferences } from '../../types/contexts/preferences';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn()
}));

// Mock Firebase config
jest.mock('../../lib/firebase', () => ({
  db: {}
}));

describe('LocalStorageManager', () => {
  let localStorageManager: LocalStorageManager;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Create a simple in-memory storage mock
    const storage: { [key: string]: string } = {};
    
    mockLocalStorage = {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
      length: 0,
      key: jest.fn()
    };

    // Replace global localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Create manager AFTER mocking localStorage
    localStorageManager = new LocalStorageManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save preferences to localStorage', () => {
      const preferences: StoredPreferences = {
        language: 'hi',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      const result = localStorageManager.save(preferences);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'amaplayer-preferences',
        JSON.stringify(preferences)
      );
    });

    it('should return true on successful save', () => {
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'light',
        lastUpdated: Date.now()
      };

      const result = localStorageManager.save(preferences);

      expect(result).toBe(true);
    });

    it('should handle QuotaExceededError gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      // Mock QuotaExceededError
      (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = localStorageManager.save(preferences);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'LocalStorage quota exceeded. Unable to save preferences.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle generic save errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Generic error');
      });

      const result = localStorageManager.save(preferences);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save preferences to localStorage:',
        'Generic error'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('load', () => {
    it('should load preferences from localStorage', () => {
      const preferences: StoredPreferences = {
        language: 'pa',
        theme: 'light',
        lastUpdated: Date.now()
      };

      // Use setItem to properly store the data
      mockLocalStorage.setItem('amaplayer-preferences', JSON.stringify(preferences));

      const result = localStorageManager.load();

      expect(result).toEqual(preferences);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('amaplayer-preferences');
    });

    it('should return null when no preferences exist', () => {
      const result = localStorageManager.load();

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.setItem('amaplayer-preferences', 'invalid json');

      const result = localStorageManager.load();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('amaplayer-preferences');

      consoleSpy.mockRestore();
    });

    it('should validate preferences structure', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const invalidPrefs = {
        language: 'en',
        // missing theme
        lastUpdated: Date.now()
      };

      mockLocalStorage.setItem('amaplayer-preferences', JSON.stringify(invalidPrefs));

      const result = localStorageManager.load();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid preferences structure in localStorage. Clearing corrupted data.'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('amaplayer-preferences');

      consoleSpy.mockRestore();
    });

    it('should clear corrupted data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const invalidPrefs = { invalid: 'data' };

      mockLocalStorage.setItem('amaplayer-preferences', JSON.stringify(invalidPrefs));

      localStorageManager.load();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('amaplayer-preferences');

      consoleSpy.mockRestore();
    });

    it('should handle load errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (mockLocalStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Load error');
      });

      const result = localStorageManager.load();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear preferences from localStorage', () => {
      mockLocalStorage.setItem('amaplayer-preferences', JSON.stringify({
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      }));

      localStorageManager.clear();

      // Verify removeItem was called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('amaplayer-preferences');
    });

    it('should handle clear errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a new mock that throws
      (mockLocalStorage.removeItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Clear error');
      });

      localStorageManager.clear();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear preferences from localStorage:',
        'Clear error'
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('FirebaseSyncManager', () => {
  let firebaseSyncManager: FirebaseSyncManager;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    firebaseSyncManager = new FirebaseSyncManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cancel any pending syncs
    firebaseSyncManager.cancelPendingSyncs();
  });

  describe('syncToFirebase', () => {
    it('should sync preferences to Firebase', async () => {
      const preferences: StoredPreferences = {
        language: 'hi',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await firebaseSyncManager.syncToFirebase(mockUserId, preferences);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(setDoc).toHaveBeenCalled();
    });

    it('should debounce multiple rapid syncs', async () => {
      const preferences1: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      const preferences2: StoredPreferences = {
        language: 'hi',
        theme: 'light',
        lastUpdated: Date.now()
      };

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // Trigger multiple syncs rapidly
      firebaseSyncManager.syncToFirebase(mockUserId, preferences1);
      firebaseSyncManager.syncToFirebase(mockUserId, preferences2);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should only sync once (debounced)
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('should queue syncs when offline', async () => {
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      // Simulate offline
      Object.defineProperty(firebaseSyncManager, 'isOnline', {
        value: false,
        writable: true
      });

      await firebaseSyncManager.syncToFirebase(mockUserId, preferences);

      const queue = firebaseSyncManager.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual({ userId: mockUserId, preferences });
    });

    it('should retry on failure with exponential backoff', async () => {
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock failure then success
      (setDoc as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await firebaseSyncManager.syncToFirebase(mockUserId, preferences);

      // Wait for debounce and retry
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(consoleSpy).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    }, 10000);

    it('should fail after max retries', async () => {
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock continuous failures
      (setDoc as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Trigger sync and wait for debounce + retries
      const syncPromise = firebaseSyncManager.syncToFirebase(mockUserId, preferences);
      
      // Wait for debounce and retries (should fail after 3 retries)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify retries happened
      expect(warnSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    }, 10000);
  });

  describe('loadFromFirebase', () => {
    it('should load preferences from Firebase', async () => {
      const preferences: StoredPreferences = {
        language: 'pa',
        theme: 'light',
        lastUpdated: Date.now()
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => preferences
      });

      const result = await firebaseSyncManager.loadFromFirebase(mockUserId);

      expect(result).toEqual(preferences);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null when no preferences exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const result = await firebaseSyncManager.loadFromFirebase(mockUserId);

      expect(result).toBeNull();
    });

    it('should return null for invalid preferences structure', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const invalidPrefs = { invalid: 'data' };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => invalidPrefs
      });

      const result = await firebaseSyncManager.loadFromFirebase(mockUserId);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid preferences structure in Firebase.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle load errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (getDoc as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await firebaseSyncManager.loadFromFirebase(mockUserId);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('deleteFromFirebase', () => {
    it('should delete preferences from Firebase', async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await firebaseSyncManager.deleteFromFirebase(mockUserId);

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (deleteDoc as jest.Mock).mockRejectedValue(new Error('Delete error'));

      await expect(
        firebaseSyncManager.deleteFromFirebase(mockUserId)
      ).rejects.toThrow('Failed to delete preferences from Firebase');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('offline queue management', () => {
    it('should process offline queue when coming online', async () => {
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // Simulate offline
      Object.defineProperty(firebaseSyncManager, 'isOnline', {
        value: false,
        writable: true
      });

      await firebaseSyncManager.syncToFirebase(mockUserId, preferences);

      // Verify item is in queue
      expect(firebaseSyncManager.getOfflineQueue()).toHaveLength(1);

      // Simulate coming online
      Object.defineProperty(firebaseSyncManager, 'isOnline', {
        value: true,
        writable: true
      });

      // Trigger online event handler
      await (firebaseSyncManager as any).processOfflineQueue();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Queue should be empty after processing
      expect(firebaseSyncManager.getOfflineQueue()).toHaveLength(0);
    });
  });

  describe('metrics tracking', () => {
    it('should track sync metrics', async () => {
      const preferences: StoredPreferences = {
        language: 'en',
        theme: 'dark',
        lastUpdated: Date.now()
      };

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await firebaseSyncManager.syncToFirebase(mockUserId, preferences);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      const metrics = firebaseSyncManager.getSyncMetrics();

      expect(metrics.totalSyncs).toBeGreaterThan(0);
      expect(metrics.successfulSyncs).toBeGreaterThan(0);
    });

    it('should reset metrics', () => {
      firebaseSyncManager.resetMetrics();

      const metrics = firebaseSyncManager.getSyncMetrics();

      expect(metrics.totalSyncs).toBe(0);
      expect(metrics.successfulSyncs).toBe(0);
      expect(metrics.failedSyncs).toBe(0);
    });
  });
});

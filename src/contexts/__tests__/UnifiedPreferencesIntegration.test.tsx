/**
 * Integration Tests for UnifiedPreferencesContext
 * 
 * Tests full app integration including provider wrapping, language/theme propagation,
 * preference persistence, and Firebase sync end-to-end.
 * 
 * Requirements tested: 1.1, 3.5, 4.3, 4.4, 4.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedPreferencesProvider, useLanguage, useTheme } from '../UnifiedPreferencesContext';
import { localStorageManager, firebaseSyncManager } from '../../services/preferencesService';
import { StoredPreferences } from '../../types/contexts/preferences';

// Mock AuthContext
const mockCurrentUser = { uid: 'test-user-123' };
const mockUseAuth = jest.fn(() => ({ currentUser: null }));

jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock theme optimization
jest.mock('../../utils/theme/themeOptimization', () => ({
  applyThemeToDOM: jest.fn()
}));

// Mock translations
jest.mock('../../translations', () => ({
  languages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
  ],
  getTranslation: (lang: string, key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: { 
        home: 'Home',
        settings: 'Settings',
        profile: 'Profile',
        welcome: 'Welcome'
      },
      hi: { 
        home: 'होम',
        settings: 'सेटिंग्स',
        profile: 'प्रोफ़ाइल',
        welcome: 'स्वागत है'
      },
      pa: { 
        home: 'ਘਰ',
        settings: 'ਸੈਟਿੰਗਜ਼',
        profile: 'ਪ੍ਰੋਫਾਈਲ',
        welcome: 'ਸੁਆਗਤ ਹੈ'
      }
    };
    return translations[lang]?.[key] || key;
  }
}));

describe('UnifiedPreferencesContext Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentUser: null });
    
    jest.spyOn(localStorageManager, 'load').mockReturnValue(null);
    jest.spyOn(localStorageManager, 'save').mockReturnValue(true);
    jest.spyOn(localStorageManager, 'clear').mockImplementation(() => {});
    
    jest.spyOn(firebaseSyncManager, 'loadFromFirebase').mockResolvedValue(null);
    jest.spyOn(firebaseSyncManager, 'syncToFirebase').mockResolvedValue(undefined);
    jest.spyOn(firebaseSyncManager, 'deleteFromFirebase').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Wraps Entire App', () => {
    it('should provide context to all nested components', async () => {
      const NestedComponent1 = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="nested1">{currentLanguage}</div>;
      };

      const NestedComponent2 = () => {
        const { isDarkMode } = useTheme();
        return <div data-testid="nested2">{isDarkMode ? 'dark' : 'light'}</div>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <div>
            <NestedComponent1 />
            <NestedComponent2 />
          </div>
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('nested1')).toHaveTextContent('en');
        expect(screen.getByTestId('nested2')).toHaveTextContent('dark');
      });
    });

    it('should provide context to deeply nested components', async () => {
      const DeepComponent = () => {
        const { t } = useLanguage();
        return <div data-testid="deep">{t('home')}</div>;
      };

      const MiddleComponent = () => (
        <div>
          <DeepComponent />
        </div>
      );

      const TopComponent = () => (
        <div>
          <MiddleComponent />
        </div>
      );

      const App = () => (
        <UnifiedPreferencesProvider>
          <TopComponent />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('deep')).toHaveTextContent('Home');
      });
    });

    it('should provide context to multiple sibling components', async () => {
      const Component1 = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="comp1">{currentLanguage}</div>;
      };

      const Component2 = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="comp2">{currentLanguage}</div>;
      };

      const Component3 = () => {
        const { isDarkMode } = useTheme();
        return <div data-testid="comp3">{isDarkMode ? 'dark' : 'light'}</div>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
          </div>
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('comp1')).toHaveTextContent('en');
        expect(screen.getByTestId('comp2')).toHaveTextContent('en');
        expect(screen.getByTestId('comp3')).toHaveTextContent('dark');
      });
    });
  });

  describe('Language Changes Propagate to All Components', () => {
    it('should update all components when language changes', async () => {
      const Component1 = () => {
        const { t, changeLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="text1">{t('home')}</div>
            <button onClick={() => changeLanguage('hi')}>Change</button>
          </div>
        );
      };

      const Component2 = () => {
        const { t } = useLanguage();
        return <div data-testid="text2">{t('settings')}</div>;
      };

      const Component3 = () => {
        const { t } = useLanguage();
        return <div data-testid="text3">{t('profile')}</div>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
          </div>
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state - English
      await waitFor(() => {
        expect(screen.getByTestId('text1')).toHaveTextContent('Home');
        expect(screen.getByTestId('text2')).toHaveTextContent('Settings');
        expect(screen.getByTestId('text3')).toHaveTextContent('Profile');
      });

      // Change language
      const button = screen.getByText('Change');
      fireEvent.click(button);

      // All components should update to Hindi
      await waitFor(() => {
        expect(screen.getByTestId('text1')).toHaveTextContent('होम');
        expect(screen.getByTestId('text2')).toHaveTextContent('सेटिंग्स');
        expect(screen.getByTestId('text3')).toHaveTextContent('प्रोफ़ाइल');
      });
    });

    it('should propagate language changes to deeply nested components', async () => {
      const DeepComponent = () => {
        const { t } = useLanguage();
        return <div data-testid="deep">{t('welcome')}</div>;
      };

      const MiddleComponent = () => (
        <div>
          <DeepComponent />
        </div>
      );

      const TopComponent = () => {
        const { changeLanguage } = useLanguage();
        return (
          <div>
            <button onClick={() => changeLanguage('pa')}>Change to Punjabi</button>
            <MiddleComponent />
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <TopComponent />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('deep')).toHaveTextContent('Welcome');
      });

      // Change language
      const button = screen.getByText('Change to Punjabi');
      fireEvent.click(button);

      // Deep component should update
      await waitFor(() => {
        expect(screen.getByTestId('deep')).toHaveTextContent('ਸੁਆਗਤ ਹੈ');
      });
    });

    it('should update currentLanguage in all components simultaneously', async () => {
      const Component1 = () => {
        const { currentLanguage, changeLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="lang1">{currentLanguage}</div>
            <button onClick={() => changeLanguage('hi')}>Change</button>
          </div>
        );
      };

      const Component2 = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="lang2">{currentLanguage}</div>;
      };

      const Component3 = () => {
        const { currentLanguage } = useLanguage();
        return <div data-testid="lang3">{currentLanguage}</div>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
          </div>
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('lang1')).toHaveTextContent('en');
        expect(screen.getByTestId('lang2')).toHaveTextContent('en');
        expect(screen.getByTestId('lang3')).toHaveTextContent('en');
      });

      // Change language
      const button = screen.getByText('Change');
      fireEvent.click(button);

      // All should update
      await waitFor(() => {
        expect(screen.getByTestId('lang1')).toHaveTextContent('hi');
        expect(screen.getByTestId('lang2')).toHaveTextContent('hi');
        expect(screen.getByTestId('lang3')).toHaveTextContent('hi');
      });
    });
  });

  describe('Theme Changes Propagate to All Components', () => {
    it('should update all components when theme changes', async () => {
      const Component1 = () => {
        const { isDarkMode, toggleTheme } = useTheme();
        return (
          <div>
            <div data-testid="theme1">{isDarkMode ? 'dark' : 'light'}</div>
            <button onClick={toggleTheme}>Toggle</button>
          </div>
        );
      };

      const Component2 = () => {
        const { theme } = useTheme();
        return <div data-testid="theme2">{theme}</div>;
      };

      const Component3 = () => {
        const { isDarkMode } = useTheme();
        return <div data-testid="theme3">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</div>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
          </div>
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state - dark mode
      await waitFor(() => {
        expect(screen.getByTestId('theme1')).toHaveTextContent('dark');
        expect(screen.getByTestId('theme2')).toHaveTextContent('dark');
        expect(screen.getByTestId('theme3')).toHaveTextContent('Dark Mode');
      });

      // Toggle theme
      const button = screen.getByText('Toggle');
      fireEvent.click(button);

      // All components should update to light mode
      await waitFor(() => {
        expect(screen.getByTestId('theme1')).toHaveTextContent('light');
        expect(screen.getByTestId('theme2')).toHaveTextContent('light');
        expect(screen.getByTestId('theme3')).toHaveTextContent('Light Mode');
      });
    });

    it('should propagate theme changes to deeply nested components', async () => {
      const DeepComponent = () => {
        const { isDarkMode } = useTheme();
        return <div data-testid="deep-theme">{isDarkMode ? 'dark' : 'light'}</div>;
      };

      const MiddleComponent = () => (
        <div>
          <DeepComponent />
        </div>
      );

      const TopComponent = () => {
        const { toggleTheme } = useTheme();
        return (
          <div>
            <button onClick={toggleTheme}>Toggle Theme</button>
            <MiddleComponent />
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <TopComponent />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('deep-theme')).toHaveTextContent('dark');
      });

      // Toggle theme
      const button = screen.getByText('Toggle Theme');
      fireEvent.click(button);

      // Deep component should update
      await waitFor(() => {
        expect(screen.getByTestId('deep-theme')).toHaveTextContent('light');
      });
    });

    it('should update theme in all components simultaneously', async () => {
      const Component1 = () => {
        const { theme, setTheme } = useTheme();
        return (
          <div>
            <div data-testid="t1">{theme}</div>
            <button onClick={() => setTheme('light')}>Set Light</button>
          </div>
        );
      };

      const Component2 = () => {
        const { theme } = useTheme();
        return <div data-testid="t2">{theme}</div>;
      };

      const Component3 = () => {
        const { theme } = useTheme();
        return <div data-testid="t3">{theme}</div>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <div>
            <Component1 />
            <Component2 />
            <Component3 />
          </div>
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('t1')).toHaveTextContent('dark');
        expect(screen.getByTestId('t2')).toHaveTextContent('dark');
        expect(screen.getByTestId('t3')).toHaveTextContent('dark');
      });

      // Set theme
      const button = screen.getByText('Set Light');
      fireEvent.click(button);

      // All should update
      await waitFor(() => {
        expect(screen.getByTestId('t1')).toHaveTextContent('light');
        expect(screen.getByTestId('t2')).toHaveTextContent('light');
        expect(screen.getByTestId('t3')).toHaveTextContent('light');
      });
    });
  });

  describe('Preferences Persist Across Page Refreshes', () => {
    it('should save language preference to localStorage', async () => {
      const Component = () => {
        const { changeLanguage } = useLanguage();
        return <button onClick={() => changeLanguage('hi')}>Change</button>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      const button = screen.getByText('Change');
      fireEvent.click(button);

      await waitFor(() => {
        expect(localStorageManager.save).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'hi',
            theme: 'dark'
          })
        );
      });
    });

    it('should save theme preference to localStorage', async () => {
      const Component = () => {
        const { toggleTheme } = useTheme();
        return <button onClick={toggleTheme}>Toggle</button>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      const button = screen.getByText('Toggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(localStorageManager.save).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'en',
            theme: 'light'
          })
        );
      });
    });

    it('should load preferences from localStorage on mount', async () => {
      const storedPrefs: StoredPreferences = {
        language: 'pa',
        theme: 'light',
        lastUpdated: Date.now()
      };

      jest.spyOn(localStorageManager, 'load').mockReturnValue(storedPrefs);

      const Component = () => {
        const { currentLanguage } = useLanguage();
        const { theme } = useTheme();
        return (
          <div>
            <div data-testid="lang">{currentLanguage}</div>
            <div data-testid="theme">{theme}</div>
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lang')).toHaveTextContent('pa');
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });
    });

    it('should persist multiple preference changes', async () => {
      const Component = () => {
        const { changeLanguage } = useLanguage();
        const { toggleTheme } = useTheme();
        return (
          <div>
            <button onClick={() => changeLanguage('hi')}>Change Lang</button>
            <button onClick={toggleTheme}>Toggle Theme</button>
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Change language
      const langButton = screen.getByText('Change Lang');
      fireEvent.click(langButton);

      await waitFor(() => {
        expect(localStorageManager.save).toHaveBeenCalledWith(
          expect.objectContaining({ language: 'hi' })
        );
      });

      // Toggle theme
      const themeButton = screen.getByText('Toggle Theme');
      fireEvent.click(themeButton);

      await waitFor(() => {
        expect(localStorageManager.save).toHaveBeenCalledWith(
          expect.objectContaining({ theme: 'light' })
        );
      });
    });
  });

  describe('Firebase Sync End-to-End', () => {
    it('should load preferences from Firebase when user logs in', async () => {
      const firebasePrefs: StoredPreferences = {
        language: 'hi',
        theme: 'light',
        lastUpdated: Date.now()
      };

      jest.spyOn(firebaseSyncManager, 'loadFromFirebase').mockResolvedValue(firebasePrefs);
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const Component = () => {
        const { currentLanguage } = useLanguage();
        const { theme } = useTheme();
        return (
          <div>
            <div data-testid="lang">{currentLanguage}</div>
            <div data-testid="theme">{theme}</div>
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(firebaseSyncManager.loadFromFirebase).toHaveBeenCalledWith(mockCurrentUser.uid);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lang')).toHaveTextContent('hi');
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });
    });

    it('should sync language changes to Firebase when authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const Component = () => {
        const { changeLanguage } = useLanguage();
        return <button onClick={() => changeLanguage('pa')}>Change</button>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Change')).toBeInTheDocument();
      });

      const button = screen.getByText('Change');
      fireEvent.click(button);

      await waitFor(() => {
        expect(firebaseSyncManager.syncToFirebase).toHaveBeenCalledWith(
          mockCurrentUser.uid,
          expect.objectContaining({ language: 'pa' })
        );
      });
    });

    it('should sync theme changes to Firebase when authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const Component = () => {
        const { toggleTheme } = useTheme();
        return <button onClick={toggleTheme}>Toggle</button>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Toggle')).toBeInTheDocument();
      });

      const button = screen.getByText('Toggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(firebaseSyncManager.syncToFirebase).toHaveBeenCalledWith(
          mockCurrentUser.uid,
          expect.objectContaining({ theme: 'light' })
        );
      });
    });

    it('should handle Firebase sync failures gracefully', async () => {
      jest.spyOn(firebaseSyncManager, 'syncToFirebase').mockRejectedValue(
        new Error('Firebase error')
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });

      const Component = () => {
        const { changeLanguage } = useLanguage();
        const { currentLanguage } = useLanguage();
        return (
          <div>
            <div data-testid="lang">{currentLanguage}</div>
            <button onClick={() => changeLanguage('hi')}>Change</button>
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Change')).toBeInTheDocument();
      });

      const button = screen.getByText('Change');
      fireEvent.click(button);

      // Language should still change locally despite Firebase error
      await waitFor(() => {
        expect(screen.getByTestId('lang')).toHaveTextContent('hi');
      });

      consoleSpy.mockRestore();
    });

    it('should not sync to Firebase when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      const Component = () => {
        const { changeLanguage } = useLanguage();
        return <button onClick={() => changeLanguage('hi')}>Change</button>;
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      const button = screen.getByText('Change');
      fireEvent.click(button);

      await waitFor(() => {
        expect(localStorageManager.save).toHaveBeenCalled();
      });

      // Should not call Firebase sync
      expect(firebaseSyncManager.syncToFirebase).not.toHaveBeenCalled();
    });
  });

  describe('Combined Language and Theme Changes', () => {
    it('should handle simultaneous language and theme changes', async () => {
      const Component = () => {
        const { changeLanguage, t } = useLanguage();
        const { toggleTheme, isDarkMode } = useTheme();
        return (
          <div>
            <div data-testid="text">{t('home')}</div>
            <div data-testid="theme">{isDarkMode ? 'dark' : 'light'}</div>
            <button onClick={() => changeLanguage('hi')}>Change Lang</button>
            <button onClick={toggleTheme}>Toggle Theme</button>
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('text')).toHaveTextContent('Home');
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      });

      // Change both
      fireEvent.click(screen.getByText('Change Lang'));
      fireEvent.click(screen.getByText('Toggle Theme'));

      // Both should update
      await waitFor(() => {
        expect(screen.getByTestId('text')).toHaveTextContent('होम');
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
      });
    });

    it('should persist both language and theme changes together', async () => {
      const Component = () => {
        const { changeLanguage } = useLanguage();
        const { setTheme } = useTheme();
        return (
          <div>
            <button onClick={() => {
              changeLanguage('pa');
              setTheme('light');
            }}>Change Both</button>
          </div>
        );
      };

      const App = () => (
        <UnifiedPreferencesProvider>
          <Component />
        </UnifiedPreferencesProvider>
      );

      render(<App />);

      const button = screen.getByText('Change Both');
      fireEvent.click(button);

      await waitFor(() => {
        expect(localStorageManager.save).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'pa',
            theme: 'light'
          })
        );
      });
    });
  });
});

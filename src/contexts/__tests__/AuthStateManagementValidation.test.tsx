import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { auth } from '../../lib/firebase';
import { 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    setPersistence: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  }
}));

jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  onAuthStateChanged: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: { type: 'LOCAL' },
  browserSessionPersistence: { type: 'SESSION' },
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
}));

// Mock services
jest.mock('../../services/notificationService', () => ({
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getAndSaveToken: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../../utils/errorHandler', () => ({
  default: {
    handleAuthError: jest.fn(),
    logError: jest.fn()
  }
}));

jest.mock('../../utils/authErrorHandler', () => ({
  default: {
    getAuthErrorMessage: jest.fn().mockReturnValue({ message: 'Test error', action: 'Try again' }),
    logAuthError: jest.fn(),
    requiresReauthentication: jest.fn().mockReturnValue(false)
  }
}));

// Test component that tracks authentication state changes
const AuthStateTracker: React.FC = () => {
  const { 
    currentUser, 
    login, 
    logout, 
    validateAuthState, 
    refreshAuthToken,
    isGuest 
  } = useAuth();

  const [stateHistory, setStateHistory] = React.useState<string[]>([]);
  const [validationResults, setValidationResults] = React.useState<boolean[]>([]);
  const [tokenRefreshResults, setTokenRefreshResults] = React.useState<boolean[]>([]);

  // Track state changes
  React.useEffect(() => {
    const newState = currentUser ? 
      (currentUser.isAnonymous ? 'guest' : 'authenticated') : 
      'unauthenticated';
    
    setStateHistory(prev => [...prev, newState]);
  }, [currentUser]);

  const handleValidateAuth = async () => {
    try {
      const result = await validateAuthState();
      setValidationResults(prev => [...prev, result]);
    } catch (error) {
      setValidationResults(prev => [...prev, false]);
    }
  };

  const handleRefreshToken = async () => {
    try {
      await refreshAuthToken();
      setTokenRefreshResults(prev => [...prev, true]);
    } catch (error) {
      setTokenRefreshResults(prev => [...prev, false]);
    }
  };

  return (
    <div>
      <div data-testid="current-state">
        {currentUser ? 
          (currentUser.isAnonymous ? 'guest' : `authenticated:${currentUser.email}`) : 
          'unauthenticated'
        }
      </div>
      <div data-testid="state-history">
        {stateHistory.join(' -> ')}
      </div>
      <div data-testid="validation-results">
        {validationResults.map((result, index) => `${index}:${result}`).join(',')}
      </div>
      <div data-testid="token-refresh-results">
        {tokenRefreshResults.map((result, index) => `${index}:${result}`).join(',')}
      </div>
      <div data-testid="guest-status">
        {isGuest() ? 'guest' : 'regular'}
      </div>
      
      <button 
        onClick={() => login('test@example.com', 'password123', true)}
        data-testid="login-local-btn"
      >
        Login (Keep Logged In)
      </button>
      <button 
        onClick={() => login('test@example.com', 'password123', false)}
        data-testid="login-session-btn"
      >
        Login (Session Only)
      </button>
      <button 
        onClick={() => logout()}
        data-testid="logout-btn"
      >
        Logout
      </button>
      <button 
        onClick={handleValidateAuth}
        data-testid="validate-btn"
      >
        Validate Auth
      </button>
      <button 
        onClick={handleRefreshToken}
        data-testid="refresh-token-btn"
      >
        Refresh Token
      </button>
    </div>
  );
};

// Component that simulates multiple UI components using auth state
const MultiComponentAuthTest: React.FC = () => {
  const { currentUser, isGuest } = useAuth();
  
  return (
    <div>
      <div data-testid="header-auth-status">
        Header: {currentUser ? currentUser.email || 'Guest' : 'Not logged in'}
      </div>
      <div data-testid="sidebar-auth-status">
        Sidebar: {isGuest() ? 'Guest mode' : (currentUser ? 'User mode' : 'Login required')}
      </div>
      <div data-testid="content-auth-status">
        Content: {currentUser ? `Welcome ${currentUser.displayName || currentUser.email}` : 'Please log in'}
      </div>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('Authentication State Management Validation', () => {
  let mockUser: Partial<User>;
  let mockGuestUser: Partial<User>;
  let authStateCallback: (user: User | null) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      isAnonymous: false,
      providerData: [{
        providerId: 'password',
        uid: 'test-user-id',
        displayName: 'Test User',
        email: 'test@example.com',
        phoneNumber: null,
        photoURL: null
      }],
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      reload: jest.fn().mockResolvedValue(undefined)
    } as Partial<User>;

    mockGuestUser = {
      uid: 'guest-user-id',
      email: null,
      displayName: null,
      isAnonymous: true,
      providerData: [],
      getIdToken: jest.fn().mockResolvedValue('guest-token'),
      reload: jest.fn().mockResolvedValue(undefined)
    } as Partial<User>;

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return jest.fn(); // unsubscribe function
    });

    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser
    } as UserCredential);

    (setPersistence as jest.Mock).mockResolvedValue(undefined);
    (signOut as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Authentication State Updates Across Components', () => {
    it('should update all components consistently when user logs in', async () => {
      render(
        <TestWrapper>
          <MultiComponentAuthTest />
        </TestWrapper>
      );

      // Initially all components should show unauthenticated state
      expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: Not logged in');
      expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: Login required');
      expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Please log in');

      // Simulate user login
      act(() => {
        authStateCallback(mockUser as User);
      });

      // All components should update consistently
      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: test@example.com');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: User mode');
        expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Welcome Test User');
      });
    });

    it('should update all components consistently when user logs out', async () => {
      render(
        <TestWrapper>
          <MultiComponentAuthTest />
        </TestWrapper>
      );

      // Start with authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: test@example.com');
      });

      // Simulate logout
      act(() => {
        authStateCallback(null);
      });

      // All components should update consistently
      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: Not logged in');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: Login required');
        expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Please log in');
      });
    });

    it('should handle guest to authenticated user transitions consistently', async () => {
      render(
        <TestWrapper>
          <MultiComponentAuthTest />
        </TestWrapper>
      );

      // Start as guest
      act(() => {
        authStateCallback(mockGuestUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: Guest');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: Guest mode');
      });

      // Transition to authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: test@example.com');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: User mode');
        expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Welcome Test User');
      });
    });
  });

  describe('Session Persistence and Expiration Handling', () => {
    it('should validate authentication state correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toHaveTextContent('authenticated:test@example.com');
      });

      // Validate authentication state
      await user.click(screen.getByTestId('validate-btn'));

      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
        expect(screen.getByTestId('validation-results')).toHaveTextContent('0:true');
      });
    });

    it('should handle token refresh successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toHaveTextContent('authenticated:test@example.com');
      });

      // Refresh token
      await user.click(screen.getByTestId('refresh-token-btn'));

      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
        expect(screen.getByTestId('token-refresh-results')).toHaveTextContent('0:true');
      });
    });

    it('should handle token refresh failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock token refresh failure
      const userWithExpiredToken = {
        ...mockUser,
        getIdToken: jest.fn().mockRejectedValue(new Error('Token expired'))
      };

      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Set up user with expired token
      act(() => {
        authStateCallback(userWithExpiredToken as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toHaveTextContent('authenticated:test@example.com');
      });

      // Try to refresh token
      await user.click(screen.getByTestId('refresh-token-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('token-refresh-results')).toHaveTextContent('0:false');
      });

      // Component should still be functional
      expect(screen.getByTestId('current-state')).toBeInTheDocument();
    });

    it('should handle validation failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock validation failure
      const userWithInvalidToken = {
        ...mockUser,
        getIdToken: jest.fn().mockRejectedValue(new Error('Invalid token'))
      };

      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Set up user with invalid token
      act(() => {
        authStateCallback(userWithInvalidToken as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toHaveTextContent('authenticated:test@example.com');
      });

      // Try to validate auth state
      await user.click(screen.getByTestId('validate-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('validation-results')).toHaveTextContent('0:false');
      });

      // Component should handle the error gracefully
      expect(screen.getByTestId('current-state')).toBeInTheDocument();
    });

    it('should set correct persistence for local storage login', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Click login with keep logged in
      await user.click(screen.getByTestId('login-local-btn'));

      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(auth, browserLocalPersistence);
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        );
      });
    });

    it('should set correct persistence for session storage login', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Click login with session only
      await user.click(screen.getByTestId('login-session-btn'));

      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(auth, browserSessionPersistence);
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        );
      });
    });
  });

  describe('Authentication Mode Transitions', () => {
    it('should track state transitions correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Initial state should be unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('state-history')).toHaveTextContent('unauthenticated');
      });

      // Transition to guest
      act(() => {
        authStateCallback(mockGuestUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('state-history')).toHaveTextContent('unauthenticated -> guest');
        expect(screen.getByTestId('guest-status')).toHaveTextContent('guest');
      });

      // Transition to authenticated
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('state-history')).toHaveTextContent('unauthenticated -> guest -> authenticated');
        expect(screen.getByTestId('guest-status')).toHaveTextContent('regular');
      });

      // Logout
      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(auth);
      });
    });

    it('should handle rapid state changes without inconsistencies', async () => {
      render(
        <TestWrapper>
          <MultiComponentAuthTest />
        </TestWrapper>
      );

      // Rapid state changes
      act(() => {
        authStateCallback(mockGuestUser as User);
      });

      act(() => {
        authStateCallback(mockUser as User);
      });

      act(() => {
        authStateCallback(null);
      });

      act(() => {
        authStateCallback(mockUser as User);
      });

      // Final state should be consistent across all components
      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: test@example.com');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: User mode');
        expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Welcome Test User');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle login errors without breaking state management', async () => {
      const user = userEvent.setup();
      
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
        new Error('auth/wrong-password')
      );

      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Try to login with error
      await user.click(screen.getByTestId('login-local-btn'));

      // State should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toHaveTextContent('unauthenticated');
      });

      // Component should still be functional
      expect(screen.getByTestId('login-local-btn')).toBeInTheDocument();
    });

    it('should handle logout errors gracefully', async () => {
      const user = userEvent.setup();
      
      (signOut as jest.Mock).mockRejectedValueOnce(new Error('Logout failed'));

      render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toHaveTextContent('authenticated:test@example.com');
      });

      // Try to logout
      await user.click(screen.getByTestId('logout-btn'));

      // Logout should still be attempted
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(auth);
      });

      // Component should handle the error gracefully
      expect(screen.getByTestId('current-state')).toBeInTheDocument();
    });

    it('should maintain state consistency during network errors', async () => {
      render(
        <TestWrapper>
          <MultiComponentAuthTest />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: test@example.com');
      });

      // Simulate network error (user object becomes null temporarily)
      act(() => {
        authStateCallback(null);
      });

      // All components should consistently show unauthenticated state
      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: Not logged in');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: Login required');
        expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Please log in');
      });

      // Recovery - user comes back
      act(() => {
        authStateCallback(mockUser as User);
      });

      // All components should consistently show authenticated state again
      await waitFor(() => {
        expect(screen.getByTestId('header-auth-status')).toHaveTextContent('Header: test@example.com');
        expect(screen.getByTestId('sidebar-auth-status')).toHaveTextContent('Sidebar: User mode');
        expect(screen.getByTestId('content-auth-status')).toHaveTextContent('Content: Welcome Test User');
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks during rapid state changes', async () => {
      const { unmount } = render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        act(() => {
          authStateCallback(i % 2 === 0 ? mockUser as User : mockGuestUser as User);
        });
      }

      // Component should still be responsive
      await waitFor(() => {
        expect(screen.getByTestId('current-state')).toBeInTheDocument();
      });

      // Cleanup should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component unmounting during authentication operations', async () => {
      const user = userEvent.setup();
      
      const { unmount } = render(
        <TestWrapper>
          <AuthStateTracker />
        </TestWrapper>
      );

      // Start login operation
      const loginPromise = user.click(screen.getByTestId('login-local-btn'));

      // Unmount component before login completes
      unmount();

      // Should not throw errors
      await expect(loginPromise).resolves.not.toThrow();
    });
  });
});
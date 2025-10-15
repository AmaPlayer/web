import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { auth } from '../../lib/firebase';
import { 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signOut,
  User
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

// Mock notification service
jest.mock('../../services/notificationService', () => ({
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getAndSaveToken: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock error handler
jest.mock('../../utils/errorHandler', () => ({
  default: {
    handleAuthError: jest.fn(),
    logError: jest.fn()
  }
}));

// Mock auth error handler
jest.mock('../../utils/authErrorHandler', () => ({
  default: {
    getAuthErrorMessage: jest.fn().mockReturnValue({ message: 'Test error', action: 'Try again' }),
    logAuthError: jest.fn(),
    requiresReauthentication: jest.fn().mockReturnValue(false)
  }
}));

// Test component that uses auth context
const TestComponent: React.FC = () => {
  const { 
    currentUser, 
    login, 
    logout, 
    validateAuthState, 
    refreshAuthToken,
    isGuest 
  } = useAuth();

  return (
    <div>
      <div data-testid="user-status">
        {currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in'}
      </div>
      <div data-testid="guest-status">
        {isGuest() ? 'Guest user' : 'Regular user'}
      </div>
      <button 
        onClick={() => login('test@example.com', 'password123', true)}
        data-testid="login-btn"
      >
        Login
      </button>
      <button 
        onClick={() => logout()}
        data-testid="logout-btn"
      >
        Logout
      </button>
      <button 
        onClick={() => validateAuthState()}
        data-testid="validate-btn"
      >
        Validate Auth
      </button>
      <button 
        onClick={() => refreshAuthToken()}
        data-testid="refresh-token-btn"
      >
        Refresh Token
      </button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Authentication State Management', () => {
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
      providerData: [{ providerId: 'password' }],
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
  });

  describe('Authentication State Updates', () => {
    it('should update UI when user logs in', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initially no user
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');

      // Simulate user login
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });
    });

    it('should update UI when user logs out', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Start with logged in user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Simulate logout
      act(() => {
        authStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });

    it('should distinguish between guest and regular users', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Test guest user
      act(() => {
        authStateCallback(mockGuestUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest-status')).toHaveTextContent('Guest user');
      });

      // Test regular user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest-status')).toHaveTextContent('Regular user');
      });
    });
  });

  describe('Session Persistence and Expiration', () => {
    it('should validate authentication state successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Click validate button
      await user.click(screen.getByTestId('validate-btn'));

      // Verify getIdToken was called for validation
      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      });
    });

    it('should handle token refresh', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Click refresh token button
      await user.click(screen.getByTestId('refresh-token-btn'));

      // Verify getIdToken was called for refresh
      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      });
    });

    it('should handle token refresh failure', async () => {
      const user = userEvent.setup();
      
      // Mock token refresh failure
      const userWithExpiredToken = {
        ...mockUser,
        getIdToken: jest.fn().mockRejectedValue(new Error('Token expired'))
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set up user with expired token
      act(() => {
        authStateCallback(userWithExpiredToken as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Try to refresh token
      await user.click(screen.getByTestId('refresh-token-btn'));

      // Verify error was handled (component should still be functional)
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });
  });

  describe('Authentication Transitions', () => {
    it('should handle transition from guest to authenticated user', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Start as guest
      act(() => {
        authStateCallback(mockGuestUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest-status')).toHaveTextContent('Guest user');
      });

      // Transition to authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest-status')).toHaveTextContent('Regular user');
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });
    });

    it('should handle transition from authenticated to guest user', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Start as authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest-status')).toHaveTextContent('Regular user');
      });

      // Transition to guest
      act(() => {
        authStateCallback(mockGuestUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('guest-status')).toHaveTextContent('Guest user');
      });
    });

    it('should handle login with persistence settings', async () => {
      const user = userEvent.setup();
      
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setPersistence as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Click login button (which calls login with keepLoggedIn: true)
      await user.click(screen.getByTestId('login-btn'));

      // Verify persistence was set to local
      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(auth, browserLocalPersistence);
      });

      // Verify login was called
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('should handle logout', async () => {
      const user = userEvent.setup();
      
      (signOut as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Click logout button
      await user.click(screen.getByTestId('logout-btn'));

      // Verify signOut was called
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(auth);
      });
    });
  });

  describe('Error Handling in State Management', () => {
    it('should handle authentication state validation failure', async () => {
      const user = userEvent.setup();
      
      // Mock validation failure
      const userWithInvalidToken = {
        ...mockUser,
        getIdToken: jest.fn().mockRejectedValue(new Error('Invalid token'))
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set up user with invalid token
      act(() => {
        authStateCallback(userWithInvalidToken as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Try to validate auth state
      await user.click(screen.getByTestId('validate-btn'));

      // Component should handle the error gracefully
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });

    it('should handle logout errors', async () => {
      const user = userEvent.setup();
      
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set up authenticated user
      act(() => {
        authStateCallback(mockUser as User);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Try to logout
      await user.click(screen.getByTestId('logout-btn'));

      // Verify signOut was called even though it failed
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(auth);
      });

      // Component should handle the error gracefully
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });
  });

  describe('Consistent UI Updates', () => {
    it('should maintain consistent state across multiple components', async () => {
      const SecondTestComponent: React.FC = () => {
        const { currentUser } = useAuth();
        return (
          <div data-testid="second-component">
            {currentUser ? `Second: ${currentUser.email}` : 'Second: Not logged in'}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
          <SecondTestComponent />
        </TestWrapper>
      );

      // Both components should show not logged in initially
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('second-component')).toHaveTextContent('Second: Not logged in');

      // Simulate user login
      act(() => {
        authStateCallback(mockUser as User);
      });

      // Both components should update consistently
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
        expect(screen.getByTestId('second-component')).toHaveTextContent('Second: test@example.com');
      });
    });
  });
});
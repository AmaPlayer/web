/**
 * End-to-End Authentication Edge Cases Tests
 * 
 * These tests cover edge cases and complex scenarios in authentication flows
 * including social login transitions, persistence edge cases, and error recovery.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@contexts/AuthContext';
import { LanguageProvider } from '@contexts/LanguageContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import Login from '../Login';
import Settings from '@features/settings/pages/Settings';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: 'local',
  browserSessionPersistence: 'session',
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  },
  GoogleAuthProvider: jest.fn(),
  OAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn()
}));

// Mock Firebase lib
jest.mock('@lib/firebase', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock validation utilities
jest.mock('@utils/validation', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validatePasswordConfirmation: jest.fn(),
  validatePasswordForLogin: jest.fn(),
  getPasswordStrengthColor: jest.fn(),
  getPasswordStrengthText: jest.fn()
}));

// Mock auth error handler
jest.mock('@utils/authErrorHandler', () => ({
  default: {
    formatErrorForDisplay: jest.fn(),
    isValidationError: jest.fn(),
    getAuthErrorMessage: jest.fn(),
    logAuthError: jest.fn(),
    requiresReauthentication: jest.fn()
  }
}));

// Mock error handler
jest.mock('@utils/errorHandler', () => ({
  default: {
    handleAuthError: jest.fn(),
    logError: jest.fn()
  }
}));

// Mock notification service
jest.mock('@services/notificationService', () => ({
  default: {
    initialize: jest.fn(),
    getAndSaveToken: jest.fn()
  }
}));

// Mock React Router navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ role: 'athlete' })
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  User: () => <div data-testid="user-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Bell: () => <div data-testid="bell-icon" />
}));

// Mock components
jest.mock('@components/common/ui/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <button data-testid="theme-toggle">Theme</button>;
  };
});

jest.mock('@components/common/forms/LanguageSelector', () => {
  return function MockLanguageSelector() {
    return <select data-testid="language-selector"><option>English</option></select>;
  };
});

jest.mock('@components/common/ui/LoadingSpinner', () => {
  return function MockLoadingSpinner({ size, color, className }: any) {
    return <div data-testid="loading-spinner" className={className}>Loading...</div>;
  };
});

jest.mock('@components/common/ui/ToastContainer', () => {
  return function MockToastContainer({ toasts }: any) {
    return (
      <div data-testid="toast-container">
        {toasts?.map((toast: any, index: number) => (
          <div key={index} data-testid={`toast-${toast.type}`}>
            {toast.title}: {toast.message}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('@components/common/ui/ConfirmationDialog', () => {
  return function MockConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm} data-testid="confirm-button">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
      </div>
    );
  };
});

jest.mock('@features/settings/components/AccountSection', () => {
  return function MockAccountSection() {
    return <div data-testid="account-section">Account Information</div>;
  };
});

jest.mock('@features/settings/components/PasswordChangeSection', () => {
  return function MockPasswordChangeSection() {
    return (
      <div data-testid="password-change-section">
        <h3>Password Management</h3>
        <form data-testid="password-change-form">
          <input 
            data-testid="new-password" 
            type="password" 
            placeholder="New password"
          />
          <input 
            data-testid="confirm-password" 
            type="password" 
            placeholder="Confirm password"
          />
          <button type="submit" data-testid="set-password-button">
            Set Password
          </button>
        </form>
      </div>
    );
  };
});

// Mock hooks
jest.mock('@hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn()
  })
}));

jest.mock('@hooks/useConfirmation', () => ({
  useConfirmation: () => ({
    confirmationState: {
      isOpen: false,
      title: '',
      message: '',
      confirmText: '',
      cancelText: '',
      variant: 'info',
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      isLoading: false
    },
    showConfirmation: jest.fn(),
    hideConfirmation: jest.fn()
  })
}));

jest.mock('@hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: jest.fn()
}));

// Test utilities
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
};

const mockValidation = () => {
  const { validateEmail, validatePassword, validatePasswordConfirmation } = require('@utils/validation');
  
  validateEmail.mockReturnValue({ isValid: true });
  validatePassword.mockReturnValue({
    isValid: true,
    strength: 'strong',
    score: 85,
    requirements: {
      minLength: true,
      hasLowercase: true,
      hasUppercase: true,
      hasNumber: true,
      hasSpecialChar: false
    }
  });
  validatePasswordConfirmation.mockReturnValue({ isValid: true });
};

const mockAuthErrorHandler = () => {
  const authErrorHandler = require('@utils/authErrorHandler').default;
  
  authErrorHandler.formatErrorForDisplay.mockReturnValue({
    message: 'Success',
    action: '',
    canRetry: false
  });
  authErrorHandler.isValidationError.mockReturnValue(false);
  authErrorHandler.getAuthErrorMessage.mockReturnValue({
    message: 'Success',
    action: '',
    severity: 'success'
  });
  authErrorHandler.requiresReauthentication.mockReturnValue(false);
};

describe('Authentication Edge Cases E2E Tests', () => {
  const mockEmailUser = {
    uid: 'email-user-123',
    email: 'email@example.com',
    displayName: 'Email User',
    providerData: [{ providerId: 'password' }],
    isAnonymous: false,
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    reload: jest.fn().mockResolvedValue(undefined)
  };

  const mockSocialUser = {
    uid: 'social-user-123',
    email: 'social@example.com',
    displayName: 'Social User',
    providerData: [{ providerId: 'google.com' }],
    isAnonymous: false,
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    reload: jest.fn().mockResolvedValue(undefined)
  };

  const mockMixedUser = {
    uid: 'mixed-user-123',
    email: 'mixed@example.com',
    displayName: 'Mixed User',
    providerData: [
      { providerId: 'google.com' },
      { providerId: 'password' }
    ],
    isAnonymous: false,
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    reload: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidation();
    mockAuthErrorHandler();
    
    // Mock successful auth state by default
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockEmailUser);
      return jest.fn();
    });
  });

  describe('Social Login Edge Cases', () => {
    it('should handle Google login popup blocked fallback to redirect', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock popup blocked error, then successful redirect
      const popupBlockedError = { 
        code: 'auth/popup-blocked', 
        message: 'Popup blocked by browser' 
      };
      (signInWithPopup as jest.Mock).mockRejectedValue(popupBlockedError);
      (signInWithRedirect as jest.Mock).mockResolvedValue(undefined);
      (getRedirectResult as jest.Mock).mockResolvedValue({
        user: mockSocialUser
      });

      const errorHandler = require('@utils/errorHandler').default;

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Click Google login button
      await user.click(screen.getByText(/join amaplayer with google/i));

      // Verify popup was attempted first
      expect(signInWithPopup).toHaveBeenCalled();

      // Verify fallback to redirect
      await waitFor(() => {
        expect(signInWithRedirect).toHaveBeenCalled();
      });

      // Verify error logging
      expect(errorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'Auth-GoogleLogin-Fallback',
        'warning',
        expect.objectContaining({
          fallbackMethod: 'redirect',
          originalError: 'auth/popup-blocked'
        })
      );
    });

    it('should handle Google login CORS policy errors', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock CORS error
      const corsError = { 
        code: 'auth/unauthorized-domain',
        message: 'Cross-Origin-Opener-Policy error' 
      };
      (signInWithPopup as jest.Mock).mockRejectedValue(corsError);
      (signInWithRedirect as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Click Google login button
      await user.click(screen.getByText(/join amaplayer with google/i));

      // Verify popup was attempted
      expect(signInWithPopup).toHaveBeenCalled();

      // Verify fallback to redirect for CORS issues
      await waitFor(() => {
        expect(signInWithRedirect).toHaveBeenCalled();
      });
    });

    it('should handle Apple login with additional scopes', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock successful Apple login
      const mockAppleProvider = {
        addScope: jest.fn()
      };
      (OAuthProvider as unknown as jest.Mock).mockReturnValue(mockAppleProvider);
      (signInWithPopup as jest.Mock).mockResolvedValue({
        user: {
          ...mockSocialUser,
          providerData: [{ providerId: 'apple.com' }]
        }
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Click Apple login button
      await user.click(screen.getByText(/sign in with apple/i));

      // Verify Apple provider was configured with scopes
      expect(OAuthProvider).toHaveBeenCalledWith('apple.com');
      expect(mockAppleProvider.addScope).toHaveBeenCalledWith('email');
      expect(mockAppleProvider.addScope).toHaveBeenCalledWith('name');
      expect(signInWithPopup).toHaveBeenCalledWith(expect.anything(), mockAppleProvider);
    });
  });

  describe('Persistence Edge Cases', () => {
    it('should handle persistence setting failures gracefully', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock persistence setting failure
      (setPersistence as jest.Mock).mockRejectedValue(new Error('Persistence not supported'));
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockEmailUser
      });

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.formatErrorForDisplay.mockReturnValue({
        message: 'Login successful',
        action: '',
        canRetry: false
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify login still proceeds despite persistence failure
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      // Verify error is logged but doesn't block login
      expect(authErrorHandler.logAuthError).toHaveBeenCalled();
    });

    it('should handle browser storage limitations', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock storage quota exceeded
      const storageError = { 
        code: 'auth/quota-exceeded',
        message: 'Storage quota exceeded' 
      };
      (setPersistence as jest.Mock).mockRejectedValue(storageError);
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockEmailUser
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form with "keep me logged in" enabled
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      
      const keepLoggedInCheckbox = screen.getByRole('checkbox');
      expect(keepLoggedInCheckbox).toBeChecked();
      
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify login still works despite storage limitations
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Password Change Edge Cases', () => {
    it('should handle social user transitioning to email/password', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock social user setting password for first time
      (updatePassword as jest.Mock).mockResolvedValue(undefined);

      // Start with social user
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockSocialUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Verify social user password setting interface
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();

      // Fill in new password (no current password required for social users)
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password setting
      await user.click(screen.getByTestId('set-password-button'));

      // Verify password was set without reauthentication
      await waitFor(() => {
        expect(updatePassword).toHaveBeenCalledWith(
          expect.anything(),
          'newpass123!'
        );
      });

      expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('should handle mixed provider user password change', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock mixed user (has both social and email providers)
      (updatePassword as jest.Mock).mockResolvedValue(undefined);

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockMixedUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // For mixed users, should be treated as social user for password setting
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();

      // Fill in new password
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password change
      await user.click(screen.getByTestId('set-password-button'));

      // Verify password update was called
      await waitFor(() => {
        expect(updatePassword).toHaveBeenCalledWith(
          expect.anything(),
          'newpass123!'
        );
      });
    });

    it('should handle password change with concurrent session changes', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock session change during password update
      const sessionChangeError = { 
        code: 'auth/user-token-expired',
        message: 'User token expired' 
      };
      (updatePassword as jest.Mock).mockRejectedValue(sessionChangeError);

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.requiresReauthentication.mockReturnValue(true);
      authErrorHandler.getAuthErrorMessage.mockReturnValue({
        message: 'Session expired during password change',
        action: 'Please log out and log back in',
        severity: 'warning'
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Fill in new password
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password change
      await user.click(screen.getByTestId('set-password-button'));

      // Verify session expiration is handled
      await waitFor(() => {
        expect(authErrorHandler.requiresReauthentication).toHaveBeenCalledWith(sessionChangeError);
      });
    });
  });

  describe('Authentication State Edge Cases', () => {
    it('should handle rapid authentication state changes', async () => {
      const TestWrapper = createTestWrapper();

      let authCallback: ((user: any) => void) | null = null;

      // Mock rapid state changes
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        authCallback = callback;
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Simulate rapid state changes
      act(() => {
        authCallback?.(null);
      });

      act(() => {
        authCallback?.(mockEmailUser);
      });

      act(() => {
        authCallback?.(null);
      });

      act(() => {
        authCallback?.(mockSocialUser);
      });

      // Verify component handles rapid changes without crashing
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });

    it('should handle authentication state with corrupted user data', async () => {
      const TestWrapper = createTestWrapper();

      // Mock corrupted user data
      const corruptedUser = {
        uid: 'corrupted-user',
        email: null,
        displayName: null,
        providerData: [],
        isAnonymous: false,
        getIdToken: jest.fn().mockRejectedValue(new Error('Token corrupted')),
        reload: jest.fn().mockRejectedValue(new Error('Reload failed'))
      };

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(corruptedUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Verify settings still render despite corrupted user data
      expect(screen.getByTestId('account-section')).toBeInTheDocument();
    });

    it('should handle network disconnection during authentication', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock network disconnection
      const networkError = { 
        code: 'auth/network-request-failed',
        message: 'Network request failed' 
      };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(networkError);

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.formatErrorForDisplay.mockReturnValue({
        message: 'Network connection failed',
        action: 'Check your internet connection and try again',
        canRetry: true
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify network error is displayed with retry option
      await waitFor(() => {
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Test retry functionality
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockEmailUser
      });
      authErrorHandler.formatErrorForDisplay.mockReturnValue({
        message: 'Login successful',
        action: '',
        canRetry: false
      });

      await user.click(screen.getByText(/retry/i));

      // Verify retry attempt
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle browsers with disabled localStorage', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock localStorage disabled
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true
      });

      (setPersistence as jest.Mock).mockRejectedValue(new Error('localStorage not available'));
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockEmailUser
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form with "keep me logged in" enabled
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify login still works despite localStorage issues
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });

    it('should handle browsers with disabled cookies', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock cookies disabled scenario
      (setPersistence as jest.Mock).mockRejectedValue(new Error('Cookies disabled'));
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockEmailUser
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Uncheck "keep me logged in" to use session storage
      const keepLoggedInCheckbox = screen.getByRole('checkbox');
      await user.click(keepLoggedInCheckbox);
      expect(keepLoggedInCheckbox).not.toBeChecked();

      // Fill in login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify login attempts session persistence
      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(expect.anything(), browserSessionPersistence);
      });
    });
  });

  describe('Concurrent Operation Edge Cases', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock delayed login response
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      (signInWithEmailAndPassword as jest.Mock).mockReturnValue(loginPromise);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');

      // Click login button multiple times rapidly
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      // Verify button is disabled during loading
      expect(loginButton).toBeDisabled();

      // Resolve the login
      act(() => {
        resolveLogin!({ user: mockEmailUser });
      });

      // Verify only one login attempt was made
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle logout during password change', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock logout during password change
      let authCallback: ((user: any) => void) | null = null;
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(mockEmailUser); // Start authenticated
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Start password change process
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Simulate logout during password change
      act(() => {
        authCallback?.(null);
      });

      // Verify component handles logout gracefully
      // Settings should still be rendered but may show different content
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();
    });
  });
});

// Mark test as completed
console.log('✅ Authentication Edge Cases E2E tests completed');
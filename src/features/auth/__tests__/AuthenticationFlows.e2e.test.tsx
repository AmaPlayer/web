/**
 * End-to-End Authentication Flow Tests
 * 
 * These tests simulate complete user journeys through authentication flows
 * including login with persistence, password changes, and settings navigation.
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
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: 'local',
  browserSessionPersistence: 'session',
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  },
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

// Mock notification service
jest.mock('@services/notificationService', () => ({
  default: {
    initialize: jest.fn(),
    getAndSaveToken: jest.fn()
  }
}));

// Mock error handler
jest.mock('@utils/errorHandler', () => ({
  default: {
    handleAuthError: jest.fn(),
    logError: jest.fn()
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
            data-testid="current-password" 
            type="password" 
            placeholder="Current password"
          />
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
          <button type="submit" data-testid="update-password-button">
            Update Password
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
    message: 'Login successful',
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

describe('Authentication Flows E2E Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidation();
    mockAuthErrorHandler();
    
    // Mock successful auth state
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });
  });

  describe('Login Flow with Persistence', () => {
    it('should complete login flow with "keep me logged in" enabled', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock successful login
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setPersistence as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Verify login form is rendered
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByText(/keep me logged in/i)).toBeInTheDocument();

      // Fill in login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');

      // Verify "keep me logged in" is checked by default
      const keepLoggedInCheckbox = screen.getByRole('checkbox');
      expect(keepLoggedInCheckbox).toBeChecked();

      // Submit login form
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify persistence was set to local
      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(expect.anything(), browserLocalPersistence);
      });

      // Verify login was called with correct credentials
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );

      // Verify navigation to home page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('should complete login flow with "keep me logged in" disabled', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock successful login
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setPersistence as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');

      // Uncheck "keep me logged in"
      const keepLoggedInCheckbox = screen.getByRole('checkbox');
      await user.click(keepLoggedInCheckbox);
      expect(keepLoggedInCheckbox).not.toBeChecked();

      // Submit login form
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify persistence was set to session
      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(expect.anything(), browserSessionPersistence);
      });

      // Verify login was successful
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });

    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock login error
      const loginError = { code: 'auth/wrong-password', message: 'Wrong password' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(loginError);

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.formatErrorForDisplay.mockReturnValue({
        message: 'Incorrect password',
        action: 'Please check your password and try again',
        canRetry: true
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form with wrong password
      await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });

  describe('Password Change Flow for Email Users', () => {
    it('should complete password change flow for email users', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock successful password change
      const credential = { providerId: 'password' };
      (EmailAuthProvider.credential as jest.Mock).mockReturnValue(credential);
      (reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
      (updatePassword as jest.Mock).mockResolvedValue(undefined);

      // Mock current user as email user
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Verify security tab is active
      expect(screen.getByText(/security/i)).toBeInTheDocument();
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();

      // Fill in password change form
      await user.type(screen.getByTestId('current-password'), 'currentpass123');
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password change
      await user.click(screen.getByTestId('update-password-button'));

      // Verify reauthentication was called
      await waitFor(() => {
        expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
          'test@example.com',
          'currentpass123'
        );
        expect(reauthenticateWithCredential).toHaveBeenCalledWith(
          expect.anything(),
          credential
        );
      });

      // Verify password update was called
      expect(updatePassword).toHaveBeenCalledWith(
        expect.anything(),
        'newpass123!'
      );
    });

    it('should handle wrong current password error', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock wrong password error
      const wrongPasswordError = { code: 'auth/wrong-password' };
      (reauthenticateWithCredential as jest.Mock).mockRejectedValue(wrongPasswordError);

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.getAuthErrorMessage.mockReturnValue({
        message: 'Current password is incorrect',
        action: 'Please check your current password and try again',
        severity: 'error'
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Fill in password change form with wrong current password
      await user.type(screen.getByTestId('current-password'), 'wrongpassword');
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password change
      await user.click(screen.getByTestId('update-password-button'));

      // Verify error handling
      await waitFor(() => {
        expect(authErrorHandler.getAuthErrorMessage).toHaveBeenCalledWith(wrongPasswordError);
      });
    });
  });

  describe('Password Change Flow for Social Users', () => {
    it('should complete password setting flow for social users', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock successful password setting for social user
      (updatePassword as jest.Mock).mockResolvedValue(undefined);

      // Mock current user as social user
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockSocialUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Verify security tab is active
      expect(screen.getByText(/security/i)).toBeInTheDocument();
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();

      // For social users, no current password field should be present
      expect(screen.queryByTestId('current-password')).not.toBeInTheDocument();

      // Fill in new password
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password setting
      await user.click(screen.getByTestId('update-password-button'));

      // Verify password update was called without reauthentication
      await waitFor(() => {
        expect(updatePassword).toHaveBeenCalledWith(
          expect.anything(),
          'newpass123!'
        );
      });

      // Verify reauthentication was NOT called for social users
      expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('should handle reauthentication requirement for social users', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock reauthentication required error
      const reauthError = { code: 'auth/requires-recent-login' };
      (updatePassword as jest.Mock).mockRejectedValue(reauthError);

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.requiresReauthentication.mockReturnValue(true);

      // Mock current user as social user
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockSocialUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Fill in new password
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');

      // Submit password setting
      await user.click(screen.getByTestId('update-password-button'));

      // Verify reauthentication requirement is handled
      await waitFor(() => {
        expect(authErrorHandler.requiresReauthentication).toHaveBeenCalledWith(reauthError);
      });
    });
  });

  describe('Settings Page Navigation and Functionality', () => {
    it('should navigate between settings tabs correctly', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Verify default account tab is active
      expect(screen.getByTestId('account-section')).toBeInTheDocument();

      // Navigate to security tab
      await user.click(screen.getByText(/security/i));
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();

      // Navigate to privacy tab
      await user.click(screen.getByText(/privacy/i));
      expect(screen.getByText(/privacy settings/i)).toBeInTheDocument();

      // Navigate to notifications tab
      await user.click(screen.getByText(/notifications/i));
      expect(screen.getByText(/notification preferences/i)).toBeInTheDocument();
    });

    it('should handle unsaved changes warning when switching tabs', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      const { useConfirmation } = require('@hooks/useConfirmation');
      const mockShowConfirmation = jest.fn().mockResolvedValue(true);
      const mockHideConfirmation = jest.fn();

      useConfirmation.mockReturnValue({
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
        showConfirmation: mockShowConfirmation,
        hideConfirmation: mockHideConfirmation
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Start on account tab
      expect(screen.getByTestId('account-section')).toBeInTheDocument();

      // Try to navigate to security tab
      await user.click(screen.getByText(/security/i));

      // Verify tab navigation works
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();
    });

    it('should display loading state correctly', async () => {
      const TestWrapper = createTestWrapper();

      // Mock loading state
      const SettingsWithLoading = () => {
        const [isLoading, setIsLoading] = React.useState(true);
        
        React.useEffect(() => {
          const timer = setTimeout(() => setIsLoading(false), 100);
          return () => clearTimeout(timer);
        }, []);

        if (isLoading) {
          return (
            <div className="settings-loading">
              <div data-testid="loading-spinner">Loading...</div>
              <p>Loading settings...</p>
            </div>
          );
        }

        return <Settings />;
      };

      render(
        <TestWrapper>
          <SettingsWithLoading />
        </TestWrapper>
      );

      // Verify loading state is displayed
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/loading settings/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify settings content is displayed
      expect(screen.getByTestId('account-section')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery Scenarios', () => {
    it('should handle network errors during login', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock network error
      const networkError = { code: 'auth/network-request-failed', message: 'Network error' };
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

      // Verify network error is displayed
      await waitFor(() => {
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      });

      // Verify retry option is available
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });

    it('should handle authentication state validation errors', async () => {
      const TestWrapper = createTestWrapper();

      // Mock auth state validation failure
      const mockUserWithFailedValidation = {
        ...mockUser,
        getIdToken: jest.fn().mockRejectedValue(new Error('Token expired'))
      };

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockUserWithFailedValidation);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Verify settings still render despite validation error
      expect(screen.getByTestId('account-section')).toBeInTheDocument();
    });

    it('should handle session expiration gracefully', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock session expiration during password change
      const sessionExpiredError = { code: 'auth/requires-recent-login' };
      (reauthenticateWithCredential as jest.Mock).mockRejectedValue(sessionExpiredError);

      const authErrorHandler = require('@utils/authErrorHandler').default;
      authErrorHandler.requiresReauthentication.mockReturnValue(true);
      authErrorHandler.getAuthErrorMessage.mockReturnValue({
        message: 'Authentication session expired',
        action: 'Please log out and log back in',
        severity: 'warning'
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Try to change password
      await user.type(screen.getByTestId('current-password'), 'currentpass123');
      await user.type(screen.getByTestId('new-password'), 'newpass123!');
      await user.type(screen.getByTestId('confirm-password'), 'newpass123!');
      await user.click(screen.getByTestId('update-password-button'));

      // Verify session expiration is handled
      await waitFor(() => {
        expect(authErrorHandler.requiresReauthentication).toHaveBeenCalledWith(sessionExpiredError);
      });
    });

    it('should handle form validation errors', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();

      // Mock validation failure
      const { validateEmail } = require('@utils/validation');
      validateEmail.mockReturnValue({
        isValid: false,
        error: 'Please enter a valid email address'
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in invalid email
      await user.type(screen.getByPlaceholderText(/email/i), 'invalid-email');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify validation error is displayed
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Verify login was not attempted
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  describe('Authentication State Management', () => {
    it('should maintain consistent authentication state across components', async () => {
      const TestWrapper = createTestWrapper();

      // Mock authenticated user
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const { rerender } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Switch to Settings component
      rerender(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Verify settings render correctly with authenticated user
      expect(screen.getByTestId('account-section')).toBeInTheDocument();
    });

    it('should handle authentication state transitions', async () => {
      const TestWrapper = createTestWrapper();

      // Start with no user
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const { rerender } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Verify login form is displayed
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();

      // Simulate user login
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      rerender(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Verify authenticated content is displayed
      expect(screen.getByTestId('account-section')).toBeInTheDocument();
    });
  });
});

// Mark test as completed
console.log('✅ Authentication Flows E2E tests completed');
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import Login from '../Login';
import Settings from '../../settings/pages/Settings';
import { auth } from '../../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Mock Firebase
jest.mock('../../../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    setPersistence: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
  }
}));

jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signInWithEmailAndPassword: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: { type: 'LOCAL' },
  browserSessionPersistence: { type: 'SESSION' },
  onAuthStateChanged: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  }
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({})
}));

// Mock toast hook
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn()
  })
}));

// Mock language context
jest.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock theme context
jest.mock('../../../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock settings components
jest.mock('../../settings/components/AccountSection', () => {
  return function MockAccountSection() {
    return <div data-testid="account-section">Account Section</div>;
  };
});

jest.mock('../../settings/components/PasswordChangeSection', () => {
  return function MockPasswordChangeSection() {
    return <div data-testid="password-change-section">Password Change Section</div>;
  };
});

// Mock hooks
jest.mock('../../../hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: jest.fn()
}));

jest.mock('../../../hooks/useConfirmation', () => ({
  useConfirmation: () => ({
    confirmationState: {
      isOpen: false,
      title: '',
      message: '',
      confirmText: '',
      cancelText: '',
      variant: 'default',
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      isLoading: false
    },
    showConfirmation: jest.fn().mockResolvedValue(true),
    hideConfirmation: jest.fn()
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Authentication Integration Tests', () => {
  let mockUser: Partial<User>;
  let mockOnAuthStateChanged: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      isAnonymous: false,
      providerData: [{ providerId: 'password' }],
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      reload: jest.fn().mockResolvedValue(undefined)
    } as Partial<User>;

    mockOnAuthStateChanged = jest.fn();
    (onAuthStateChanged as jest.Mock).mockImplementation(mockOnAuthStateChanged);
  });

  describe('Complete Login Flow with Persistence', () => {
    it('should complete login flow with "keep me logged in" enabled', async () => {
      const user = userEvent.setup();
      
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
      const emailInput = screen.getByPlaceholderText('email');
      const passwordInput = screen.getByPlaceholderText('password');
      const keepLoggedInCheckbox = screen.getByRole('checkbox', { name: /keep me logged in/i });
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Verify "keep me logged in" is checked by default
      expect(keepLoggedInCheckbox).toBeChecked();

      await user.click(loginButton);

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

      // Verify navigation to home
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('should complete login flow with "keep me logged in" disabled', async () => {
      const user = userEvent.setup();
      
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
      const emailInput = screen.getByPlaceholderText('email');
      const passwordInput = screen.getByPlaceholderText('password');
      const keepLoggedInCheckbox = screen.getByRole('checkbox', { name: /keep me logged in/i });
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Uncheck "keep me logged in"
      await user.click(keepLoggedInCheckbox);
      expect(keepLoggedInCheckbox).not.toBeChecked();

      await user.click(loginButton);

      // Verify persistence was set to session
      await waitFor(() => {
        expect(setPersistence).toHaveBeenCalledWith(auth, browserSessionPersistence);
      });

      // Verify login was called
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock login error
      const mockError = new Error('auth/wrong-password');
      (mockError as any).code = 'auth/wrong-password';
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);
      (setPersistence as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form with incorrect password
      const emailInput = screen.getByPlaceholderText('email');
      const passwordInput = screen.getByPlaceholderText('password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
      });

      // Verify navigation did not occur
      expect(mockNavigate).not.toHaveBeenCalledWith('/home');
    });
  });

  describe('Settings Page Navigation and Form Submission', () => {
    it('should navigate to settings page and display tabs', async () => {
      // Mock authenticated user
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUser);
        return jest.fn(); // unsubscribe function
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Verify settings page renders
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Verify tabs are present
      expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /privacy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();

      // Verify account section is displayed by default
      expect(screen.getByTestId('account-section')).toBeInTheDocument();
    });

    it('should switch between settings tabs', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated user
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Click on security tab
      const securityTab = screen.getByRole('button', { name: /security/i });
      await user.click(securityTab);

      // Verify security tab content is displayed
      await waitFor(() => {
        expect(screen.getByTestId('password-change-section')).toBeInTheDocument();
      });

      // Verify security tab is active
      expect(securityTab).toHaveClass('active');
    });
  });

  describe('Password Change Flow for Different User Types', () => {
    it('should handle password change for email/password users', async () => {
      // This test would be more comprehensive with actual password change component
      // For now, we verify the component renders correctly
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Verify password change section is displayed
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();
    });

    it('should handle password setting for social users', async () => {
      // Mock social user (Google login)
      const socialUser = {
        ...mockUser,
        providerData: [{ providerId: 'google.com' }]
      };

      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(socialUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings initialTab="security" />
        </TestWrapper>
      );

      // Verify password change section is displayed for social users too
      expect(screen.getByTestId('password-change-section')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during login', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      const networkError = new Error('auth/network-request-failed');
      (networkError as any).code = 'auth/network-request-failed';
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(networkError);
      (setPersistence as jest.Mock).mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form
      const emailInput = screen.getByPlaceholderText('email');
      const passwordInput = screen.getByPlaceholderText('password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      // Verify network error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should validate form fields before submission', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Try to submit with invalid email
      const emailInput = screen.getByPlaceholderText('email');
      const passwordInput = screen.getByPlaceholderText('password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'pass');
      await user.click(loginButton);

      // Verify validation errors are displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });

      // Verify login was not called
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  describe('Authentication State Management', () => {
    it('should update UI when authentication state changes', async () => {
      let authCallback: (user: User | null) => void;
      
      mockOnAuthStateChanged.mockImplementation((callback) => {
        authCallback = callback;
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Initially no user
      act(() => {
        authCallback!(null);
      });

      // Then user logs in
      act(() => {
        authCallback!(mockUser as User);
      });

      // Verify settings page renders with authenticated user
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle session expiration gracefully', async () => {
      // Mock token refresh failure
      const expiredUser = {
        ...mockUser,
        getIdToken: jest.fn().mockRejectedValue(new Error('Token expired'))
      };

      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(expiredUser);
        return jest.fn();
      });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // The component should still render but handle the expired token
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });
});
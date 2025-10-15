import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@contexts/AuthContext';
import PasswordChangeSection from '../PasswordChangeSection';
import { validatePassword, validatePasswordConfirmation } from '@utils/validation/validation';

// Mock the auth context
jest.mock('@contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock validation utilities
jest.mock('@utils/validation', () => ({
  validatePassword: jest.fn(),
  validatePasswordConfirmation: jest.fn(),
  validatePasswordForLogin: jest.fn(),
  getPasswordStrengthColor: jest.fn(() => '#22c55e'),
  getPasswordStrengthText: jest.fn(() => 'Strong'),
}));

const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
const mockValidatePasswordConfirmation = validatePasswordConfirmation as jest.MockedFunction<typeof validatePasswordConfirmation>;

describe('PasswordChangeSection', () => {
  const mockChangePassword = jest.fn();
  
  const mockEmailUser = {
    uid: 'email-user-123',
    email: 'user@example.com',
    providerData: [{ providerId: 'password' }]
  };

  const mockSocialUser = {
    uid: 'social-user-123',
    email: 'social@example.com',
    providerData: [{ providerId: 'google.com' }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      currentUser: mockEmailUser,
      changePassword: mockChangePassword,
      isGuest: () => false,
      signup: jest.fn(),
      login: jest.fn(),
      guestLogin: jest.fn(),
      googleLogin: jest.fn(),
      appleLogin: jest.fn(),
      logout: jest.fn(),
      updateUserProfile: jest.fn(),
      refreshAuth: jest.fn(),
      getAuthErrorMessage: jest.fn(),
      validateAuthState: jest.fn(),
      refreshAuthToken: jest.fn(),
    });

    mockValidatePassword.mockReturnValue({
      isValid: true,
      strength: 'strong',
      score: 85,
      requirements: {
        minLength: true,
        hasLowercase: true,
        hasUppercase: true,
        hasNumber: true,
        hasSpecialChar: false,
      }
    });

    mockValidatePasswordConfirmation.mockReturnValue({
      isValid: true
    });
  });

  describe('Email User Password Change', () => {
    it('renders password change form for email users', () => {
      render(<PasswordChangeSection />);
      
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    it('shows user type info for email users', () => {
      render(<PasswordChangeSection />);
      
      expect(screen.getByText(/change your password/i)).toBeInTheDocument();
      expect(screen.getByText(/enter your current password/i)).toBeInTheDocument();
    });

    it('validates form before submission for email users', async () => {
      render(<PasswordChangeSection />);
      
      const submitButton = screen.getByRole('button', { name: /update password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
      });
      
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('successfully changes password for email users', async () => {
      mockChangePassword.mockResolvedValue({
        success: true,
        suggestedAction: 'Password updated successfully'
      });

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'currentPass123' }
      });
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPass123!' }
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPass123!' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));
      
      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('currentPass123', 'NewPass123!', false);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      });
    });

    it('handles password change errors for email users', async () => {
      mockChangePassword.mockResolvedValue({
        success: false,
        error: 'Current password is incorrect',
        suggestedAction: 'Please check your current password and try again'
      });

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'wrongPassword' }
      });
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPass123!' }
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPass123!' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });
  });

  describe('Social User Password Setting', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: mockSocialUser,
        changePassword: mockChangePassword,
        isGuest: () => false,
        signup: jest.fn(),
        login: jest.fn(),
        guestLogin: jest.fn(),
        googleLogin: jest.fn(),
        appleLogin: jest.fn(),
        logout: jest.fn(),
        updateUserProfile: jest.fn(),
        refreshAuth: jest.fn(),
        getAuthErrorMessage: jest.fn(),
        validateAuthState: jest.fn(),
        refreshAuthToken: jest.fn(),
      });
    });

    it('renders password setting form for social users', () => {
      render(<PasswordChangeSection />);
      
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
    });

    it('shows user type info for social users', () => {
      render(<PasswordChangeSection />);
      
      expect(screen.getByText(/setting up password for social account/i)).toBeInTheDocument();
      expect(screen.getByText(/enable email\/password login/i)).toBeInTheDocument();
    });

    it('successfully sets password for social users', async () => {
      mockChangePassword.mockResolvedValue({
        success: true,
        suggestedAction: 'Password set successfully. You can now use email/password to log in.'
      });

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPass123!' }
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPass123!' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /set password/i }));
      
      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('', 'NewPass123!', true);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/password set successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    it('shows password strength indicator', () => {
      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'TestPass123' }
      });
      
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
      expect(screen.getByText(/85\/100/i)).toBeInTheDocument();
    });

    it('shows password requirements', () => {
      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'TestPass123' }
      });
      
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/number/i)).toBeInTheDocument();
    });

    it('validates password confirmation match', async () => {
      mockValidatePasswordConfirmation.mockReturnValue({
        isValid: false,
        error: 'Passwords do not match'
      });

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'TestPass123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'DifferentPass123' }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('disables submit button when validation fails', () => {
      mockValidatePassword.mockReturnValue({
        isValid: false,
        error: 'Password is too weak',
        strength: 'weak',
        score: 20,
        requirements: {
          minLength: false,
          hasLowercase: true,
          hasUppercase: false,
          hasNumber: false,
          hasSpecialChar: false,
        }
      });

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'weak' }
      });
      
      const submitButton = screen.getByRole('button', { name: /update password|set password/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility for all fields', () => {
      render(<PasswordChangeSection />);
      
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      
      // Initially password type
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      
      // Toggle visibility
      const toggleButtons = screen.getAllByLabelText(/show password|hide password/i);
      fireEvent.click(toggleButtons[0]); // New password toggle
      fireEvent.click(toggleButtons[1]); // Confirm password toggle
      
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Reauthentication Handling', () => {
    it('handles reauthentication requirement', async () => {
      mockChangePassword.mockResolvedValue({
        success: false,
        error: 'Recent authentication required for security',
        requiresReauth: true,
        suggestedAction: 'Please log out and log back in, then try setting your password again'
      });

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPass123!' }
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPass123!' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /set password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/recent authentication required/i)).toBeInTheDocument();
        expect(screen.getByText(/please log out and log back in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during password change', async () => {
      mockChangePassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<PasswordChangeSection />);
      
      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPass123!' }
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPass123!' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /set password/i }));
      
      expect(screen.getByText(/setting password/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});

// Mark test as completed
console.log('✅ PasswordChangeSection component tests completed');
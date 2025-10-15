import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { validatePassword } from '@utils/validation/validation';
import authErrorHandler from '@utils/error/authErrorHandler';

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  }
}));

// Mock validation utilities
jest.mock('@utils/validation', () => ({
  validatePassword: jest.fn()
}));

// Mock auth error handler
jest.mock('@utils/authErrorHandler', () => ({
  default: {
    logAuthError: jest.fn(),
    getAuthErrorMessage: jest.fn(),
    requiresReauthentication: jest.fn()
  }
}));

const mockUpdatePassword = updatePassword as jest.MockedFunction<typeof updatePassword>;
const mockReauthenticateWithCredential = reauthenticateWithCredential as jest.MockedFunction<typeof reauthenticateWithCredential>;
const mockEmailAuthProviderCredential = EmailAuthProvider.credential as jest.MockedFunction<typeof EmailAuthProvider.credential>;
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
const mockAuthErrorHandler = authErrorHandler as jest.Mocked<typeof authErrorHandler>;

// Import the changePassword function - we'll need to create a testable version
// Since AuthContext is a React component, we'll test the logic separately
import { changePasswordLogic } from '../AuthContext.testUtils';

describe('AuthContext changePassword method', () => {
  const mockEmailUser = {
    uid: 'email-user-123',
    email: 'user@example.com',
    providerData: [{ providerId: 'password' }],
    getIdToken: jest.fn()
  };

  const mockSocialUser = {
    uid: 'social-user-123',
    email: 'social@example.com',
    providerData: [{ providerId: 'google.com' }],
    getIdToken: jest.fn()
  };

  const mockSocialUserWithEmailProvider = {
    uid: 'social-user-with-email-123',
    email: 'social@example.com',
    providerData: [
      { providerId: 'google.com' },
      { providerId: 'password' }
    ],
    getIdToken: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful validation
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

    mockAuthErrorHandler.getAuthErrorMessage.mockReturnValue({
      message: 'An error occurred',
      action: 'Please try again',
      severity: 'error'
    });

    mockAuthErrorHandler.requiresReauthentication.mockReturnValue(false);
  });

  describe('Email User Password Change', () => {
    it('successfully changes password for email users', async () => {
      const credential = { providerId: 'password' };
      mockEmailAuthProviderCredential.mockReturnValue(credential as any);
      mockReauthenticateWithCredential.mockResolvedValue(undefined as any);
      mockUpdatePassword.mockResolvedValue(undefined);

      const result = await changePasswordLogic(
        mockEmailUser as any,
        'currentPass123',
        'NewPass123!',
        false
      );

      expect(mockEmailAuthProviderCredential).toHaveBeenCalledWith(
        'user@example.com',
        'currentPass123'
      );
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(
        mockEmailUser,
        credential
      );
      expect(mockUpdatePassword).toHaveBeenCalledWith(mockEmailUser, 'NewPass123!');
      expect(result.success).toBe(true);
      expect(result.suggestedAction).toBe('Password updated successfully');
    });

    it('fails when current password is empty', async () => {
      const result = await changePasswordLogic(
        mockEmailUser as any,
        '',
        'NewPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is required');
      expect(result.suggestedAction).toBe('Please enter your current password to verify your identity');
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('fails when user has no email', async () => {
      const userWithoutEmail = { ...mockEmailUser, email: null };
      
      const result = await changePasswordLogic(
        userWithoutEmail as any,
        'currentPass123',
        'NewPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email address is required to change password');
      expect(result.suggestedAction).toBe('Please ensure your account has an email address');
    });

    it('handles wrong current password error', async () => {
      const wrongPasswordError = { code: 'auth/wrong-password' };
      mockReauthenticateWithCredential.mockRejectedValue(wrongPasswordError);
      mockAuthErrorHandler.getAuthErrorMessage.mockReturnValue({
        message: 'Current password is incorrect',
        action: 'Please check your current password and try again',
        severity: 'error'
      });

      const result = await changePasswordLogic(
        mockEmailUser as any,
        'wrongPassword',
        'NewPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
      expect(result.suggestedAction).toBe('Please check your current password and try again');
    });

    it('handles too many requests error', async () => {
      const tooManyRequestsError = { code: 'auth/too-many-requests' };
      mockReauthenticateWithCredential.mockRejectedValue(tooManyRequestsError);

      const result = await changePasswordLogic(
        mockEmailUser as any,
        'currentPass123',
        'NewPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many failed attempts');
      expect(result.suggestedAction).toBe('Please wait a few minutes before trying again');
    });

    it('handles reauthentication requirement', async () => {
      const reauthError = { code: 'auth/requires-recent-login' };
      mockReauthenticateWithCredential.mockRejectedValue(reauthError);
      mockAuthErrorHandler.requiresReauthentication.mockReturnValue(true);

      const result = await changePasswordLogic(
        mockEmailUser as any,
        'currentPass123',
        'NewPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication session expired');
      expect(result.requiresReauth).toBe(true);
      expect(result.suggestedAction).toBe('Please log out and log back in, then try changing your password');
    });
  });

  describe('Social User Password Setting', () => {
    it('successfully sets password for social users without email provider', async () => {
      mockUpdatePassword.mockResolvedValue(undefined);

      const result = await changePasswordLogic(
        mockSocialUser as any,
        '',
        'NewPass123!',
        true
      );

      expect(mockUpdatePassword).toHaveBeenCalledWith(mockSocialUser, 'NewPass123!');
      expect(result.success).toBe(true);
      expect(result.suggestedAction).toBe('Password set successfully. You can now use email/password to log in.');
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('successfully sets password for social users with email provider', async () => {
      mockUpdatePassword.mockResolvedValue(undefined);

      const result = await changePasswordLogic(
        mockSocialUserWithEmailProvider as any,
        '',
        'NewPass123!',
        true
      );

      expect(mockUpdatePassword).toHaveBeenCalledWith(mockSocialUserWithEmailProvider, 'NewPass123!');
      expect(result.success).toBe(true);
      expect(result.suggestedAction).toBe('Password updated successfully');
    });

    it('fails for social users without email', async () => {
      const socialUserWithoutEmail = { 
        ...mockSocialUser, 
        email: null,
        providerData: [{ providerId: 'google.com' }]
      };

      const result = await changePasswordLogic(
        socialUserWithoutEmail as any,
        '',
        'NewPass123!',
        true
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot set password for this account type');
      expect(result.suggestedAction).toBe('This account was created with a social login and cannot have a password');
    });

    it('handles reauthentication requirement for social users', async () => {
      const reauthError = { code: 'auth/requires-recent-login' };
      mockUpdatePassword.mockRejectedValue(reauthError);

      const result = await changePasswordLogic(
        mockSocialUser as any,
        '',
        'NewPass123!',
        true
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('For security, please log out and log back in first');
      expect(result.requiresReauth).toBe(true);
      expect(result.suggestedAction).toBe('Log out, log back in, then try setting your password');
    });
  });

  describe('Password Validation', () => {
    it('fails when new password does not meet requirements', async () => {
      mockValidatePassword.mockReturnValue({
        isValid: false,
        error: 'Password must be at least 8 characters long',
        suggestions: ['Add 3 more characters'],
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

      const result = await changePasswordLogic(
        mockEmailUser as any,
        'currentPass123',
        'weak',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
      expect(result.suggestedAction).toBe('Add 3 more characters');
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('validates password before attempting change', async () => {
      await changePasswordLogic(
        mockEmailUser as any,
        'currentPass123',
        'NewPass123!',
        false
      );

      expect(mockValidatePassword).toHaveBeenCalledWith('NewPass123!');
    });
  });

  describe('User Type Detection', () => {
    it('correctly identifies email users', async () => {
      const result = await changePasswordLogic(
        mockEmailUser as any,
        'currentPass123',
        'NewPass123!',
        false // explicitly not social user
      );

      expect(mockEmailAuthProviderCredential).toHaveBeenCalled();
      expect(mockReauthenticateWithCredential).toHaveBeenCalled();
    });

    it('correctly identifies social users by provider data', async () => {
      const result = await changePasswordLogic(
        mockSocialUser as any,
        '',
        'NewPass123!',
        false // should be detected as social user
      );

      expect(mockEmailAuthProviderCredential).not.toHaveBeenCalled();
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
      expect(mockUpdatePassword).toHaveBeenCalled();
    });

    it('handles mixed provider data correctly', async () => {
      const result = await changePasswordLogic(
        mockSocialUserWithEmailProvider as any,
        '',
        'NewPass123!',
        true
      );

      expect(result.success).toBe(true);
      expect(result.suggestedAction).toBe('Password updated successfully');
    });
  });

  describe('Error Handling', () => {
    it('handles no authenticated user', async () => {
      const result = await changePasswordLogic(
        null,
        'currentPass123',
        'NewPass123!',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must be logged in to change your password');
      expect(result.suggestedAction).toBe('Please log in and try again');
    });

    it('handles unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      mockUpdatePassword.mockRejectedValue(unexpectedError);

      const result = await changePasswordLogic(
        mockSocialUser as any,
        '',
        'NewPass123!',
        true
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred');
      expect(result.suggestedAction).toBe('Please try again or contact support if the problem persists');
      expect(mockAuthErrorHandler.logAuthError).toHaveBeenCalledWith(
        unexpectedError,
        'AuthContext-ChangePassword',
        expect.any(Object)
      );
    });

    it('logs successful operations', async () => {
      mockUpdatePassword.mockResolvedValue(undefined);

      await changePasswordLogic(
        mockSocialUser as any,
        '',
        'NewPass123!',
        true
      );

      expect(mockAuthErrorHandler.logAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        'AuthContext-ChangePassword',
        expect.objectContaining({
          userId: 'social-user-123',
          userType: 'social'
        })
      );
    });
  });
});

// Mark test as completed
console.log('✅ AuthContext changePassword method tests completed');
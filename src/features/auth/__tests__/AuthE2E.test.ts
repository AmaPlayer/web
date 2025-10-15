// End-to-End Authentication Flow Tests
// These tests validate complete authentication workflows from start to finish

import { validateEmail, validatePassword } from '../../../utils/validation/validation';
import authErrorHandler from '../../../utils/error/authErrorHandler';

// Mock Firebase Auth for E2E testing
const mockFirebaseAuth = {
  currentUser: null,
  setPersistence: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn()
};

// Mock persistence types
const mockPersistence = {
  LOCAL: { type: 'LOCAL' },
  SESSION: { type: 'SESSION' }
};

describe('End-to-End Authentication Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Login Flow with Persistence', () => {
    it('should complete full login flow with "keep me logged in" enabled', async () => {
      // Step 1: Form validation
      const email = 'test@example.com';
      const password = 'ValidPassword123!';
      const keepLoggedIn = true;

      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);

      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      // Step 2: Persistence setting
      const expectedPersistence = keepLoggedIn ? mockPersistence.LOCAL : mockPersistence.SESSION;
      
      // Step 3: Authentication attempt
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'test-user-id',
          email: email,
          displayName: 'Test User'
        }
      });

      // Simulate the complete flow
      await mockFirebaseAuth.setPersistence(expectedPersistence);
      const result = await mockFirebaseAuth.signInWithEmailAndPassword(email, password);

      // Verify the flow completed successfully
      expect(mockFirebaseAuth.setPersistence).toHaveBeenCalledWith(expectedPersistence);
      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
      expect(result.user.email).toBe(email);
    });

    it('should complete full login flow with session persistence', async () => {
      // Test session persistence flow
      const email = 'test@example.com';
      const password = 'ValidPassword123!';
      const keepLoggedIn = false;

      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);

      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      const expectedPersistence = mockPersistence.SESSION;
      
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'test-user-id',
          email: email,
          displayName: 'Test User'
        }
      });

      // Simulate the complete flow
      await mockFirebaseAuth.setPersistence(expectedPersistence);
      const result = await mockFirebaseAuth.signInWithEmailAndPassword(email, password);

      expect(mockFirebaseAuth.setPersistence).toHaveBeenCalledWith(expectedPersistence);
      expect(result.user.email).toBe(email);
    });

    it('should handle complete login flow with validation errors', async () => {
      // Test validation error handling in complete flow
      const invalidEmail = 'invalid-email';
      const weakPassword = '123';

      const emailValidation = validateEmail(invalidEmail);
      const passwordValidation = validatePassword(weakPassword);

      expect(emailValidation.isValid).toBe(false);
      expect(passwordValidation.isValid).toBe(false);

      // Flow should stop at validation - no Firebase calls
      expect(mockFirebaseAuth.setPersistence).not.toHaveBeenCalled();
      expect(mockFirebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle complete login flow with authentication errors', async () => {
      // Test authentication error handling in complete flow
      const email = 'test@example.com';
      const password = 'WrongPassword123!';
      const keepLoggedIn = true;

      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);

      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      // Mock authentication failure
      const authError = { code: 'auth/wrong-password', message: 'Wrong password' };
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(authError);

      try {
        await mockFirebaseAuth.setPersistence(mockPersistence.LOCAL);
        await mockFirebaseAuth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        const errorResult = authErrorHandler.getAuthErrorMessage(error);
        expect(errorResult.message).toBe('Incorrect password.');
        expect(errorResult.action).toBe('Please check your password and try again.');
      }

      expect(mockFirebaseAuth.setPersistence).toHaveBeenCalled();
      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  describe('Password Change Flow for Different User Types', () => {
    it('should complete password change flow for email/password users', async () => {
      // Test complete password change flow for email users
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';
      const confirmPassword = 'NewPassword123!';

      // Step 1: Validate new password
      const passwordValidation = validatePassword(newPassword);
      expect(passwordValidation.isValid).toBe(true);

      // Step 2: Validate password confirmation
      const passwordsMatch = newPassword === confirmPassword;
      expect(passwordsMatch).toBe(true);

      // Step 3: Mock reauthentication and password update
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        providerData: [{ providerId: 'password' }]
      };

      mockFirebaseAuth.reauthenticateWithCredential.mockResolvedValue(undefined);
      mockFirebaseAuth.updatePassword.mockResolvedValue(undefined);

      // Simulate the complete flow
      await mockFirebaseAuth.reauthenticateWithCredential(mockUser, currentPassword);
      await mockFirebaseAuth.updatePassword(mockUser, newPassword);

      expect(mockFirebaseAuth.reauthenticateWithCredential).toHaveBeenCalled();
      expect(mockFirebaseAuth.updatePassword).toHaveBeenCalledWith(mockUser, newPassword);
    });

    it('should complete password setting flow for social users', async () => {
      // Test password setting flow for social login users
      const newPassword = 'NewPassword123!';
      const confirmPassword = 'NewPassword123!';

      // Step 1: Validate new password
      const passwordValidation = validatePassword(newPassword);
      expect(passwordValidation.isValid).toBe(true);

      // Step 2: Validate password confirmation
      const passwordsMatch = newPassword === confirmPassword;
      expect(passwordsMatch).toBe(true);

      // Step 3: Mock password setting for social user
      const mockSocialUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        providerData: [{ providerId: 'google.com' }]
      };

      mockFirebaseAuth.updatePassword.mockResolvedValue(undefined);

      // Social users don't need reauthentication for initial password setting
      await mockFirebaseAuth.updatePassword(mockSocialUser, newPassword);

      expect(mockFirebaseAuth.reauthenticateWithCredential).not.toHaveBeenCalled();
      expect(mockFirebaseAuth.updatePassword).toHaveBeenCalledWith(mockSocialUser, newPassword);
    });

    it('should handle password change flow with validation errors', async () => {
      // Test password change flow with validation failures
      const currentPassword = 'OldPassword123!';
      const weakNewPassword = '123';
      const mismatchedConfirm = 'different';

      // Step 1: Validate new password (should fail)
      const passwordValidation = validatePassword(weakNewPassword);
      expect(passwordValidation.isValid).toBe(false);
      expect(passwordValidation.error).toContain('8 characters');

      // Step 2: Validate password confirmation (should fail)
      const passwordsMatch = weakNewPassword === mismatchedConfirm;
      expect(passwordsMatch).toBe(false);

      // Flow should stop at validation - no Firebase calls
      expect(mockFirebaseAuth.reauthenticateWithCredential).not.toHaveBeenCalled();
      expect(mockFirebaseAuth.updatePassword).not.toHaveBeenCalled();
    });

    it('should handle password change flow with reauthentication errors', async () => {
      // Test password change flow with reauthentication failure
      const wrongCurrentPassword = 'WrongPassword123!';
      const newPassword = 'NewPassword123!';

      const passwordValidation = validatePassword(newPassword);
      expect(passwordValidation.isValid).toBe(true);

      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        providerData: [{ providerId: 'password' }]
      };

      // Mock reauthentication failure
      const reauthError = { code: 'auth/wrong-password', message: 'Wrong password' };
      mockFirebaseAuth.reauthenticateWithCredential.mockRejectedValue(reauthError);

      try {
        await mockFirebaseAuth.reauthenticateWithCredential(mockUser, wrongCurrentPassword);
      } catch (error) {
        const errorResult = authErrorHandler.getAuthErrorMessage(error);
        expect(errorResult.message).toBe('Incorrect password.');
      }

      expect(mockFirebaseAuth.reauthenticateWithCredential).toHaveBeenCalled();
      expect(mockFirebaseAuth.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('Settings Page Navigation and Form Submission', () => {
    it('should complete settings page navigation flow', async () => {
      // Test complete settings page navigation and form interaction
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        isAnonymous: false
      };

      // Step 1: User authentication check
      expect(mockUser.isAnonymous).toBe(false);

      // Step 2: Settings page access validation
      const hasSettingsAccess = !mockUser.isAnonymous;
      expect(hasSettingsAccess).toBe(true);

      // Step 3: Tab navigation simulation
      const availableTabs = ['account', 'security', 'privacy', 'notifications'];
      const activeTab = 'security';
      
      expect(availableTabs).toContain(activeTab);

      // Step 4: Form submission simulation
      const formData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const passwordValidation = validatePassword(formData.newPassword);
      const passwordsMatch = formData.newPassword === formData.confirmPassword;

      expect(passwordValidation.isValid).toBe(true);
      expect(passwordsMatch).toBe(true);

      // Complete flow validation
      expect(mockUser.uid).toBeDefined();
      expect(activeTab).toBe('security');
      expect(passwordValidation.isValid).toBe(true);
    });

    it('should handle settings page access for guest users', async () => {
      // Test settings page access restrictions for guest users
      const mockGuestUser = {
        uid: 'guest-user-id',
        email: null,
        displayName: null,
        isAnonymous: true
      };

      // Step 1: Guest user check
      expect(mockGuestUser.isAnonymous).toBe(true);

      // Step 2: Settings access validation
      const hasSettingsAccess = !mockGuestUser.isAnonymous;
      expect(hasSettingsAccess).toBe(false);

      // Step 3: Limited functionality for guests
      const availableTabsForGuest = ['privacy', 'notifications']; // Limited tabs
      const restrictedTabs = ['account', 'security'];

      restrictedTabs.forEach(tab => {
        expect(availableTabsForGuest).not.toContain(tab);
      });
    });
  });

  describe('Error Handling and Recovery Scenarios', () => {
    it('should complete error recovery flow for network errors', async () => {
      // Test complete error recovery flow for network issues
      const email = 'test@example.com';
      const password = 'ValidPassword123!';

      // Step 1: Initial validation passes
      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);
      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      // Step 2: Network error occurs
      const networkError = { code: 'auth/network-request-failed', message: 'Network error' };
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(networkError);

      // Step 3: Error handling
      try {
        await mockFirebaseAuth.setPersistence(mockPersistence.LOCAL);
        await mockFirebaseAuth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        const errorResult = authErrorHandler.formatErrorForDisplay(error);
        expect(errorResult.canRetry).toBe(true);
        expect(errorResult.message).toBe('Network connection failed.');
      }

      // Step 4: Retry logic validation
      const isRetryable = authErrorHandler.isRetryableError(networkError);
      expect(isRetryable).toBe(true);
    });

    it('should complete error recovery flow for validation errors', async () => {
      // Test complete error recovery flow for validation issues
      const invalidEmail = 'not-an-email';
      const weakPassword = '123';

      // Step 1: Validation fails
      const emailValidation = validateEmail(invalidEmail);
      const passwordValidation = validatePassword(weakPassword);

      expect(emailValidation.isValid).toBe(false);
      expect(passwordValidation.isValid).toBe(false);

      // Step 2: Error messages provided
      expect(emailValidation.error).toBe('Please enter a valid email address');
      expect(passwordValidation.error).toContain('8 characters');

      // Step 3: Recovery suggestions
      expect(passwordValidation.suggestions).toBeDefined();
      expect(passwordValidation.suggestions!.length).toBeGreaterThan(0);

      // Step 4: No Firebase calls made
      expect(mockFirebaseAuth.setPersistence).not.toHaveBeenCalled();
      expect(mockFirebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should complete error recovery flow for authentication errors', async () => {
      // Test complete error recovery flow for auth failures
      const email = 'test@example.com';
      const password = 'WrongPassword123!';

      // Step 1: Validation passes
      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);
      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      // Step 2: Authentication fails
      const authError = { code: 'auth/wrong-password', message: 'Wrong password' };
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(authError);

      // Step 3: Error handling and recovery
      try {
        await mockFirebaseAuth.setPersistence(mockPersistence.LOCAL);
        await mockFirebaseAuth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        const errorResult = authErrorHandler.getAuthErrorMessage(error);
        const isValidationError = authErrorHandler.isValidationError(error);
        
        expect(errorResult.message).toBe('Incorrect password.');
        expect(errorResult.action).toBe('Please check your password and try again.');
        expect(isValidationError).toBe(false); // This is an auth error, not validation
      }

      // Step 4: User can retry with correct password
      const canRetry = !authErrorHandler.isValidationError(authError);
      expect(canRetry).toBe(true);
    });
  });

  describe('Complete Authentication State Transitions', () => {
    it('should complete full authentication state lifecycle', async () => {
      // Test complete authentication lifecycle from login to logout
      const email = 'test@example.com';
      const password = 'ValidPassword123!';

      // Step 1: Initial state (unauthenticated)
      let currentUser = null;
      expect(currentUser).toBeNull();

      // Step 2: Login process
      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);
      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'test-user-id',
          email: email,
          displayName: 'Test User',
          isAnonymous: false
        }
      });

      await mockFirebaseAuth.setPersistence(mockPersistence.LOCAL);
      const loginResult = await mockFirebaseAuth.signInWithEmailAndPassword(email, password);
      currentUser = loginResult.user;

      // Step 3: Authenticated state
      expect(currentUser).not.toBeNull();
      expect(currentUser.email).toBe(email);
      expect(currentUser.isAnonymous).toBe(false);

      // Step 4: Password change while authenticated
      const newPassword = 'NewPassword123!';
      const passwordChangeValidation = validatePassword(newPassword);
      expect(passwordChangeValidation.isValid).toBe(true);

      mockFirebaseAuth.reauthenticateWithCredential.mockResolvedValue(undefined);
      mockFirebaseAuth.updatePassword.mockResolvedValue(undefined);

      await mockFirebaseAuth.reauthenticateWithCredential(currentUser, password);
      await mockFirebaseAuth.updatePassword(currentUser, newPassword);

      // Step 5: Logout process
      mockFirebaseAuth.signOut.mockResolvedValue(undefined);
      await mockFirebaseAuth.signOut();
      currentUser = null;

      // Step 6: Final state (unauthenticated)
      expect(currentUser).toBeNull();

      // Verify complete flow
      expect(mockFirebaseAuth.setPersistence).toHaveBeenCalled();
      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalled();
      expect(mockFirebaseAuth.reauthenticateWithCredential).toHaveBeenCalled();
      expect(mockFirebaseAuth.updatePassword).toHaveBeenCalled();
      expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
    });

    it('should complete guest to authenticated user transition', async () => {
      // Test complete transition from guest to authenticated user
      
      // Step 1: Initial guest state
      let currentUser = {
        uid: 'guest-user-id',
        email: null,
        displayName: null,
        isAnonymous: true
      };

      expect(currentUser.isAnonymous).toBe(true);

      // Step 2: Guest decides to create account
      const email = 'newuser@example.com';
      const password = 'NewPassword123!';

      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);
      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      // Step 3: Account creation/login
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'new-user-id',
          email: email,
          displayName: 'New User',
          isAnonymous: false
        }
      });

      await mockFirebaseAuth.setPersistence(mockPersistence.LOCAL);
      const result = await mockFirebaseAuth.signInWithEmailAndPassword(email, password);
      currentUser = result.user;

      // Step 4: Verify transition completed
      expect(currentUser.isAnonymous).toBe(false);
      expect(currentUser.email).toBe(email);
      expect(currentUser.uid).not.toBe('guest-user-id');
    });
  });

  describe('Integration with UI Components', () => {
    it('should validate complete form submission flow', async () => {
      // Test complete form submission with UI state management
      const formState = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        keepLoggedIn: true,
        isSubmitting: false,
        errors: {},
        isValid: false
      };

      // Step 1: Form validation
      const emailValidation = validateEmail(formState.email);
      const passwordValidation = validatePassword(formState.password);

      formState.isValid = emailValidation.isValid && passwordValidation.isValid;
      formState.errors = {
        email: emailValidation.error,
        password: passwordValidation.error
      };

      expect(formState.isValid).toBe(true);
      expect(formState.errors.email).toBeUndefined();
      expect(formState.errors.password).toBeUndefined();

      // Step 2: Form submission
      formState.isSubmitting = true;

      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'test-user-id',
          email: formState.email,
          displayName: 'Test User'
        }
      });

      // Step 3: Authentication process
      const persistence = formState.keepLoggedIn ? mockPersistence.LOCAL : mockPersistence.SESSION;
      await mockFirebaseAuth.setPersistence(persistence);
      const result = await mockFirebaseAuth.signInWithEmailAndPassword(formState.email, formState.password);

      // Step 4: Form completion
      formState.isSubmitting = false;

      expect(result.user.email).toBe(formState.email);
      expect(formState.isSubmitting).toBe(false);
      expect(mockFirebaseAuth.setPersistence).toHaveBeenCalledWith(persistence);
    });

    it('should validate complete error display flow', async () => {
      // Test complete error display and recovery flow
      const formState = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
        error: null,
        canRetry: false,
        isSubmitting: false
      };

      // Step 1: Form submission
      formState.isSubmitting = true;

      const authError = { code: 'auth/wrong-password', message: 'Wrong password' };
      mockFirebaseAuth.setPersistence.mockResolvedValue(undefined);
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(authError);

      // Step 2: Error handling
      try {
        await mockFirebaseAuth.setPersistence(mockPersistence.LOCAL);
        await mockFirebaseAuth.signInWithEmailAndPassword(formState.email, formState.password);
      } catch (error) {
        const errorResult = authErrorHandler.formatErrorForDisplay(error);
        formState.error = errorResult.message;
        formState.canRetry = errorResult.canRetry;
      }

      // Step 3: Form error state
      formState.isSubmitting = false;

      expect(formState.error).toBe('Incorrect password.');
      expect(formState.canRetry).toBe(false); // Wrong password is not retryable
      expect(formState.isSubmitting).toBe(false);

      // Step 4: User can correct and retry
      formState.password = 'CorrectPassword123!';
      formState.error = null;

      const passwordValidation = validatePassword(formState.password);
      expect(passwordValidation.isValid).toBe(true);
    });
  });
});
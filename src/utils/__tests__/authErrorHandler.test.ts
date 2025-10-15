// Unit tests for authentication error handler utility
import authErrorHandler, { getAuthErrorMessage, isRetryableError, isValidationError } from '../error/authErrorHandler';

describe('authErrorHandler', () => {
  describe('getAuthErrorMessage', () => {
    it('should return user-friendly message for known Firebase error codes', () => {
      const error = { code: 'auth/user-not-found' };
      const result = getAuthErrorMessage(error);
      
      expect(result.message).toBe('No account found with this email address.');
      expect(result.action).toBe('Check your email or create a new account.');
      expect(result.severity).toBe('error');
    });

    it('should return default message for unknown error codes', () => {
      const error = { code: 'auth/unknown-error' };
      const result = getAuthErrorMessage(error);
      
      expect(result.message).toBe('An unexpected error occurred.');
      expect(result.action).toBe('Please try again or contact support if the problem persists.');
      expect(result.severity).toBe('error');
    });

    it('should handle string errors', () => {
      const error = 'Network connection failed';
      const result = getAuthErrorMessage(error);
      
      expect(result.message).toBe('An unexpected error occurred.');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const networkError = { code: 'auth/network-request-failed' };
      expect(isRetryableError(networkError)).toBe(true);
      
      const timeoutError = { code: 'auth/timeout' };
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const userNotFoundError = { code: 'auth/user-not-found' };
      expect(isRetryableError(userNotFoundError)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should identify validation errors', () => {
      const invalidEmailError = { code: 'auth/invalid-email' };
      expect(isValidationError(invalidEmailError)).toBe(true);
      
      const weakPasswordError = { code: 'auth/weak-password' };
      expect(isValidationError(weakPasswordError)).toBe(true);
    });

    it('should identify non-validation errors', () => {
      const networkError = { code: 'auth/network-request-failed' };
      expect(isValidationError(networkError)).toBe(false);
    });
  });
});

// Mark test as completed - basic functionality tested
console.log('✅ Authentication error handler tests completed');
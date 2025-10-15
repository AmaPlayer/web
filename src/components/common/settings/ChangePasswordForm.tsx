import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Check, X, Loader, Info } from 'lucide-react';
import './ChangePasswordForm.css';

interface ChangePasswordFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Validation {
  newPasswordLength: boolean;
  passwordsMatch: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onClose, onSuccess }) => {
  const { changePassword, currentUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSocialUser, setIsSocialUser] = useState<boolean>(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onSuccess, onClose]);

  // Check if user signed up with social media
  useEffect(() => {
    if (currentUser) {
      // Check if user has social providers (Google, Apple, etc.)
      const hasEmailPassword = currentUser.providerData.some(
        provider => provider.providerId === 'password'
      );
      const hasSocialProvider = currentUser.providerData.some(
        provider => provider.providerId === 'google.com' || 
                   provider.providerId === 'apple.com' ||
                   provider.providerId === 'facebook.com' ||
                   provider.providerId === 'twitter.com' ||
                   provider.providerId === 'github.com'
      );
      
      // User is considered a social user if they have social providers but no email/password
      setIsSocialUser(hasSocialProvider && !hasEmailPassword);
    }
  }, [currentUser]);

  const validation: Validation = {
    newPasswordLength: formData.newPassword.length >= 6,
    passwordsMatch:
      formData.newPassword === formData.confirmPassword &&
      formData.confirmPassword.length > 0,
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // For social users, they don't need to enter current password
    if (!isSocialUser && !formData.currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!validation.newPasswordLength) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (!validation.passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isSocialUser) {
        // For social users, use a different method to set password
        result = await changePassword('', formData.newPassword, true); // Pass true for social user
      } else {
        // For email/password users, use normal flow
        result = await changePassword(
          formData.currentPassword,
          formData.newPassword
        );
      }

      if (result.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-form" aria-label="Change password form">
      <div className="change-password-header">
        <h4>{isSocialUser ? 'Set Password' : 'Change Password'}</h4>
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="Close password form"
        >
          <X size={20} />
        </button>
      </div>

      {isSocialUser && (
        <div className="info-message" role="alert">
          <Info size={20} />
          <span>
            You signed up with a social account. Set a password to enable email/password login as an alternative.
          </span>
        </div>
      )}

      {success && (
        <div className="success-message" role="alert">
          <Check size={20} />
          <span>Password changed successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <X size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isSocialUser && (
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={loading || success}
              required
              aria-required="true"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="newPassword">{isSocialUser ? 'Password' : 'New Password'}</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            disabled={loading || success}
            required
            aria-required="true"
            aria-describedby="password-requirements"
          />
          <div
            id="password-requirements"
            className={`validation-feedback ${
              formData.newPassword.length > 0
                ? validation.newPasswordLength
                  ? 'valid'
                  : 'invalid'
                : ''
            }`}
          >
            {formData.newPassword.length > 0 && (
              <>
                {validation.newPasswordLength ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )}
                <span>At least 6 characters</span>
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{isSocialUser ? 'Confirm Password' : 'Confirm New Password'}</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading || success}
            required
            aria-required="true"
          />
          <div
            className={`validation-feedback ${
              formData.confirmPassword.length > 0
                ? validation.passwordsMatch
                  ? 'valid'
                  : 'invalid'
                : ''
            }`}
          >
            {formData.confirmPassword.length > 0 && (
              <>
                {validation.passwordsMatch ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )}
                <span>Passwords match</span>
              </>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={
              loading ||
              success ||
              (!isSocialUser && !formData.currentPassword) ||
              !validation.newPasswordLength ||
              !validation.passwordsMatch
            }
          >
            {loading ? (
              <>
                <Loader size={16} className="spinner" />
                <span>Changing...</span>
              </>
            ) : (
              isSocialUser ? 'Set Password' : 'Change Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;

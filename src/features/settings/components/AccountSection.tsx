import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Save, X, LogOut } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FormField from '../../../components/common/forms/FormField';
import LoadingSpinner from '../../../components/common/ui/LoadingSpinner';
import ToastContainer from '../../../components/common/ui/ToastContainer';
import ConfirmationDialog from '../../../components/common/ui/ConfirmationDialog';
import { useSettingsForm } from '../../../hooks/useSettingsForm';
import { useToast } from '../../../hooks/useToast';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { useLanguage } from '../../../contexts/UnifiedPreferencesContext';
import { validateDisplayName, validateEmailField } from '../../../utils/validation/formValidation';
import '../styles/AccountSection.css';

interface AccountFormData {
  displayName: string;
  photoURL: string;
}

const AccountSection: React.FC = () => {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const { toasts, showSuccess, showError } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const form = useSettingsForm<AccountFormData>({
    initialValues: {
      displayName: currentUser?.displayName || '',
      photoURL: currentUser?.photoURL || ''
    },
    validationRules: {
      displayName: {
        required: true,
        custom: (value: string) => {
          const result = validateDisplayName(value);
          return result.isValid ? undefined : result.error;
        }
      }
    },
    autoSave: false, // Manual save for account info
    onSave: async (values) => {
      await updateUserProfile({
        displayName: values.displayName,
        photoURL: values.photoURL
      });
      showSuccess('Profile Updated', 'Your account information has been saved successfully.');
      setIsEditing(false);
    }
  });

  // Update form when user data changes
  useEffect(() => {
    if (currentUser) {
      form.setValue('displayName', currentUser.displayName || '');
      form.setValue('photoURL', currentUser.photoURL || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const success = await form.save();
      if (!success) {
        showError('Validation Error', 'Please fix the errors before saving.');
      }
    } catch (error) {
      showError('Save Failed', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    form.resetForm();
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleLogout = async () => {
    const confirmed = await showConfirmation({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) {
      hideConfirmation();
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      showSuccess('Signed Out', 'You have been successfully signed out.');
      hideConfirmation();
      // Force full page reload to welcome page to clear all state
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      showError('Sign Out Failed', 'Failed to sign out. Please try again.');
      hideConfirmation();
      setIsLoggingOut(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="account-section">
        <div className="account-error">
          <p>Please log in to view account information.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} position="top-right" />
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        onConfirm={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
        isLoading={confirmationState.isLoading}
      />
      <div className="account-section">
        <div className="account-header">
          <h3>Account Information</h3>
          {!isEditing && (
            <button
              className="edit-button"
              onClick={handleEdit}
              type="button"
            >
              Edit Profile
            </button>
          )}
        </div>

      <div className="account-content">
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            {form.values.photoURL ? (
              <img
                src={form.values.photoURL}
                alt="Profile"
                className="profile-photo"
              />
            ) : (
              <div className="profile-photo-placeholder">
                <User size={48} />
              </div>
            )}
            {isEditing && (
              <button className="photo-edit-button" type="button">
                <Camera size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="account-fields">
          {isEditing ? (
            <FormField
              label="Display Name"
              name="displayName"
              required
              error={form.errors.displayName}
              success={form.fields.displayName?.dirty && !form.errors.displayName ? 'Looks good!' : undefined}
            >
              <input
                id="displayName"
                type="text"
                value={form.values.displayName}
                onChange={(e) => form.setValue('displayName', e.target.value)}
                onBlur={() => form.markFieldTouched('displayName')}
                placeholder="Enter your display name"
                disabled={form.isSaving}
              />
            </FormField>
          ) : (
            <div className="field-group">
              <label className="field-label">
                <User size={16} />
                Display Name
              </label>
              <div className="field-value">{currentUser?.displayName || 'Not set'}</div>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">
              <Mail size={16} />
              Email Address
            </label>
            <div className="field-value email-field">
              {currentUser?.email}
              <span className="email-note">
                Email cannot be changed from settings
              </span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Account Type</label>
            <div className="field-value">
              {currentUser?.providerData && currentUser.providerData.length > 0
                ? currentUser.providerData.map(provider => {
                    switch (provider.providerId) {
                      case 'google.com':
                        return 'Google Account';
                      case 'apple.com':
                        return 'Apple Account';
                      case 'password':
                        return 'Email/Password Account';
                      default:
                        return 'Social Account';
                    }
                  }).join(', ')
                : 'Email/Password Account'
              }
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="account-actions">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={form.isSaving || !form.isDirty || !form.isValid}
              type="button"
            >
              {form.isSaving ? (
                <>
                  <LoadingSpinner size="small" color="white" className="in-button" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
            <button
              className="cancel-button"
              onClick={handleCancel}
              disabled={form.isSaving}
              type="button"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        )}

        {/* Sign Out Section */}
        <div className="logout-section">
          <div className="logout-divider"></div>
          <h4>Account Actions</h4>
          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={isLoggingOut || form.isSaving}
            type="button"
          >
            {isLoggingOut ? (
              <>
                <LoadingSpinner size="small" color="white" className="in-button" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut size={16} />
                {t('signOut')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AccountSection;
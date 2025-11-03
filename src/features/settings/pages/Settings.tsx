import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Eye, Bell } from 'lucide-react';
import { useLanguage, useTheme } from '../../../contexts/UnifiedPreferencesContext';
import LanguageSelector from '../../../components/common/LanguageSelector';
import ThemeToggle from '../../../components/common/ThemeToggle';
import AccountSection from '../components/AccountSection';
import PasswordChangeSection from '../components/PasswordChangeSection';
import ConfirmationDialog from '../../../components/common/ui/ConfirmationDialog';
import LoadingSpinner from '../../../components/common/ui/LoadingSpinner';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useConfirmation } from '../../../hooks/useConfirmation';
import '../styles/Settings.css';

interface SettingsPageProps {
  initialTab?: 'account' | 'security' | 'privacy' | 'notifications';
}

interface SettingsState {
  activeTab: string;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  errors: Record<string, string>;
}

const Settings: React.FC<SettingsPageProps> = ({ initialTab = 'account' }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const [state, setState] = useState<SettingsState>({
    activeTab: initialTab,
    hasUnsavedChanges: false,
    isLoading: false,
    errors: {}
  });

  const { confirmationState, showConfirmation, hideConfirmation } = useConfirmation();

  // Handle unsaved changes warning
  useUnsavedChanges({
    hasUnsavedChanges: state.hasUnsavedChanges,
    message: t('unsavedChangesMessage'),
    onNavigateAway: async () => {
      return await showConfirmation({
        title: t('unsavedChanges'),
        message: t('unsavedChangesMessage'),
        confirmText: t('leave'),
        cancelText: t('stay'),
        variant: 'warning'
      });
    }
  });

  const tabs = [
    { id: 'account', label: t('account'), icon: User },
    { id: 'security', label: t('security'), icon: Shield },
    { id: 'privacy', label: t('privacy'), icon: Eye },
    { id: 'notifications', label: t('notifications'), icon: Bell }
  ];

  const handleTabChange = async (tabId: string) => {
    if (state.hasUnsavedChanges) {
      const confirmed = await showConfirmation({
        title: t('unsavedChanges'),
        message: t('unsavedChangesTabMessage'),
        confirmText: t('switchTab'),
        cancelText: t('stay'),
        variant: 'warning'
      });

      if (!confirmed) {
        hideConfirmation();
        return;
      }
      hideConfirmation();
    }

    setState(prev => ({
      ...prev,
      activeTab: tabId,
      hasUnsavedChanges: false,
      errors: {}
    }));
  };

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'account':
        return (
          <div className="settings-tab-content">
            <AccountSection />
            
            {/* Language and Theme Preferences */}
            <div className="preferences-section">
              <h3>{t('chooseLanguage')}</h3>
              <LanguageSelector variant="dropdown" />
            </div>
            
            <div className="preferences-section">
              <h3>{t('privacy')}</h3>
              <ThemeToggle variant="switch" showLabel={true} />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="settings-tab-content">
            <PasswordChangeSection />
          </div>
        );
      case 'privacy':
        return (
          <div className="settings-tab-content">
            <h3>{t('privacySettings')}</h3>
            <p>{t('privacyDescription')}</p>
            {/* Privacy section content will be implemented later */}
          </div>
        );
      case 'notifications':
        return (
          <div className="settings-tab-content">
            <h3>{t('notificationPreferences')}</h3>
            <p>{t('notificationDescription')}</p>
            {/* Notifications section content will be implemented later */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
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
      <div className="settings-page">
        <div className="settings-header">
          <div className="settings-title">
            <SettingsIcon size={24} />
            <h1>{t('settings')}</h1>
          </div>
        </div>

      <div className="settings-container">
        <nav className="settings-nav">
          <ul className="settings-tabs">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    className={`settings-tab ${state.activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                    type="button"
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="settings-content">
          {state.isLoading ? (
            <div className="settings-loading">
              <LoadingSpinner size="large" />
              <p>{t('loadingSettings')}</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default Settings;
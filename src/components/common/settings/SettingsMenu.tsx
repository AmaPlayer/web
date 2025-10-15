import React, { useEffect, useRef, useState, lazy, Suspense, RefObject } from 'react';
import { Sun, Globe, Lock, FileText, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import SettingsMenuItem from './SettingsMenuItem';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSelector from '../forms/LanguageSelector';
import './SettingsMenu.css';

const ChangePasswordForm = lazy(() => import('./ChangePasswordForm'));

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isGuest: boolean;
  triggerButtonRef?: RefObject<HTMLButtonElement>;
  currentUser?: User | null;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, isGuest, triggerButtonRef, currentUser }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const focusTimeout = setTimeout(() => {
      if (!menuRef.current) return;

      const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstFocusableRef.current = firstElement;
      lastFocusableRef.current = lastElement;

      firstElement.focus();
    }, 50);

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !menuRef.current) return;

      const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, showPasswordForm]);

  useEffect(() => {
    if (!isOpen && triggerButtonRef?.current) {
      triggerButtonRef.current.focus();
    }
  }, [isOpen, triggerButtonRef]);

  const handlePasswordFormClose = () => {
    setShowPasswordForm(false);
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordForm(false);
  };

  const handleChangePasswordClick = () => {
    setShowPasswordForm(true);
  };

  const handlePrivacyPolicyClick = () => {
    window.open('/privacy-policy.html', '_blank');
  };

  const handleSettingsPageClick = () => {
    onClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="settings-menu"
      role="menu"
      aria-label="Settings menu"
    >
      <div className="settings-menu-header">
        <h3>Settings</h3>
      </div>
      <div className="settings-menu-content">
        {!isGuest && (
          <SettingsMenuItem
            icon={Settings}
            label="Account Settings"
            onClick={handleSettingsPageClick}
            showDivider={true}
            ariaLabel="Go to account settings page"
          />
        )}

        <SettingsMenuItem
          icon={Sun}
          label="Theme"
          showDivider={true}
          ariaLabel="Change theme"
        >
          <ThemeToggle inline={true} showLabel={false} />
        </SettingsMenuItem>

        <SettingsMenuItem
          icon={Globe}
          label="Language"
          showDivider={!isGuest}
          ariaLabel="Change language"
        >
          <LanguageSelector inline={true} showLabel={true} dropdownPosition="left" />
        </SettingsMenuItem>

        {!isGuest && (
          <SettingsMenuItem
            icon={Lock}
            label="Change Password"
            onClick={handleChangePasswordClick}
            showDivider={true}
            ariaLabel="Change password"
          />
        )}

        <SettingsMenuItem
          icon={FileText}
          label="Privacy Policy"
          onClick={handlePrivacyPolicyClick}
          showDivider={true}
          ariaLabel="View privacy policy"
        />

        <SettingsMenuItem
          icon={LogOut}
          label={isGuest ? 'Sign In' : 'Logout'}
          onClick={handleLogout}
          showDivider={false}
          ariaLabel={isGuest ? 'Sign in to your account' : 'Logout from your account'}
        />
      </div>

      {showPasswordForm && !isGuest && (
        <Suspense fallback={<div className="settings-loading">Loading...</div>}>
          <ChangePasswordForm
            onClose={handlePasswordFormClose}
            onSuccess={handlePasswordChangeSuccess}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SettingsMenu;

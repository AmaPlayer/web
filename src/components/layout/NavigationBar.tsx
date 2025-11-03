import { useState, useRef, useEffect } from 'react';
import { Settings, ArrowLeft, Bell, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsMenu from '../common/settings/SettingsMenu';
import NotificationDropdown from '../common/notifications/NotificationDropdown';
import { User } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, useTheme } from '../../contexts/UnifiedPreferencesContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './NavigationBar.css';

interface NavigationBarProps {
  currentUser: User | null;
  isGuest: boolean;
  onTitleClick: () => void;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

/**
 * NavigationBar Component
 * 
 * Handles top navigation, user actions, and app branding.
 */
const NavigationBar = ({ currentUser, isGuest, onTitleClick, title = "AmaPlayer", showBackButton = false, onBackClick }: NavigationBarProps) => {
  const { isGuest: authIsGuest } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleNotificationsToggle = () => {
    setNotificationsOpen(!notificationsOpen);
    setSettingsOpen(false); // Close settings if open
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
  };

  const handleSearchClick = () => {
    setSettingsOpen(false);
    setNotificationsOpen(false);
    navigate('/search');
  };

  // Fetch unread notification count
  useEffect(() => {
    if (!currentUser || authIsGuest()) {
      setUnreadCount(0);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('receiverId', '==', currentUser.uid),
        where('read', '==', false)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size);
      }, (error) => {
        console.error('Error fetching notification count:', error);
        setUnreadCount(0);
      });

    } catch (error) {
      console.error('Error setting up notification listener:', error);
      setUnreadCount(0);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, authIsGuest]);

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-content">
        {showBackButton && onBackClick && (
          <button
            className="nav-back-button"
            onClick={onBackClick}
            aria-label={t('nav.goBack')}
            type="button"
          >
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
        )}
        
        <h1 
          className={`app-title ${showBackButton ? 'with-back-button' : ''}`}
          onClick={onTitleClick}
          role="button"
          tabIndex={0}
          aria-label={`${title} - Click to refresh and scroll to top`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTitleClick();
            }
          }}
        >
          {title}
        </h1>
        
        <div className="nav-links">
          {isGuest && (
            <span 
              className="guest-indicator"
              role="status"
              aria-label={t('nav.guestMode')}
            >
              {t('nav.guestMode')}
            </span>
          )}
          
          <div className="nav-actions">
            {/* Search */}
            <button
              className={`search-btn ${location.pathname === '/search' ? 'active' : ''}`}
              onClick={handleSearchClick}
              aria-label={t('nav.search')}
              title={t('nav.search')}
              type="button"
            >
              <Search size={24} aria-hidden="true" />
              <span className="sr-only">{t('nav.search')}</span>
            </button>

            {/* Notifications */}
            {!authIsGuest() && (
              <div className="notifications-container">
                <button
                  ref={notificationButtonRef}
                  className="notification-btn"
                  onClick={handleNotificationsToggle}
                  aria-label={unreadCount > 0 ? `${t('nav.notifications')} (${unreadCount} ${t('nav.unread')})` : t('nav.notifications')}
                  aria-expanded={notificationsOpen}
                  aria-haspopup="true"
                  title={t('nav.notifications')}
                  type="button"
                >
                  <Bell size={24} aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">
                    {unreadCount > 0 ? `${t('nav.notifications')} (${unreadCount} ${t('nav.unread')})` : t('nav.notifications')}
                  </span>
                </button>

                <NotificationDropdown
                  isOpen={notificationsOpen}
                  onClose={handleNotificationsClose}
                  triggerButtonRef={notificationButtonRef}
                />
              </div>
            )}

            {/* Settings */}
            <div className="settings-container">
              <button
                ref={settingsButtonRef}
                className="settings-btn"
                onClick={handleSettingsToggle}
                aria-label={t('nav.settings')}
                aria-expanded={settingsOpen}
                aria-haspopup="true"
                title={t('nav.settings')}
                type="button"
              >
                <Settings size={24} aria-hidden="true" />
                <span className="sr-only">{t('nav.settings')}</span>
              </button>
              
              <SettingsMenu
                isOpen={settingsOpen}
                onClose={handleSettingsClose}
                isGuest={isGuest}
                triggerButtonRef={settingsButtonRef}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
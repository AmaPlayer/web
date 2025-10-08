import { useState, useRef } from 'react';
import { LogOut, Settings } from 'lucide-react';
import SettingsMenu from '../../../components/common/settings/SettingsMenu';
import { User } from 'firebase/auth';
import './NavigationBar.css';

interface NavigationBarProps {
  currentUser: User | null;
  isGuest: boolean;
  onTitleClick: () => void;
  onLogout: () => void;
}

/**
 * NavigationBar Component
 * 
 * Handles top navigation, user actions, and app branding.
 */
const NavigationBar = ({ currentUser, isGuest, onTitleClick, onLogout }: NavigationBarProps) => {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-content">
        <h1 
          className="app-title" 
          onClick={onTitleClick}
          role="button"
          tabIndex={0}
          aria-label="AmaPlayer - Click to refresh and scroll to top"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTitleClick();
            }
          }}
        >
          AmaPlayer
        </h1>
        
        <div className="nav-links">
          {isGuest && (
            <span 
              className="guest-indicator"
              role="status"
              aria-label="Currently in guest mode"
            >
              Guest Mode
            </span>
          )}
          
          <div className="settings-container">
            <button
              ref={settingsButtonRef}
              className="settings-btn"
              onClick={handleSettingsToggle}
              aria-label="Open settings menu"
              aria-expanded={settingsOpen}
              aria-haspopup="true"
              title="Settings"
              type="button"
            >
              <Settings size={20} aria-hidden="true" />
              <span className="sr-only">Settings</span>
            </button>
            
            <SettingsMenu
              isOpen={settingsOpen}
              onClose={handleSettingsClose}
              isGuest={isGuest}
              triggerButtonRef={settingsButtonRef}
            />
          </div>
          
          <button
            className="logout-btn"
            onClick={onLogout}
            aria-label={isGuest ? 'Sign In' : 'Logout'}
            title={isGuest ? 'Sign In' : 'Logout'}
            type="button"
          >
            <LogOut size={20} aria-hidden="true" />
            <span className="sr-only">
              {isGuest ? 'Sign In' : 'Logout'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
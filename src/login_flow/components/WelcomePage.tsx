import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/UnifiedPreferencesContext';
import { LanguageSelector } from '../../components/common/LanguageSelector';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import './WelcomePage.css';

const WelcomePageContent: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Handle scroll to hide/show header controls
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down and past 50px - hide header
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Handle click outside settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLetsPlayClick = (): void => {
    navigate('/athlete-onboarding/sport');
  };

  const handleLoginClick = (): void => {
    navigate('/login');
  };

  // Handle role-specific navigation
  const handleRoleClick = (roleId: string): void => {
    if (roleId === 'athlete') {
      // Athletes go to onboarding flow
      navigate('/athlete-onboarding/sport');
    } else {
      // Other roles (coach, organization, parent) go to about page first
      navigate(`/about/${roleId}`);
    }
  };

  return (
    <div className="welcome-container">
      <div className={`welcome-header ${isHeaderVisible ? 'visible' : 'hidden'}`}>
        <div className="welcome-controls">
          <div className="settings-dropdown" ref={settingsRef}>
            <button
              className="settings-button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              aria-label="Settings"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            {isSettingsOpen && (
              <div className="settings-menu">
                <div className="settings-item">
                  <span className="settings-label">Language</span>
                  <LanguageSelector variant="dropdown" />
                </div>
                <div className="settings-item">
                  <span className="settings-label">Theme</span>
                  <ThemeToggle variant="icon" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="background-graphic">
        <div className="glowing-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="content">
        <div className="tagline">{t('tagline')}</div>
        <h1 className="main-title">AmaPlayer</h1>
        <p className="subtitle">{t('subtitle')}</p>

        <div className="button-group">
          <button className="login-btn" onClick={handleLetsPlayClick}>
            {t('letsPlay')}
          </button>
          <button className="secondary-btn" onClick={handleLoginClick}>
            Login
          </button>
        </div>

        {/* Join for Free Section */}
        <div className="join-free-section">
          <h2 className="join-free-title">{t('joinForFree')}</h2>
          <div className="role-options">
            <div className="role-option" onClick={() => handleRoleClick('athlete')} style={{ cursor: 'pointer' }}>
              <h4>{t('athlete')}</h4>
            </div>
            <div className="role-option" onClick={() => handleRoleClick('coach')} style={{ cursor: 'pointer' }}>
              <h4>{t('coach')}</h4>
            </div>
            <div className="role-option" onClick={() => handleRoleClick('organization')} style={{ cursor: 'pointer' }}>
              <h4>{t('organization')}</h4>
            </div>
            <div className="role-option" onClick={() => handleRoleClick('parent')} style={{ cursor: 'pointer' }}>
              <h4>{t('parent')}</h4>
            </div>
          </div>
        </div>

        {/* Vision and Mission Section */}
        <div className="vision-mission-section">
          <div className="vision-mission-card">
            <h3 className="card-title">{t('vision') || 'Our Vision'}</h3>
            <p className="card-description">
              {t('visionText') || 'To create a global platform that connects athletes, coaches, and sports enthusiasts, empowering them to showcase their talent and achieve their dreams.'}
            </p>
          </div>

          <div className="vision-mission-card">
            <h3 className="card-title">{t('mission') || 'Our Mission'}</h3>
            <p className="card-description">
              {t('missionText') || 'To provide innovative tools and opportunities for athletes to connect, grow, and succeed in their sporting journey while building a vibrant community.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WelcomePage: React.FC = () => {
  return <WelcomePageContent />;
};

export default WelcomePage;

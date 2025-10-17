import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
          <LanguageSelector />
          <ThemeToggle />
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
              <div className="role-icon">🏃</div>
              <h4>{t('athlete')}</h4>
            </div>
            <div className="role-option" onClick={() => handleRoleClick('coach')} style={{ cursor: 'pointer' }}>
              <div className="role-icon">🎯</div>
              <h4>{t('coach')}</h4>
            </div>
            <div className="role-option" onClick={() => handleRoleClick('organization')} style={{ cursor: 'pointer' }}>
              <div className="role-icon">🏢</div>
              <h4>{t('organization')}</h4>
            </div>
            <div className="role-option" onClick={() => handleRoleClick('parent')} style={{ cursor: 'pointer' }}>
              <div className="role-icon">👨‍👩‍👧</div>
              <h4>{t('parent')}</h4>
            </div>
          </div>
        </div>

        {/* Vision and Mission Section */}
        <div className="vision-mission-section">
          <div className="vision-mission-card">
            <div className="card-icon vision-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h3 className="card-title">{t('vision') || 'Our Vision'}</h3>
            <p className="card-description">
              {t('visionText') || 'To create a global platform that connects athletes, coaches, and sports enthusiasts, empowering them to showcase their talent and achieve their dreams.'}
            </p>
          </div>

          <div className="vision-mission-card">
            <div className="card-icon mission-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
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

export default WelcomePage;

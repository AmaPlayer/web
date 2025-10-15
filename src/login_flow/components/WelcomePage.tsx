import React from 'react';
import { useNavigate } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLoginClick = (): void => {
    navigate('/role-selection');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-header">
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
        
        <button className="login-btn" onClick={handleLoginClick}>
          {t('letsPlay')}
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;

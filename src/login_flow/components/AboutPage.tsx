import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import videoSource from '../assets/video/sport.mp4';
import './AboutPage.css';

interface RoleInfo {
  title: string;
  image: string;
}

interface RoleInfoMap {
  [key: string]: RoleInfo;
}

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const { t } = useTranslation();

  const roleInfo: RoleInfoMap = {
    athlete: { 
      title: 'athlete', 
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    coach: { 
      title: 'coach', 
      image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    organization: { 
      title: 'organization', 
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    spouse: { 
      title: 'spouse', 
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    parent: { 
      title: 'parent', 
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    }
  };

  const currentRole = role ? roleInfo[role] : undefined;

  const handleContinue = (): void => {
    navigate(`/login/${role}`);
  };

  const handleBack = (): void => {
    navigate('/');
  };

  return (
    <div className="about-container">
      <div className="about-page-header">
        <div className="about-page-controls">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
      
      <div className="about-content">
        <div className="about-header">
          <div className="role-badge">
            <img 
              src={currentRole?.image} 
              alt={t(currentRole?.title || '')} 
              className="role-badge-image" 
            />
            <span className="role-badge-text">
              {t('joiningAs', 'Joining as')} {t(currentRole?.title || '')}
            </span>
          </div>
          <h1 className="about-title">{t('welcomeToAmaplayer')}</h1>
          <p className="about-subtitle">{t('yourJourney')}</p>
        </div>

        <div className="mission-vision-grid">
          <div className="mission-card">
            <div className="card-icon mission-icon">🎯</div>
            <h3 className="card-title">{t('ourMission')}</h3>
            <p className="card-description">
              {t('missionDescription', "To create the world's most comprehensive platform that connects athletes, coaches, and organizations, fostering talent development and creating opportunities for athletic excellence across all sports disciplines.")}
            </p>
          </div>

          <div className="vision-card">
            <div className="card-icon vision-icon">🌟</div>
            <h3 className="card-title">{t('ourVision')}</h3>
            <p className="card-description">
              {t('visionDescription', 'To revolutionize the sports industry by building a global ecosystem where every athlete has access to world-class coaching, every coach can discover exceptional talent, and every organization can build championship-winning teams.')}
            </p>
          </div>
        </div>

        <div className="video-section">
          <h2 className="video-title">{t('watchOurStory')}</h2>
          <div className="video-container">
            <video 
              width="100%" 
              height="auto" 
              controls 
              controlsList="nodownload"
              poster=""
              className="about-video"
            >
              <source src={videoSource} type="video/mp4" />
              <p>{t('videoLoadError', "If you're seeing this, the video failed to load. Please check the console for errors.")}</p>
              {t('videoNotSupported', 'Your browser does not support the video tag.')}
            </video>
          </div>
        </div>

        <div className="about-actions">
          <button className="continue-btn" onClick={handleContinue}>
            {t('continueToLogin')}
          </button>
          <button className="back-btn" onClick={handleBack}>
            ← {t('chooseDifferentRole')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

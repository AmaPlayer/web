import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/UnifiedPreferencesContext';
import { Calendar, Sparkles } from 'lucide-react';
import NavigationBar from '../../components/layout/NavigationBar';
import FooterNav from '../../components/layout/FooterNav';
import './Events.css';

export default function Events() {
  const { currentUser, isGuest } = useAuth();
  const { t } = useLanguage();

  const handleTitleClick = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="events">
      <NavigationBar
        currentUser={currentUser}
        isGuest={isGuest()}
        onTitleClick={handleTitleClick}
        title={t('events.title')}
      />

      <div className="main-content events-content">
        <div className="coming-soon-container">
          <div className="coming-soon-content">
            <div className="coming-soon-icon">
              <Calendar size={80} className="icon-primary" />
              <Sparkles size={40} className="icon-sparkle" />
            </div>
            <h1 className="coming-soon-title">{t('events.comingSoon')}</h1>
            <p className="coming-soon-subtitle">
              {t('events.subtitle')}
            </p>
            <div className="coming-soon-features">
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <span>{t('events.liveEvents')}</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📅</div>
                <span>{t('events.calendar')}</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <span>{t('events.championships')}</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📰</div>
                <span>{t('events.news')}</span>
              </div>
            </div>
            <p className="coming-soon-message">
              {t('events.stayTuned')}
            </p>
          </div>
        </div>
      </div>
      
      <FooterNav />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calendar, Trophy, MapPin, Clock, Users, ExternalLink, Star, Medal, Target } from 'lucide-react';
import FooterNav from '../../components/layout/FooterNav';
import ThemeToggle from '../../components/common/ui/ThemeToggle';
import LanguageSelector from '../../components/common/forms/LanguageSelector';
import eventsService from '../../services/api/eventsService';
import './Events.css';

export default function Events() {
  const { currentUser, isGuest, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [hasFirebaseEvents, setHasFirebaseEvents] = useState(false);

  // No sample events - show empty state when no Firebase events exist

  const sportsNews = [
    {
      id: 1,
      title: "Olympic Records Expected to Fall at Paris 2024",
      category: "Olympics",
      summary: "Athletes are in unprecedented form as Paris 2024 approaches, with multiple world records already broken this season.",
      time: "2 hours ago",
      source: "Olympic Channel",
      priority: "breaking"
    },
    {
      id: 2,
      title: "New Training Technologies Revolutionizing Athletic Performance",
      category: "Sports Science",
      summary: "AI-powered training analysis and virtual reality coaching are helping athletes achieve peak performance levels.",
      time: "5 hours ago",
      source: "Sports Tech Today",
      priority: "high"
    },
    {
      id: 3,
      title: "Youth Sports Participation Reaches All-Time High",
      category: "Community Sports",
      summary: "Local sports programs report a 40% increase in youth participation following successful community initiatives.",
      time: "1 day ago",
      source: "Community Sports Network",
      priority: "medium"
    },
    {
      id: 4,
      title: "Sustainability in Sports: Green Stadiums Lead the Way",
      category: "Environment",
      summary: "Major sporting venues are implementing eco-friendly technologies, reducing carbon footprint by 60%.",
      time: "2 days ago",
      source: "Green Sports Alliance",
      priority: "medium"
    }
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Loading events from Firebase...');
      
      // Load events from Firebase
      const [upcoming, live, completed] = await Promise.all([
        eventsService.getUpcomingEvents(),
        eventsService.getLiveEvents(),
        eventsService.getCompletedEvents()
      ]);

      console.log('Firebase events loaded:', { upcoming: upcoming.length, live: live.length, completed: completed.length });

      // Check if we have any Firebase events
      const totalFirebaseEvents = upcoming.length + live.length + completed.length;
      
      if (totalFirebaseEvents > 0) {
        // Use Firebase events
        setHasFirebaseEvents(true);
        setUpcomingEvents(upcoming);
        setLiveEvents(live);
        setPastEvents(completed);
        console.log('Using Firebase events');
      } else {
        // No events - show empty state
        setHasFirebaseEvents(false);
        setUpcomingEvents([]);
        setLiveEvents([]);
        setPastEvents([]);
        console.log('No Firebase events found, showing empty state');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Show empty state on error
      setHasFirebaseEvents(false);
      setUpcomingEvents([]);
      setLiveEvents([]);
      setPastEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleClick = () => {
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getEventsByTab = () => {
    switch (activeTab) {
      case 'live':
        return liveEvents;
      case 'past':
        return pastEvents;
      default:
        return upcomingEvents;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <Star size={16} className="priority-high" />;
      case 'medium':
        return <Medal size={16} className="priority-medium" />;
      default:
        return <Target size={16} className="priority-low" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Multi-Sport': '#ff6b6b',
      'Cricket': '#4ecdc4',
      'Athletics': '#45b7d1',
      'Football': '#96ceb4',
      'Tennis': '#feca57',
      'Cycling': '#ff9ff3',
      'Olympics': '#ffd93d',
      'Sports Science': '#6c5ce7',
      'Community Sports': '#a29bfe',
      'Environment': '#00b894'
    };
    return colors[category] || '#74b9ff';
  };

  if (loading) {
    return (
      <div className="events">
        <nav className="nav-bar">
          <div className="nav-content">
            <h1 className="app-title">Events</h1>
          </div>
        </nav>
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Loading events...</span>
          </div>
        </div>
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="events">
      <nav className="nav-bar">
        <div className="nav-content">
          <h1 className="app-title" onClick={handleTitleClick}>AmaPlayer</h1>
          <div className="nav-links">
            <LanguageSelector />
            <ThemeToggle />
            {isGuest() && <span className="guest-indicator">Guest Mode</span>}
            <button onClick={handleLogout}>{isGuest() ? 'Sign In' : t('logout')}</button>
          </div>
        </div>
      </nav>

      <div className="main-content events-content">
        {/* Page Header */}
        <div className="events-header">
          <div className="header-content">
            <Calendar size={32} className="header-icon" />
            <div className="header-text">
              <h1>Sports Events & Championships</h1>
              <p>Stay updated with the latest sporting events, championships, and news from around the world</p>
              {hasFirebaseEvents && (
                <div className="firebase-events-indicator">
                  <span className="live-indicator">● </span>
                  <span style={{color: '#10b981', fontSize: '14px'}}>Live events from admin dashboard</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sports News Section */}
        <div className="news-section">
          <h2 className="section-title">
            <Trophy size={24} />
            Latest Sports News
          </h2>
          <div className="news-grid">
            {sportsNews.map((news) => (
              <div key={news.id} className={`news-card ${news.priority}`}>
                <div className="news-header">
                  <div className="news-category" style={{ backgroundColor: getCategoryColor(news.category) }}>
                    {news.category}
                  </div>
                  <div className="news-time">{news.time}</div>
                </div>
                <h3 className="news-title">{news.title}</h3>
                <p className="news-summary">{news.summary}</p>
                <div className="news-footer">
                  <span className="news-source">{news.source}</span>
                  <ExternalLink size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events Section */}
        <div className="events-section">
          <h2 className="section-title">
            <Medal size={24} />
            Sports Events & Championships
          </h2>
          
          {/* Event Tabs */}
          <div className="events-tabs">
            <button 
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <Calendar size={20} />
              Upcoming ({upcomingEvents.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              <div className="live-indicator">
                <div className="live-dot"></div>
                Live ({liveEvents.length})
              </div>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              <Trophy size={20} />
              Past Events ({pastEvents.length})
            </button>
          </div>

          {/* Events Grid */}
          <div className="events-grid">
            {getEventsByTab().length === 0 ? (
              <div className="empty-events-state">
                <div className="empty-state-icon">
                  <Calendar size={48} />
                </div>
                <h3>No Events Available</h3>
                <p>There are currently no {activeTab} events to display. Check back later for updates!</p>
              </div>
            ) : (
              getEventsByTab().map((event) => (
              <div key={event.id} className={`event-card ${event.status}`}>
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                  <div className="event-status-badge">
                    {event.status === 'live' && (
                      <div className="live-badge">
                        <div className="live-dot-small"></div>
                        LIVE
                      </div>
                    )}
                    {event.status === 'upcoming' && (
                      <div className="upcoming-badge">UPCOMING</div>
                    )}
                    {event.status === 'completed' && (
                      <div className="completed-badge">COMPLETED</div>
                    )}
                  </div>
                  <div className="event-priority">
                    {getPriorityIcon(event.priority)}
                  </div>
                </div>
                
                <div className="event-content">
                  <div className="event-header">
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-category" style={{ backgroundColor: getCategoryColor(event.category) }}>
                      {event.category}
                    </div>
                  </div>
                  
                  {/* Competition Status */}
                  <div className={`competition-status ${eventsService.getCompetitionStatus(event).statusClass}`}>
                    {eventsService.getCompetitionStatus(event).displayText}
                  </div>
                  
                  <div className="event-details">
                    <div className="event-detail">
                      <Clock size={16} />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="event-detail">
                      <MapPin size={16} />
                      <span>{event.location}</span>
                    </div>
                    <div className="event-detail">
                      <Users size={16} />
                      <span>{event.participants}</span>
                    </div>
                  </div>
                  
                  {event.liveStatus && (
                    <div className="live-status">
                      <strong>Current: {event.liveStatus}</strong>
                    </div>
                  )}
                  
                  {event.winner && (
                    <div className="event-result">
                      <Trophy size={16} />
                      <strong>Winner: {event.winner}</strong>
                      <span className="result-details">{event.result}</span>
                    </div>
                  )}
                  
                  <p className="event-description">{event.description}</p>
                  
                  <button className="event-btn">
                    {event.status === 'live' ? 'Watch Live' : event.status === 'upcoming' ? 'Set Reminder' : 'View Results'}
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <FooterNav />
    </div>
  );
}
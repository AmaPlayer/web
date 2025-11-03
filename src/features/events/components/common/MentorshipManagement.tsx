import React, { useState, useEffect } from 'react';
import { 
  MentorshipConnection, 
  MentorshipRequest, 
  MentorshipStatus,
  MentorProfile as MentorProfileType 
} from '@features/events/types/social.types';
import { mentorshipSystem } from '@features/events/services/mentorshipSystem';
import { MentorProfile } from '@features/events/components/common/MentorProfile';

interface MentorshipManagementProps {
  userId: string;
  userName: string;
  className?: string;
}

export const MentorshipManagement: React.FC<MentorshipManagementProps> = ({
  userId,
  userName,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'find'>('connections');
  const [connections, setConnections] = useState<MentorshipConnection[]>([]);
  const [sentRequests, setSentRequests] = useState<MentorshipRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequest[]>([]);
  const [availableMentors, setAvailableMentors] = useState<MentorProfileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSport, setSearchSport] = useState('Basketball');
  const [selectedConnection, setSelectedConnection] = useState<MentorshipConnection | null>(null);

  const sports = ['Basketball', 'Soccer', 'Tennis', 'Swimming', 'Track and Field', 'Volleyball'];

  const fetchUserData = async () => {
    try {
      setError(null);
      const [userConnections, userSentRequests, userReceivedRequests] = await Promise.all([
        mentorshipSystem.getUserMentorships(userId),
        mentorshipSystem.getUserMentorshipRequests(userId, 'sent'),
        mentorshipSystem.getUserMentorshipRequests(userId, 'received')
      ]);
      
      setConnections(userConnections);
      setSentRequests(userSentRequests);
      setReceivedRequests(userReceivedRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mentorship data');
    } finally {
      setLoading(false);
    }
  };

  const searchMentors = async () => {
    try {
      setError(null);
      const mentors = await mentorshipSystem.findMentors(userId, {
        sport: searchSport,
        skillLevel: 'intermediate' as any // Simplified for demo
      });
      setAvailableMentors(mentors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search mentors');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'find') {
      searchMentors();
    }
  }, [activeTab, searchSport]);

  const handleRequestMentorship = async (mentorId: string, sport: string, message: string, goals: string[]) => {
    try {
      await mentorshipSystem.requestMentorship(userId, mentorId, sport, message, goals);
      await fetchUserData(); // Refresh data
      setActiveTab('requests'); // Switch to requests tab
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send mentorship request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await mentorshipSystem.acceptMentorshipRequest(requestId, userId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await mentorshipSystem.declineMentorshipRequest(requestId, userId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request');
    }
  };

  const handleStartMentorship = async (connectionId: string) => {
    try {
      await mentorshipSystem.startMentorship(connectionId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start mentorship');
    }
  };

  const handleCompleteMentorship = async (connectionId: string, rating: number, review: string) => {
    try {
      await mentorshipSystem.completeMentorship(connectionId, rating, review, 'mentee');
      await fetchUserData(); // Refresh data
      setSelectedConnection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete mentorship');
    }
  };

  const formatDate = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: MentorshipStatus): string => {
    switch (status) {
      case MentorshipStatus.ACTIVE: return 'status-active';
      case MentorshipStatus.COMPLETED: return 'status-completed';
      case MentorshipStatus.ACCEPTED: return 'status-accepted';
      case MentorshipStatus.REQUESTED: return 'status-requested';
      case MentorshipStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const renderConnections = () => {
    if (connections.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">🤝</span>
          <span className="empty-message">No mentorship connections yet</span>
          <span className="empty-subtitle">Find a mentor to start your journey!</span>
        </div>
      );
    }

    return (
      <div className="connections-list">
        {connections.map((connection) => (
          <div key={connection.id} className="connection-card">
            <div className="connection-header">
              <div className="connection-info">
                <h4 className="connection-title">
                  {connection.mentorId === userId ? 'Mentoring' : 'Learning'} {connection.sport}
                </h4>
                <span className="connection-partner">
                  {connection.mentorId === userId ? 
                    `Mentee: User ${connection.menteeId}` : 
                    `Mentor: User ${connection.mentorId}`
                  }
                </span>
              </div>
              <span className={`connection-status ${getStatusColor(connection.status)}`}>
                {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
              </span>
            </div>

            <div className="connection-details">
              <div className="connection-dates">
                <span>Started: {formatDate(connection.startDate)}</span>
                {connection.endDate && (
                  <span>Ended: {formatDate(connection.endDate)}</span>
                )}
              </div>

              {connection.goals.length > 0 && (
                <div className="connection-goals">
                  <h5>Goals:</h5>
                  <ul>
                    {connection.goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {connection.progress.length > 0 && (
                <div className="connection-progress">
                  <h5>Progress ({connection.progress.length} milestone{connection.progress.length !== 1 ? 's' : ''}):</h5>
                  <div className="progress-list">
                    {connection.progress.slice(-3).map((progress) => (
                      <div key={progress.id} className="progress-item">
                        <span className="progress-milestone">{progress.milestone}</span>
                        <span className="progress-date">{formatDate(progress.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {connection.rating && connection.review && (
                <div className="connection-review">
                  <div className="review-rating">
                    <span>Rating: </span>
                    <span className="stars">
                      {'★'.repeat(connection.rating)}{'☆'.repeat(5 - connection.rating)}
                    </span>
                  </div>
                  <p className="review-text">"{connection.review}"</p>
                </div>
              )}
            </div>

            <div className="connection-actions">
              {connection.status === MentorshipStatus.ACCEPTED && connection.mentorId === userId && (
                <button
                  className="btn-start"
                  onClick={() => handleStartMentorship(connection.id)}
                >
                  Start Mentorship
                </button>
              )}
              
              {connection.status === MentorshipStatus.ACTIVE && (
                <>
                  <button
                    className="btn-view-details"
                    onClick={() => setSelectedConnection(connection)}
                  >
                    View Details
                  </button>
                  <button className="btn-message">
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRequests = () => {
    const hasSentRequests = sentRequests.length > 0;
    const hasReceivedRequests = receivedRequests.length > 0;

    if (!hasSentRequests && !hasReceivedRequests) {
      return (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">📨</span>
          <span className="empty-message">No mentorship requests</span>
          <span className="empty-subtitle">Send a request to connect with a mentor!</span>
        </div>
      );
    }

    return (
      <div className="requests-container">
        {hasReceivedRequests && (
          <div className="requests-section">
            <h4 className="requests-title">
              Received Requests ({receivedRequests.length})
            </h4>
            <div className="requests-list">
              {receivedRequests.map((request) => (
                <div key={request.id} className="request-card received">
                  <div className="request-header">
                    <span className="request-sport">{request.sport}</span>
                    <span className="request-date">{formatDate(request.requestedAt)}</span>
                  </div>
                  <div className="request-content">
                    <p className="request-from">From: User {request.menteeId}</p>
                    <p className="request-message">"{request.message}"</p>
                    {request.goals.length > 0 && (
                      <div className="request-goals">
                        <strong>Goals:</strong>
                        <ul>
                          {request.goals.map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-decline"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSentRequests && (
          <div className="requests-section">
            <h4 className="requests-title">
              Sent Requests ({sentRequests.length})
            </h4>
            <div className="requests-list">
              {sentRequests.map((request) => (
                <div key={request.id} className="request-card sent">
                  <div className="request-header">
                    <span className="request-sport">{request.sport}</span>
                    <span className="request-date">{formatDate(request.requestedAt)}</span>
                  </div>
                  <div className="request-content">
                    <p className="request-to">To: User {request.mentorId}</p>
                    <p className="request-message">"{request.message}"</p>
                    <div className="request-status">
                      <span className={`status-badge ${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFindMentors = () => {
    return (
      <div className="find-mentors">
        <div className="search-controls">
          <div className="search-group">
            <label htmlFor="sport-filter" className="search-label">Sport:</label>
            <select
              id="sport-filter"
              className="search-select"
              value={searchSport}
              onChange={(e) => setSearchSport(e.target.value)}
            >
              {sports.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        </div>

        {availableMentors.length > 0 ? (
          <div className="mentors-grid">
            {availableMentors.map((mentor) => (
              <MentorProfile
                key={mentor.id}
                mentor={mentor}
                currentUserId={userId}
                onRequestMentorship={handleRequestMentorship}
                className="mentor-card"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">🔍</span>
            <span className="empty-message">No mentors found</span>
            <span className="empty-subtitle">Try searching for a different sport</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`mentorship-management loading ${className}`}>
        <div className="loading-spinner" aria-hidden="true"></div>
        <span>Loading mentorship data...</span>
      </div>
    );
  }

  return (
    <div className={`mentorship-management ${className}`}>
      <div className="mentorship-header">
        <h3>Mentorship</h3>
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            My Connections ({connections.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests ({sentRequests.length + receivedRequests.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'find' ? 'active' : ''}`}
            onClick={() => setActiveTab('find')}
          >
            Find Mentors
          </button>
        </div>
      </div>

      {error && (
        <div className="mentorship-error" role="alert">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="retry-button"
            onClick={fetchUserData}
            aria-label="Retry loading mentorship data"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mentorship-content">
        {activeTab === 'connections' && renderConnections()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'find' && renderFindMentors()}
      </div>

      {/* Connection Details Modal */}
      {selectedConnection && (
        <div className="modal-overlay" onClick={() => setSelectedConnection(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Mentorship Details</h4>
              <button
                className="modal-close"
                onClick={() => setSelectedConnection(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="connection-full-details">
                <div className="detail-row">
                  <span className="detail-label">Sport:</span>
                  <span className="detail-value">{selectedConnection.sport}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value ${getStatusColor(selectedConnection.status)}`}>
                    {selectedConnection.status.charAt(0).toUpperCase() + selectedConnection.status.slice(1)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Started:</span>
                  <span className="detail-value">{formatDate(selectedConnection.startDate)}</span>
                </div>
                
                {selectedConnection.goals.length > 0 && (
                  <div className="detail-section">
                    <h5>Goals:</h5>
                    <ul className="goals-list">
                      {selectedConnection.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedConnection.progress.length > 0 && (
                  <div className="detail-section">
                    <h5>Progress History:</h5>
                    <div className="progress-timeline">
                      {selectedConnection.progress.map((progress) => (
                        <div key={progress.id} className="timeline-item">
                          <div className="timeline-date">{formatDate(progress.date)}</div>
                          <div className="timeline-content">
                            <h6>{progress.milestone}</h6>
                            <p>{progress.description}</p>
                            <span className="timeline-by">
                              Added by {progress.completedBy}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
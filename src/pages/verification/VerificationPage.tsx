// Public Verification Page - Allow anyone to verify a user
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VerificationService from '../../services/api/verificationService';
import { Play, CheckCircle, Clock, Users, Video, User } from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';
import './VerificationPage.css';

interface VerificationData {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  userRole: string;
  userInfo?: {
    bio?: string;
    age?: number;
    location?: string;
    sport?: string;
  };
  showcaseVideos?: ShowcaseVideo[];
  status: string;
  createdAt: any;
}

interface ShowcaseVideo {
  id?: string;
  videoUrl: string;
  thumbnail?: string;
  fileName: string;
  duration?: string;
}

interface VerificationStats {
  current: number;
  goal: number;
  remaining: number;
  percentage: number;
  isComplete: boolean;
}

interface VoterInfo {
  ip: string;
  userAgent: string;
  referrer: string;
  timestamp: Date;
}

interface VerificationResult {
  success: boolean;
  newCount: number;
  remaining: number;
  isComplete: boolean;
}

const VerificationPage: React.FC = () => {
  const { verificationId } = useParams<{ verificationId: string }>();
  const navigate = useNavigate();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [playingVideo, setPlayingVideo] = useState<ShowcaseVideo | null>(null);
  const [verificationStats, setVerificationStats] = useState<VerificationStats | null>(null);
  const [hasVerified, setHasVerified] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (verificationId) {
      fetchVerificationData();
    }
  }, [verificationId]);

  const fetchVerificationData = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔍 Fetching verification data for ID:', verificationId);
      const data = await VerificationService.getVerificationRequest(verificationId!);
      console.log('📄 Verification data received:', data);
      
      if (!data || !data.id) {
        console.log('❌ No verification data found');
        setError('Verification request not found or has expired.');
        setLoading(false);
        return;
      }
      
      setVerificationData(data as VerificationData);
      
      // Get verification statistics
      const stats = await VerificationService.getVerificationStats(verificationId!);
      setVerificationStats(stats);
      
      // Check if user has already verified (basic IP check will be done on submit)
      const hasVerifiedFromStorage = localStorage.getItem(`verified_${verificationId}`);
      setHasVerified(!!hasVerifiedFromStorage);
      
    } catch (error) {
      console.error('Error fetching verification data:', error);
      setError('Failed to load verification request. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyUser = async (): Promise<void> => {
    if (hasVerified || verifying || !verificationData) return;
    
    setVerifying(true);
    setError('');
    
    try {
      // Get basic user info for verification
      const voterInfo: VoterInfo = {
        ip: 'browser_ip', // Will be determined server-side
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date()
      };
      
      const result: VerificationResult = await VerificationService.submitVerification(verificationId!, voterInfo);
      
      if (result.success) {
        // Mark as verified in local storage
        localStorage.setItem(`verified_${verificationId}`, 'true');
        setHasVerified(true);
        
        // Update stats
        setVerificationStats(prev => prev ? ({
          ...prev,
          current: result.newCount,
          remaining: result.remaining,
          percentage: Math.min(100, (result.newCount / prev.goal) * 100),
          isComplete: result.isComplete
        }) : null);
        
        // Show success message
        if (result.isComplete) {
          alert(`🎉 Congratulations! ${verificationData.userDisplayName} is now verified!`);
        } else {
          alert(`✅ Thank you for verifying! ${result.remaining} more verification${result.remaining !== 1 ? 's' : ''} needed.`);
        }
      }
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      setError(error.message || 'Failed to submit verification. Please try again.');
    }
    
    setVerifying(false);
  };

  const handleVideoPlay = (video: ShowcaseVideo): void => {
    setPlayingVideo(video);
  };

  const handleCloseVideo = (): void => {
    setPlayingVideo(null);
  };

  const handleGoToApp = (): void => {
    navigate('/login');
  };

  const getRoleIcon = (role: string): string => {
    const icons: Record<string, string> = {
      athlete: '🏆',
      coach: '🏃‍♂️',
      organisation: '🏢'
    };
    return icons[role] || '🏆';
  };

  if (loading) {
    return (
      <div className="verification-page loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Loading verification request...</h2>
        </div>
      </div>
    );
  }

  if (error || !verificationData) {
    return (
      <div className="verification-page error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Verification Not Found</h2>
          <p>{error || 'This verification request does not exist or has expired.'}</p>
          <button className="btn-primary" onClick={handleGoToApp}>
            Go to AmaPlayer
          </button>
        </div>
      </div>
    );
  }

  const isComplete = verificationStats?.isComplete;
  const progress = verificationStats ? (verificationStats.current / verificationStats.goal) * 100 : 0;

  return (
    <div className="verification-page">
      {/* Header */}
      <div className="verification-header">
        <div className="app-branding">
          <h1>AmaPlayer</h1>
          <span className="tagline">Sports Social Network</span>
        </div>
        <button className="explore-btn" onClick={handleGoToApp}>
          Explore More
        </button>
      </div>

      {/* Main Content */}
      <div className="verification-content">
        {/* User Profile Section */}
        <div className="user-profile-section">
          <div className="profile-card">
            <div className="profile-image-container">
              <SafeImage 
                src={verificationData.userPhotoURL || ''} 
                alt="Profile" 
                placeholder="avatar"
                className="profile-image"
              />
              <div className="role-badge">
                <span className="role-icon">{getRoleIcon(verificationData.userRole)}</span>
                <span className="role-text">{verificationData.userRole}</span>
              </div>
            </div>
            
            <div className="profile-info">
              <h2>{verificationData.userDisplayName}</h2>
              <p className="verification-request-text">
                wants to be verified as a <strong>{verificationData.userRole}</strong>
              </p>
              
              {verificationData.userInfo?.bio && (
                <p className="bio">{verificationData.userInfo.bio}</p>
              )}
              
              <div className="user-details">
                {verificationData.userInfo?.age && (
                  <span className="detail-item">Age: {verificationData.userInfo.age}</span>
                )}
                {verificationData.userInfo?.location && (
                  <span className="detail-item">📍 {verificationData.userInfo.location}</span>
                )}
                {verificationData.userInfo?.sport && (
                  <span className="detail-item">🏃 {verificationData.userInfo.sport}</span>
                )}
              </div>
            </div>
          </div>

          {/* Verification Progress */}
          <div className="verification-progress">
            <div className="progress-header">
              <h3>
                <Users size={20} />
                Verification Progress
              </h3>
              <div className="progress-stats">
                <span className="current-count">{verificationStats?.current || 0}</span>
                <span className="divider">/</span>
                <span className="goal-count">{verificationStats?.goal || 4}</span>
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="progress-text">
              {isComplete ? (
                <span className="completed">
                  <CheckCircle size={16} />
                  Verification Complete!
                </span>
              ) : (
                <span className="pending">
                  <Clock size={16} />
                  {verificationStats?.remaining || 4} more verification{(verificationStats?.remaining || 4) !== 1 ? 's' : ''} needed
                </span>
              )}
            </div>

            {/* Verification Button */}
            {!isComplete && (
              <button 
                className={`verify-btn ${hasVerified ? 'verified' : ''}`}
                onClick={handleVerifyUser}
                disabled={hasVerified || verifying}
              >
                {verifying ? (
                  <>
                    <div className="btn-spinner"></div>
                    Verifying...
                  </>
                ) : hasVerified ? (
                  <>
                    <CheckCircle size={20} />
                    You've Verified This User
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Verify This User
                  </>
                )}
              </button>
            )}

            {isComplete && (
              <div className="completion-message">
                <CheckCircle size={24} color="#4CAF50" />
                <h4>{verificationData.userDisplayName} is now verified!</h4>
                <p>This user has received their verification badge.</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Videos Section */}
        {verificationData.showcaseVideos && verificationData.showcaseVideos.length > 0 && (
          <div className="videos-section">
            <h3>
              <Video size={20} />
              Talent Showcase ({verificationData.showcaseVideos.length})
            </h3>
            <div className="videos-grid">
              {verificationData.showcaseVideos.map((video, index) => (
                <div key={video.id || index} className="video-card">
                  <video 
                    src={video.videoUrl} 
                    poster={video.thumbnail}
                    className="video-thumbnail"
                    muted
                    preload="metadata"
                  />
                  <div className="video-overlay">
                    <button 
                      className="play-btn"
                      onClick={() => handleVideoPlay(video)}
                    >
                      <Play size={24} />
                    </button>
                  </div>
                  <div className="video-info">
                    <span className="video-name">{video.fileName}</span>
                    <span className="video-duration">{video.duration || '0:00'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="cta-section">
          <h3>Discover More Athletes</h3>
          <p>Join AmaPlayer to connect with athletes, coaches, and sports organizations worldwide!</p>
          <button className="btn-cta" onClick={handleGoToApp}>
            <User size={20} />
            Join AmaPlayer
          </button>
        </div>
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="video-modal-overlay" onClick={handleCloseVideo}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <video 
              src={playingVideo.videoUrl}
              controls
              autoPlay
              className="modal-video-player"
              poster={playingVideo.thumbnail}
            />
            <button className="close-video-btn" onClick={handleCloseVideo}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;

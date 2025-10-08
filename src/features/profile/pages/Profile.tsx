import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FooterNav from '../../../components/layout/FooterNav';
import '../styles/Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <main className="profile-page" role="main">
      {/* Top Navigation Bar */}
      <nav className="profile-nav" role="navigation" aria-label="Profile navigation">
        <div className="profile-nav-content">
          <button
            className="back-button"
            onClick={handleGoBack}
            aria-label="Go back to previous page"
            type="button"
          >
            <ArrowLeft size={24} aria-hidden="true" />
            <span className="back-text">Back</span>
          </button>
          
          <h1 className="profile-nav-title">Profile</h1>
          
          <div className="profile-nav-spacer"></div>
        </div>
      </nav>

      <header className="profile-header" role="banner">
        <div className="profile-avatar">
          <div className="avatar-placeholder" role="img" aria-label="Profile avatar placeholder">
            <span className="avatar-icon" aria-hidden="true">👤</span>
          </div>
        </div>
        
        <div className="profile-info">
          <h1 className="profile-username">प्रोफाइल</h1>
          
          <div className="profile-stats" role="group" aria-label="Profile statistics">
            <div className="stat-item">
              <span className="stat-number" aria-label="4 posts">4</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" aria-label="1 follower">1</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" aria-label="0 following">0</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
          
          <button 
            className="follow-button"
            type="button"
            aria-label="Follow this user"
          >
            Not Following
          </button>
        </div>
      </header>

      <section className="personal-details" aria-labelledby="personal-details-heading">
        <h2 id="personal-details-heading" className="section-title">Personal Details</h2>
        <div className="details-card" role="group" aria-labelledby="personal-details-heading">
          <div className="field-row">
            <span className="field-label" id="name-label">NAME</span>
            <span className="field-value" aria-labelledby="name-label">baboo yogi</span>
          </div>
          <div className="field-row">
            <span className="field-label" id="age-label">AGE</span>
            <span className="field-value" aria-labelledby="age-label">Not specified</span>
          </div>
          <div className="field-row">
            <span className="field-label" id="height-label">HEIGHT</span>
            <span className="field-value" aria-labelledby="height-label">Not specified</span>
          </div>
          <div className="field-row">
            <span className="field-label" id="weight-label">WEIGHT</span>
            <span className="field-value" aria-labelledby="weight-label">Not specified</span>
          </div>
          <div className="field-row">
            <span className="field-label" id="sex-label">SEX</span>
            <span className="field-value" aria-labelledby="sex-label">Not specified</span>
          </div>
          <div className="field-row">
            <span className="field-label" id="role-label">ROLE</span>
            <span className="field-value" aria-labelledby="role-label">athlete</span>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <FooterNav />
    </main>
  );
};

export default Profile;
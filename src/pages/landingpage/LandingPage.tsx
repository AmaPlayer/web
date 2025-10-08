import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-3d-container">
      <div className="main-content">
        <p className="heading">CONNECT COMPETE AND CONQUEROR</p>
        <h1 className="title">AmaPlayer</h1>
        <p className="subheading">LETS PLAY TOGETHER AND RISE</p>
        <Link to="/login" className="login-button">LOGIN</Link>
      </div>
    </div>
  );
};

export default LandingPage;

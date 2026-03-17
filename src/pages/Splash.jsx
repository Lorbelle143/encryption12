import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './Splash.css';

function Splash() {
  const history = useHistory();

  return (
    <div className="splash-page">
      <div className="splash-bg" />

      <div className="splash-content">
        <div className="splash-logo-ring">
          <span className="splash-logo-text">GCO</span>
        </div>

        <h1 className="splash-title">Guidance Counseling Office</h1>
        <p className="splash-subtitle">NBSC — Secure Document Management System</p>

        <button className="splash-btn" onClick={() => history.push('/login')}>
          Get Started
          <span className="splash-arrow">→</span>
        </button>
      </div>

      <div className="splash-footer">
        <p>© {new Date().getFullYear()} NBSC Guidance Counseling Office. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Splash;

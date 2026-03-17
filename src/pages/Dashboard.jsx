import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import gcoLogo from '../assets/gco-logo.png';
import './Dashboard.css';

function Dashboard() {
  const { user, role, loading, isAdmin } = useAuth();
  const history = useHistory();
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      history.push('/login');
    }
  }, [user, loading, history]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin()) return;
      try {
        const { data, error } = await supabase
          .from('folders')
          .select('file_count');
        if (!error && data) {
          setTotalFolders(data.length);
          setTotalFiles(data.reduce((sum, f) => sum + (f.file_count || 0), 0));
        }
      } catch {
        // silently fail stats
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading && isAdmin()) {
      fetchStats();
    }
  }, [loading, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTime');
    history.push('/login');
  };

  if (loading) {
    return null; // Don't show loading spinner, just render nothing briefly
  }

  if (!isAdmin()) {
    return (
      <div className="page">
        <header className="header">
          <div className="header-left">
            <h1>Access Denied</h1>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <span className="btn-icon">🚪</span>
            <span>Logout</span>
          </button>
        </header>
        <div className="content">
          <div className="access-denied">
            <div className="access-denied-icon">🚫</div>
            <h2>Admin Access Required</h2>
            <p>Only administrators can access this system.</p>
            <p className="role-text">Your current role: <strong>{role || 'None'}</strong></p>
            <button onClick={handleLogout} className="btn-primary" style={{ marginTop: '24px' }}>
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <header className="header dashboard-header">
        <div className="header-left">
          <img src={gcoLogo} alt="GCO Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', background: '#fff' }} />
          <div className="header-info">
            <h1>NBSC Guidance Counseling</h1>
            <p className="header-subtitle">Document Management System</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-chip">
            <div className="user-avatar">A</div>
            <span className="user-name">Administrator</span>
            <span className="badge badge-admin">ADMIN</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <span className="btn-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="content dashboard-content">
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Welcome back, Admin 👋</h2>
            <p>Manage and organize your documents securely</p>
          </div>
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-info">
                <span className="stat-label">Total Folders</span>
                <span className="stat-value">{statsLoading ? '...' : totalFolders}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-info">
                <span className="stat-label">Total Files</span>
                <span className="stat-value">{statsLoading ? '...' : totalFiles}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="main-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="cards-grid">
            <div className="action-card upload-card" onClick={() => history.push('/upload')}>
              <div className="card-header">
                <div className="card-icon upload-icon">
                  <span>☁️</span>
                </div>
                <div className="card-badge">New</div>
              </div>
              <div className="card-body">
                <h3>Upload Document</h3>
                <p>Add new encrypted office forms with classification levels</p>
              </div>
              <div className="card-footer">
                <span className="card-link">Upload now →</span>
              </div>
            </div>

            <div className="action-card files-card" onClick={() => history.push('/files')}>
              <div className="card-header">
                <div className="card-icon files-icon">
                  <span>📁</span>
                </div>
              </div>
              <div className="card-body">
                <h3>View All Files</h3>
                <p>Browse, download, and manage all stored documents</p>
              </div>
              <div className="card-footer">
                <span className="card-link">View files →</span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <div className="info-content">
              <h4>Secure & Encrypted</h4>
              <p>All documents are encrypted at rest and in transit</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">🏷️</div>
            <div className="info-content">
              <h4>Classification Levels</h4>
              <p>Organize files by Public, Internal, Confidential, or Restricted</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">👤</div>
            <div className="info-content">
              <h4>Admin Only Access</h4>
              <p>Role-based security ensures only authorized users can access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

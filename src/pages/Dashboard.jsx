import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth, clearSession } from '../hooks/useAuth';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { supabase } from '../lib/supabase';
import { decodeFileRef } from '../lib/storage';
import { getAuditLog } from '../lib/audit';
import gcoLogo from '../assets/gco-logo.png';
import './Dashboard.css';

const SESSION_DURATION = 24 * 60 * 60 * 1000;
const WARN_BEFORE = 30 * 60 * 1000; // warn 30min before expiry

function Dashboard() {
  const { user, role, loading, isAdmin } = useAuth();
  const history = useHistory();
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [archivedFolders, setArchivedFolders] = useState(0);
  const [cloudinaryCount, setCloudinaryCount] = useState(0);
  const [supabaseCount, setSupabaseCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickSearch, setQuickSearch] = useState('');
  // Change password
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changePwMsg, setChangePwMsg] = useState({ text: '', type: '' });
  const [changePwLoading, setChangePwLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) history.push('/login');
  }, [user, loading, history]);

  // Session expiry warning
  useEffect(() => {
    const authTime = localStorage.getItem('authTime');
    if (!authTime) return;
    const check = () => {
      const elapsed = Date.now() - parseInt(authTime);
      const remaining = SESSION_DURATION - elapsed;
      if (remaining <= 0) { clearSession(); history.push('/login'); }
      else if (remaining <= WARN_BEFORE) setSessionWarning(true);
      else setSessionWarning(false);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [history]);

  // Load stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin()) return;
      try {
        setStatsError(false);
        const { data, error } = await supabase.from('folders').select('file_count, file_urls, is_archived');
        if (error) throw error;
        if (data) {
          const active = data.filter(f => !f.is_archived);
          const archived = data.filter(f => f.is_archived);
          setTotalFolders(active.length);
          setArchivedFolders(archived.length);
          let total = 0, cdn = 0, sb = 0;
          for (const folder of active) {
            total += folder.file_count || 0;
            for (const url of (folder.file_urls || [])) {
              const ref = decodeFileRef(url);
              if (ref.provider === 'cloudinary') cdn++;
              else sb++;
            }
          }
          setTotalFiles(total);
          setCloudinaryCount(cdn);
          setSupabaseCount(sb);
        }
      } catch {
        setStatsError(true);
      } finally { setStatsLoading(false); }
    };
    if (!loading && isAdmin()) fetchStats();
  }, [loading, isAdmin]);

  // Load recent audit log
  useEffect(() => {
    getAuditLog(5).then(log => setRecentActivity(log)).catch(() => setRecentActivity([]));
  }, []);

  const handleChangePw = async () => {
    setChangePwMsg({ text: '', type: '' });
    if (!currentPw || !newPw || !confirmPw) {
      setChangePwMsg({ text: 'All fields are required.', type: 'error' }); return;
    }
    if (newPw !== confirmPw) {
      setChangePwMsg({ text: 'New passwords do not match.', type: 'error' }); return;
    }
    if (newPw.length < 8) {
      setChangePwMsg({ text: 'New password must be at least 8 characters.', type: 'error' }); return;
    }
    setChangePwLoading(true);
    try {
      const { data: setting } = await supabase.from('settings').select('value').eq('key', 'master_password_hash').single();
      const storedHash = setting?.value || import.meta.env.VITE_MASTER_KEY_HASH;
      if (!storedHash) { setChangePwMsg({ text: 'System not configured.', type: 'error' }); return; }
      const match = await verifyPassword(currentPw, storedHash);
      if (!match) { setChangePwMsg({ text: 'Current password is incorrect.', type: 'error' }); return; }
      const hash = await hashPassword(newPw);
      const { error } = await supabase.from('settings')
        .upsert({ key: 'master_password_hash', value: hash, updated_at: new Date().toISOString() });
      if (error) { setChangePwMsg({ text: 'Failed to save: ' + error.message, type: 'error' }); return; }
      setChangePwMsg({ text: 'Password changed successfully.', type: 'success' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } finally {
      setChangePwLoading(false);
    }
  };

  const handleLogout = () => { clearSession(); history.push('/login'); };

  if (loading) return null;

  if (!isAdmin()) {
    return (
      <div className="page">
        <header className="header">
          <div className="header-left"><h1>Access Denied</h1></div>
          <button onClick={handleLogout} className="btn-logout"><span className="btn-icon">🚪</span><span>Logout</span></button>
        </header>
        <div className="content">
          <div className="access-denied">
            <div className="access-denied-icon">🚫</div>
            <h2>Admin Access Required</h2>
            <p>Only administrators can access this system.</p>
            <button onClick={handleLogout} className="btn-primary" style={{ marginTop: '24px' }}>Return to Login</button>
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
          <button onClick={() => { setShowChangePw(true); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setChangePwMsg({ text: '', type: '' }); }} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
            🔑 Change Password
          </button>
          <button onClick={handleLogout} className="btn-logout">
            <span className="btn-icon">🚪</span><span>Logout</span>
          </button>
        </div>
      </header>

      {/* Session expiry warning banner */}
      {sessionWarning && (
        <div className="session-warning">
          ⚠️ Your session expires soon. <button onClick={() => { clearSession(); history.push('/login'); }} className="session-warning-link">Log in again</button> to stay active.
        </div>
      )}

      <div className="content dashboard-content">
        {/* Supabase connection error banner */}
        {statsError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
            padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#dc2626', fontSize: '14px' }}>Database connection issue</p>
              <p style={{ margin: '2px 0 0', color: '#ef4444', fontSize: '12px' }}>Could not load stats from Supabase. Check your connection or project status.</p>
            </div>
          </div>
        )}

        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Welcome back, Admin 👋</h2>
            <p>Manage and organize your documents securely</p>
          </div>
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-info">
                <span className="stat-label">Active Folders</span>
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
            <div className="stat-card">
              <div className="stat-icon">🗄️</div>
              <div className="stat-info">
                <span className="stat-label">Archived</span>
                <span className="stat-value">{statsLoading ? '...' : archivedFolders}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">☁️</div>
              <div className="stat-info">
                <span className="stat-label">Cloudinary</span>
                <span className="stat-value">{statsLoading ? '...' : cloudinaryCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: 'white',
            border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0 14px',
            maxWidth: '480px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '15px', marginRight: '8px' }}>🔍</span>
            <input
              type="text"
              placeholder="Quick search folders..."
              value={quickSearch}
              onChange={e => setQuickSearch(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', padding: '11px 4px',
                fontSize: '14px', background: 'transparent', color: '#0f172a', fontFamily: 'inherit'
              }}
            />
            {quickSearch && (
              <button onClick={() => setQuickSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', padding: '0 4px' }}>✕</button>
            )}
            {quickSearch && (
              <button
                onClick={() => history.push(`/files?search=${encodeURIComponent(quickSearch)}`)}
                style={{ background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '7px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginLeft: '8px', whiteSpace: 'nowrap' }}
              >
                Search →
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!statsLoading && totalFolders === 0 && !statsError && (
          <div className="empty-dashboard">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
            <h3>No documents yet</h3>
            <p>Upload your first folder to get started</p>
            <button onClick={() => history.push('/upload')} className="btn-primary" style={{ marginTop: '16px', padding: '12px 28px' }}>
              Upload Now
            </button>
          </div>
        )}

        <div className="main-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="cards-grid">
            <div className="action-card upload-card" onClick={() => history.push('/upload')}>
              <div className="card-header">
                <div className="card-icon upload-icon"><span>☁️</span></div>
                <div className="card-badge">New</div>
              </div>
              <div className="card-body">
                <h3>Upload Document</h3>
                <p>Add new encrypted office forms with classification levels</p>
              </div>
              <div className="card-footer"><span className="card-link">Upload now →</span></div>
            </div>
            <div className="action-card files-card" onClick={() => history.push('/files')}>
              <div className="card-header">
                <div className="card-icon files-icon"><span>📋</span></div>
              </div>
              <div className="card-body">
                <h3>Document Folders</h3>
                <p>Browse, download, and manage all stored encrypted folders</p>
              </div>
              <div className="card-footer"><span className="card-link">View folders →</span></div>
            </div>
            <div className="action-card masterlist-card" onClick={() => history.push('/masterlist')}>
              <div className="card-header">
                <div className="card-icon masterlist-icon"><span>📑</span></div>
              </div>
              <div className="card-body">
                <h3>Masterlist of Internal Records</h3>
                <p>Manage the official records inventory with retention and disposition data</p>
              </div>
              <div className="card-footer"><span className="card-link">Open masterlist →</span></div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="recent-activity">
            <h3 className="section-title">Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((entry, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-body">
                    <span className="activity-action">{entry.action}</span>
                    <span className="activity-detail">{entry.detail}</span>
                  </div>
                  <span className="activity-time">{new Date(entry.time).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Change Password Modal */}
      {showChangePw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setShowChangePw(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800' }}>🔑 Change Master Password</h2>
            <p style={{ margin: '0 0 24px', color: '#888', fontSize: '14px' }}>Changes take effect immediately.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password" disabled={changePwLoading}
                  style={{ width: '100%', padding: '10px 44px 10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888', fontWeight: '600' }}>{showCurrent ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min 8 characters" disabled={changePwLoading}
                  style={{ width: '100%', padding: '10px 44px 10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888', fontWeight: '600' }}>{showNew ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password" disabled={changePwLoading}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            {changePwMsg.text && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
                background: changePwMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: changePwMsg.type === 'error' ? '#dc2626' : '#16a34a',
                border: `1px solid ${changePwMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                {changePwMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleChangePw} disabled={changePwLoading}
                style={{ flex: 1, padding: '11px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: changePwLoading ? 'not-allowed' : 'pointer', opacity: changePwLoading ? 0.6 : 1 }}>
                {changePwLoading ? 'Saving...' : 'Save New Password'}
              </button>
              <button onClick={() => setShowChangePw(false)} disabled={changePwLoading}
                style={{ padding: '11px 20px', background: '#f1f5f9', color: '#333', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { hashPassword } from '../lib/crypto';
import { createSession } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import nbscLogo from '../assets/nbsc-logo.png';
import gcoLogo from '../assets/gco-logo.png';
import './Login.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function Login() {
  const [masterKey, setMasterKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const getAttemptData = () => {
    try {
      return JSON.parse(localStorage.getItem('loginAttempts') || '{"count":0,"time":0}');
    } catch {
      return { count: 0, time: 0 };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { count, time } = getAttemptData();
      const now = Date.now();

      if (count >= MAX_ATTEMPTS && now - time < LOCKOUT_MS) {
        const remaining = Math.ceil((LOCKOUT_MS - (now - time)) / 60000);
        throw new Error(`Too many failed attempts. Try again in ${remaining} minute(s).`);
      }

      // Fetch hash from Supabase settings, fallback to .env
      let storedHash = null;
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'master_password_hash')
        .single();
      if (setting?.value) {
        storedHash = setting.value;
      } else {
        storedHash = import.meta.env.VITE_MASTER_KEY_HASH;
      }
      if (!storedHash) throw new Error('System not configured. Contact administrator.');

      const inputHash = await hashPassword(masterKey);

      if (inputHash === storedHash) {
        localStorage.removeItem('loginAttempts');
        createSession();
        history.push('/dashboard');
      } else {
        const newCount = count >= MAX_ATTEMPTS ? 1 : count + 1;
        localStorage.setItem('loginAttempts', JSON.stringify({ count: newCount, time: now }));
        const remaining = MAX_ATTEMPTS - newCount;
        throw new Error(remaining > 0
          ? `Invalid master key. ${remaining} attempt(s) remaining.`
          : `Too many failed attempts. Try again in 15 minutes.`
        );
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT — branding panel */}
      <div className="login-left">
        <div className="login-left-inner">

          {/* 1. GCO logo + title at top */}
          <img src={gcoLogo} alt="GCO Logo" className="login-gco-logo" />
          <h1 className="login-gco-title">Guidance Counseling Office Encryption</h1>

          {/* 2. NBSC row right below title */}
          <div className="login-nbsc-row">
            <img src={nbscLogo} alt="NBSC Logo" className="login-nbsc-logo" />
            <span className="login-nbsc-name">Northern Bukidnon State College</span>
          </div>

          {/* 3. Feature bullets right below NBSC */}
          <ul className="login-features">
            <li>
              <span className="feat-icon">&#x1F512;</span>
              <span>Encrypted document storage</span>
            </li>
            <li>
              <span className="feat-icon">&#x1F4C1;</span>
              <span>Password-protected folders</span>
            </li>
            <li>
              <span className="feat-icon">&#x1F5C4;</span>
              <span>Archive &amp; restore files</span>
            </li>
          </ul>

        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Enter your master key to access the system.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="master-key">Master Key</label>
              <div className="input-wrap">
                <input
                  id="master-key"
                  type={showPassword ? 'text' : 'password'}
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter your master key"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {message && <div className="login-message">{message}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default Login;

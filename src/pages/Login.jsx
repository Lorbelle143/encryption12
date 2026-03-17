import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { hashPassword } from '../lib/crypto';
import './Login.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function Login() {
  const [masterKey, setMasterKey] = useState('');
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

      // Check lockout
      if (count >= MAX_ATTEMPTS && now - time < LOCKOUT_MS) {
        const remaining = Math.ceil((LOCKOUT_MS - (now - time)) / 60000);
        throw new Error(`Too many failed attempts. Try again in ${remaining} minute(s).`);
      }

      const storedHash = import.meta.env.VITE_MASTER_KEY_HASH;

      if (!storedHash) {
        throw new Error('System not configured. Contact administrator.');
      }

      const inputHash = await hashPassword(masterKey);

      if (inputHash === storedHash) {
        localStorage.removeItem('loginAttempts');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTime', Date.now().toString());
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
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1>NBSC Guidance Counseling</h1>
          <p>Secure Document Management System</p>
        </div>

        <div className="login-card">
          <h2>Admin Access</h2>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Master Key</label>
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Enter master key"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {message && <div className="message">{message}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Access System'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

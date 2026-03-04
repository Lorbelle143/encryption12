import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Login.css';

function Login() {
  const [masterKey, setMasterKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const correctMasterKey = import.meta.env.VITE_MASTER_KEY;
      
      if (!correctMasterKey) {
        throw new Error('Master key not configured. Please set VITE_MASTER_KEY in .env file');
      }

      if (masterKey === correctMasterKey) {
        // Store authentication in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTime', Date.now().toString());
        history.push('/dashboard');
      } else {
        throw new Error('Invalid master key');
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

import { useEffect, useState } from 'react';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate a random session token
function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const authTime = localStorage.getItem('authTime');
      const sessionToken = localStorage.getItem('sessionToken');

      if (isAuthenticated === 'true' && authTime && sessionToken) {
        const elapsed = Date.now() - parseInt(authTime);
        if (elapsed < SESSION_DURATION) {
          setUser({ id: 'admin', email: 'admin' });
          setRole('ADMIN');
        } else {
          clearSession();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const isAdmin = () => role === 'ADMIN';

  return { user, role, loading, isAdmin };
}

export function createSession() {
  const token = generateToken();
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('authTime', Date.now().toString());
  localStorage.setItem('sessionToken', token);
}

export function clearSession() {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('authTime');
  localStorage.removeItem('sessionToken');
}

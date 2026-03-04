import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const authTime = localStorage.getItem('authTime');
      
      // Check if authenticated and session is still valid (24 hours)
      if (isAuthenticated === 'true' && authTime) {
        const timeElapsed = Date.now() - parseInt(authTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (timeElapsed < twentyFourHours) {
          setUser({ id: 'admin', email: 'admin' });
          setRole('ADMIN');
        } else {
          // Session expired
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authTime');
          setUser(null);
          setRole(null);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const isAdmin = () => role === 'ADMIN';

  return { user, role, loading, isAdmin };
}

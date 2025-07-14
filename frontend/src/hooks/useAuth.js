// hooks/useAuth.js
import { useEffect, useState } from 'react';
import API from '../services/api';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Track loading state

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/me', { withCredentials: true });
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { user, loading, refreshAuth: checkAuth }; // ✅ Expose control to refresh
};

export default useAuth;

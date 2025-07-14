import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (err.response?.status !== 401) console.error('Unexpected /auth/me error', err);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
    }
  };

  const login = async (creds) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', creds);
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error('Bad login response');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', userData);
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error('Bad register response');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAuthContextLogout(logout);
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {initialCheckDone ? children : <p>Checking authentication...</p>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

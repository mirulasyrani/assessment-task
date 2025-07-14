import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';
import Loader from '../components/Loader';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // ✅ Fetch the logged-in user via secure cookie
  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data?.user || null);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('❌ Unexpected error during /auth/me:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  // ✅ Login using email + password
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', credentials);
      setUser(res.data?.user || null);
      return res.data?.user;
    } catch (err) {
      console.error('❌ Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register and auto-login
  const register = async (userData) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = userData;
      const res = await API.post('/auth/register', payload);
      setUser(res.data?.user || null);
      return res.data?.user;
    } catch (err) {
      console.error('❌ Register error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout (clears cookie on backend)
  const logout = async () => {
    try {
      await API.post('/auth/logout');
      console.log('✅ Logged out');
    } catch (err) {
      console.error('❌ Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  // ✅ Run once on load
  useEffect(() => {
    setAuthContextLogout(logout); // Optional: allow external logout trigger
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fetchUser,
      }}
    >
      {initialCheckDone ? children : <Loader message="Checking authentication..." />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

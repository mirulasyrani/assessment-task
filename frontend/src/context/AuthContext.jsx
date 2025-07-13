// frontend/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Fetch the logged-in user
  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Unexpected error fetching user:', error);
      }
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', credentials);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', userData);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => !!user;

  useEffect(() => {
    setAuthContextLogout(logout);
    fetchUser(); // ✅ Always try fetching with cookie
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {initialCheckDone && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

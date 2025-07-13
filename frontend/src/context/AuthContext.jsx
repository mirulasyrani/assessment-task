import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me');
      setUser(response.data.user); // ✅ .user instead of full response
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser(); // Always try fetch — cookie handles auth
    setAuthContextLogout(logout);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', credentials);
      setUser(response.data.user); // ✅ .user only
      return response.data.user;
    } catch (error) {
      setUser(null);
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
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

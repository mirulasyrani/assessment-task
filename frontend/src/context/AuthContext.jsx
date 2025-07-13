import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the currently authenticated user
  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me', {
        withCredentials: true, // ✅ Send cookie for auth
      });
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Logout user and clear cookie + state
  const logout = async () => {
    setLoading(true);
    try {
      await API.post('/auth/logout', {}, {
        withCredentials: true, // ✅ Include cookie for logout
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  // Login function (sets user state and stores token)
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', credentials, {
        withCredentials: true, // ✅ Send cookie
      });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', userData, {
        withCredentials: true, // ✅ Send cookie
      });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchUser(); // ✅ Try to authenticate via cookie
    setAuthContextLogout(logout); // Provide logout to interceptor
  }, []);

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

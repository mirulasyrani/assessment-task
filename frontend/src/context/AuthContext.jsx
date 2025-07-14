import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me');
      console.log('✅ /auth/me response:', response.data);

      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        console.warn('⚠️ /auth/me did not return a valid user object:', response.data);
        setUser(null);
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('❌ Unexpected error fetching user:', error);
      } else {
        console.log('ℹ️ Not authenticated, skipping user set.');
      }
      setUser(null);
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
      if (response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error('Invalid login response format');
      }
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
      if (response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error('Invalid register response format');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => !!user;

  useEffect(() => {
    setAuthContextLogout(logout);
    fetchUser();
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
      {initialCheckDone ? children : <p style={{ padding: '2rem' }}>Checking authentication...</p>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

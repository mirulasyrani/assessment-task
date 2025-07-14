import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';
import Loader from '../components/Loader'; // Make sure you have a loader or fallback

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  /**
   * Fetches the authenticated user based on the session cookie.
   */
  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
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

  /**
   * Logs out the user and clears session.
   */
  const logout = async () => {
    try {
      await API.post('/auth/logout');
      console.log('✅ Logged out successfully.');
    } catch (err) {
      console.error('❌ Logout failed:', err);
    } finally {
      setUser(null);
    }
  };

  /**
   * Handles user login.
   */
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', credentials);
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error('Unexpected login response');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user registration.
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...payload } = userData;

      console.log('Register API URL:', process.env.REACT_APP_BACKEND_URL + '/auth/register');
      console.log('Register payload:', payload);

      const res = await API.post('/auth/register', payload);
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error('Unexpected register response');
      }
    } catch (err) {
      console.error('❌ Register error:', err);

      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      } else {
        console.error('Error message:', err.message);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Register logout function for API interceptor use
    setAuthContextLogout(logout);

    // Attempt to fetch the session user from cookie
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

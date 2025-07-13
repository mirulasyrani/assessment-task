import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch current user
    const fetchUser = async () => {
        try {
            const response = await API.get('/auth/me', { withCredentials: true });
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        setLoading(true);
        try {
            await API.post('/auth/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    // Initial load: inject logout and optionally fetch user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }

        // Provide logout to API service
        setAuthContextLogout(logout);
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        try {
            const response = await API.post('/auth/login', credentials, { withCredentials: true });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setUser(user);
            return user;
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
            const response = await API.post('/auth/register', userData, { withCredentials: true });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setUser(user);
            return user;
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

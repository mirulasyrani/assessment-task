// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import API, { setAuthContextLogout } from '../services/api'; // Import setAuthContextLogout

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state for initial auth check

    // Function to fetch user info from backend and update context state
    const fetchUser = async () => {
        try {
            const response = await API.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // This is the primary logout function that updates the context and interacts with backend
    const logout = async () => {
        setLoading(true); // Or a separate authActionLoading state
        try {
            await API.post('/auth/logout');
            setUser(null); // Clear context user state
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if logout request fails, clear local user state for consistency
            setUser(null);
        } finally {
            setLoading(false);
            // Optionally, handle redirect here if not handled by API interceptor
            // window.location.href = '/login'; // The API interceptor will handle this for 401s
        }
    };

    // This useEffect handles the initial authentication check and
    // "injects" the logout function into the API interceptor.
    useEffect(() => {
        fetchUser(); // Perform initial auth check on component mount

        // Provide the logout function to the API interceptor
        // This allows the interceptor to trigger a proper context-aware logout
        // when a 401 response is received.
        setAuthContextLogout(logout);
    }, []); // Run only once on mount

    const login = async (credentials) => {
        setLoading(true); // Or a separate authActionLoading state
        try {
            const response = await API.post('/auth/login', credentials, { withCredentials: true });
            setUser(response.data.user); // Assuming your backend returns user data on successful login
            return response.data.user;
        } catch (error) {
            setUser(null);
            throw error; // Re-throw to be caught by LoginPage
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true); // Or a separate authActionLoading state
        try {
            const response = await API.post('/auth/register', userData, { withCredentials: true });
            // If backend auto-logs in on register, fetch user to update state
            await fetchUser();
            return response.data.user; // Or whatever your backend returns on successful registration
        } catch (error) {
            setUser(null);
            throw error; // Re-throw to be caught by RegisterPage
        } finally {
            setLoading(false);
        }
    };

    // Function to check if authenticated (useful for route guards if not directly using user state)
    const isAuthenticated = () => {
        return !!user;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
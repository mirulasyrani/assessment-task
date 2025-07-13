// src/services/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

// A placeholder for the logout function from AuthContext
// This will be set by AuthProvider once the component mounts.
let authContextLogoutFunction = () => {
    // Default no-op function, useful if interceptor fires before AuthProvider is fully mounted.
    // In practice, this is rare for the 401 scenario as the app would be loaded.
};

// Export a function to allow AuthContext to "inject" its logout method
export const setAuthContextLogout = (logoutFn) => {
    authContextLogoutFunction = logoutFn;
};

const API = axios.create({
    baseURL: 'https://assessment-task-1.onrender.com/api', // Ensure this is your correct backend URL
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies automatically
});

// Global response interceptor to handle errors like unauthorized access
API.interceptors.response.use(
    response => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                // Unauthorized - token expired or invalid, log out user
                toast.error('Session expired. Please log in again.');
                authContextLogoutFunction(); // Call the logout function provided by AuthContext
                window.location.href = '/login'; // Redirect to login page
            } else {
                // Other errors - show generic or server message
                toast.error(error.response.data.message || 'An error occurred');
            }
        } else {
            toast.error('Network error. Please check your connection.');
        }
        return Promise.reject(error);
    }
);

export default API;
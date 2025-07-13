import axios from 'axios';
import { toast } from 'react-toastify';

// A placeholder logout function set by AuthContext
let authContextLogoutFunction = () => {
  // No-op by default
};

// Inject logout from AuthContext
export const setAuthContextLogout = (logoutFn) => {
  authContextLogoutFunction = logoutFn;
};

// Create API instance
const API = axios.create({
  baseURL: 'https://assessment-task-1.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Always include credentials (cookies)
});

// Request interceptor (optional if token-based auth is not used)
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        toast.error('Session expired. Logging out...');
        authContextLogoutFunction(); // Trigger global logout
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast.error(data.message || 'An error occurred.');
      }
    } else {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default API;

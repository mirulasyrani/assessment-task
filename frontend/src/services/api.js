import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};

/**
 * This function is set from AuthContext
 */
export const setAuthContextLogout = (logoutFn) => {
  authContextLogoutFunction = logoutFn;
};

const API = axios.create({
  baseURL: 'https://assessment-task-1.onrender.com/api',
  withCredentials: true, // ✅ Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global error handler for API responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong.';

    if (status === 401) {
      // Avoid logout loop on login page
      const isOnLoginPage = window.location.pathname.includes('/login');
      if (!isOnLoginPage) {
        toast.error('Session expired. Logging out...');
        if (authContextLogoutFunction) authContextLogoutFunction();

        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
      }
    } else if (status && status !== 404) {
      // Avoid spamming for 404 on /me (first load)
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default API;

import axios from 'axios';
import { toast } from 'react-toastify';

// Used for triggering logout from within interceptor
let authContextLogoutFunction = () => {};
export const setAuthContextLogout = (fn) => {
  authContextLogoutFunction = fn;
};

let isLoggingOut = false; // prevent multiple redirects

const API = axios.create({
  baseURL: (process.env.REACT_APP_API_URL ?? 'https://assessment-task-1.onrender.com') + '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && !isLoggingOut && !window.location.pathname.includes('/login')) {
      isLoggingOut = true;
      toast.error('Session expired. Logging out...');
      authContextLogoutFunction?.();

      setTimeout(() => {
        isLoggingOut = false;
        window.location.href = '/login';
      }, 1200);
    } else if (status && status !== 404) {
      const msg = error.response?.data?.message || 'Something went wrong';
      toast.error(msg);

      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/logs/frontend-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: 'API.js interceptor',
            message: msg,
            url: originalRequest?.url,
            method: originalRequest?.method,
            response_status: status,
            response_data: error.response?.data,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (logErr) {
        console.error('Error logging frontend error:', logErr);
      }
    }

    return Promise.reject(error);
  }
);

export default API;

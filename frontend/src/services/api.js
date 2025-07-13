// frontend/services/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};

export const setAuthContextLogout = (logoutFn) => {
  authContextLogoutFunction = logoutFn;
};

const API = axios.create({
  baseURL: 'https://assessment-task-1.onrender.com/api',
  withCredentials: true, // ✅ Include cookies in cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global response error handler
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Logging out...');
        authContextLogoutFunction?.();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
      }
    } else if (status !== 404) {
      // Prevent toast spam on missing routes like /auth/me during first load
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default API;

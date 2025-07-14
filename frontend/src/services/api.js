import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};
export const setAuthContextLogout = (fn) => {
  authContextLogoutFunction = fn;
};

let isLoggingOut = false;

const BACKEND_BASE_URL =
  (process.env.REACT_APP_API_URL || 'https://assessment-task-1.onrender.com').replace(/\/$/, '');

const API = axios.create({
  baseURL: `${BACKEND_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request logging
API.interceptors.request.use((config) => {
  console.log('➡️ API Request:', config.method.toUpperCase(), config.url);
  return config;
});

// Response logging
API.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
    const url = originalRequest?.url || window.location.href;

    if (!error.response) {
      toast.error('[API Error] Network error. Check connection.');
      console.error(`[${method}] ${url}: Network error`, error);
      return Promise.reject(error);
    }

    const status = error.response.status;
    const msg = error.response?.data?.message || 'Something went wrong';

    if (status === 401 && !isLoggingOut && !window.location.pathname.includes('/login')) {
      isLoggingOut = true;
      toast.error('Session expired. Logging out...');
      authContextLogoutFunction?.();

      setTimeout(() => {
        isLoggingOut = false;
        window.location.href = '/login';
      }, 1200);
    } else if (status !== 404) {
      toast.error(`[API Error] ${msg}`);
      console.error(`[${method}] ${url}: ${msg}`);
    }

    return Promise.reject(error);
  }
);

export default API;

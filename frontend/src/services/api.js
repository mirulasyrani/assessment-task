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

// Helper to log frontend errors to backend
const logFrontendError = async ({
  context = 'Unknown context',
  message = 'No message provided',
  stack = '',
  response_status,
  response_data,
  url = '',
  method = '',
}) => {
  try {
    await fetch(`${process.env.REACT_APP_API_URL}/api/logs/frontend-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        message,
        stack,
        response_status,
        response_data,
        url,
        method,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (logErr) {
    console.error('[LOG ERROR] Failed to log frontend error:', logErr);
  }
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
    const url = originalRequest?.url || window.location.href;

    // Handle case where no response is available (e.g. network down)
    if (!error.response) {
      toast.error('[API Error] Network error. Please check your connection.');
      console.error(`[${method}] ${url}: Network error`, error);
      await logFrontendError({
        context: 'API.js interceptor - network error',
        message: error.message,
        stack: error.stack,
        url,
        method,
      });
      return Promise.reject(error);
    }

    const status = error.response.status;
    const msg = error.response?.data?.message || 'Something went wrong';

    // 401 Unauthenticated: trigger logout and redirect
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

      await logFrontendError({
        context: 'API.js interceptor',
        message: msg,
        response_status: status,
        response_data: error.response?.data,
        url,
        method,
        stack: error.stack,
      });
    }

    return Promise.reject(error);
  }
);

export default API;

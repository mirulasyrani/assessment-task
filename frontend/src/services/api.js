import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};
export const setAuthContextLogout = (fn) => {
  authContextLogoutFunction = fn;
};

let isLoggingOut = false;

// ✅ Ensure the base URL is clean and accurate
const BACKEND_BASE_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://assessment-task-1.onrender.com';

const API = axios.create({
  baseURL: `${BACKEND_BASE_URL}/api`,
  withCredentials: true, // ✅ Include cookies for cross-origin auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔧 Log frontend errors (network failures, etc.)
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
    await fetch(`${BACKEND_BASE_URL}/api/logs/frontend-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Send cookies
      mode: 'cors',            // ✅ Cross-origin safe
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

// ✅ Log outgoing API requests
API.interceptors.request.use((config) => {
  console.log(`➡️ API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// ✅ Handle API errors globally
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
    const url = originalRequest?.url || window.location.href;

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

import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};

export const setAuthContextLogout = (logoutFn) => {
  authContextLogoutFunction = logoutFn;
};

const API = axios.create({
  baseURL: 'https://assessment-task-1.onrender.com/api',
  withCredentials: true, // ✅ Critical
  headers: {
    'Content-Type': 'application/json',
  },
});

API.defaults.withCredentials = true;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      toast.error('Session expired. Redirecting...');
      authContextLogoutFunction?.();
      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    } else if (status !== 404) {
      toast.error(error.response?.data?.message || 'Unexpected error');
    }

    return Promise.reject(error);
  }
);

export default API;

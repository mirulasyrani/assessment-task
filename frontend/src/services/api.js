import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};
export const setAuthContextLogout = fn => (authContextLogoutFunction = fn);

const API = axios.create({
  baseURL: 'https://assessment-task-1.onrender.com/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    if (status === 401 && !window.location.pathname.includes('/login')) {
      toast.error('Session expired. Logging out...');
      authContextLogoutFunction?.();
      setTimeout(() => (window.location.href = '/login'), 1200);
    } else if (status !== 404) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
    return Promise.reject(error);
  }
);

export default API;

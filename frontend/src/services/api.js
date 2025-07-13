import axios from 'axios';
import { toast } from 'react-toastify';

let authContextLogoutFunction = () => {};

export const setAuthContextLogout = (logoutFn) => {
  authContextLogoutFunction = logoutFn;
};

const API = axios.create({
  baseURL: 'https://assessment-task-1.onrender.com/api',
  withCredentials: true, // ✅ Always send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        toast.error('Session expired. Logging out...');
        authContextLogoutFunction();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast.error(data.message || 'An error occurred');
      }
    } else {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default API;

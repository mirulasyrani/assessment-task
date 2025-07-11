import { jwtDecode } from 'jwt-decode';

// Get token from localStorage
export const getToken = () => localStorage.getItem('token');

// ✅ Decode token to extract user data (like name, userId)
export const getUser = () => {
  try {
    const token = getToken();
    if (!token) return null;
    return jwtDecode(token); // returns object with name, userId, exp, etc.
  } catch (err) {
    return null;
  }
};

// ✅ Check if token exists and is not expired
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp && decoded.exp > now;
  } catch (err) {
    return false;
  }
};

// ✅ Clear token and redirect to login
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

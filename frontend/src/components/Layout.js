// frontend/src/components/Layout.jsx
import React, { useEffect } from 'react'; // No need for useState for user/loadingAuth
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- Import useAuth from AuthContext
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  // ✅ Get user and loading state directly from AuthContext
  const { user, loading: authLoading, logout } = useAuth(); // Destructure logout from AuthContext

  // 🌙 Toggle and persist dark mode (remains the same)
  const handleToggleDark = () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // 🌅 Restore theme on component mount (auth check is handled by AuthContext itself)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    // No need for initAuth() here, AuthContext handles its own initial fetchUser
  }, []);

  // ✅ Handle logout action using AuthContext's logout
  const handleLogout = async () => {
    await logout(); // Call the logout function from AuthContext
    // The API interceptor and AuthContext's logout should handle redirect.
    // However, an explicit navigate here is harmless and ensures it.
    navigate('/login');
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-branding">
          <Link to="/" className="app-logo">RecruitFlow</Link>
        </div>
        <div className="nav-links">
          {/* ✅ Use authLoading from AuthContext */}
          {!authLoading ? (
            user ? (
              // User is logged in
              <>
                <span className="welcome-msg">👋 Welcome, {user.username || user.email || 'User'}</span>
                <Link to="/dashboard" className="nav-btn">Dashboard</Link>
                <button className="nav-btn" onClick={handleLogout}>Logout</button>
                <button className="nav-btn theme-toggle-btn" onClick={handleToggleDark}>🌓 Dark Mode</button>
              </>
            ) : (
              // User is not logged in
              <>
                <Link to="/register" className="nav-btn">Register</Link>
                <Link to="/login" className="nav-btn">Login</Link>
                <button className="nav-btn theme-toggle-btn" onClick={handleToggleDark}>🌓 Dark Mode</button>
              </>
            )
          ) : (
            // ✅ Loading authentication state from AuthContext
            <span className="nav-loading">Loading...</span>
          )}
        </div>
      </nav>

      <main className="page-wrapper">{children}</main>
    </>
  );
};

export default Layout;
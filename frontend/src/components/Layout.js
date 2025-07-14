import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  // 🌙 Toggle and persist dark mode
  const handleToggleDark = useCallback(() => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, []);

  // 🌅 Restore theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // 🚪 Logout with error fallback
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-branding">
          <Link to="/" className="app-logo">RecruitFlow</Link>
        </div>

        <div className="nav-links">
          {!authLoading ? (
            user ? (
              <>
                <span className="welcome-msg">
                  👋 Welcome, {user.username || user.email || 'User'}
                </span>
                <Link to="/dashboard" className="nav-btn">Dashboard</Link>
                <button className="nav-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/register" className="nav-btn">Register</Link>
                <Link to="/login" className="nav-btn">Login</Link>
              </>
            )
          ) : (
            <span className="nav-loading">Loading...</span>
          )}

          {/* 🌗 Theme toggle is shown regardless of auth state */}
          <button
            className="nav-btn theme-toggle-btn"
            onClick={handleToggleDark}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            🌓 Dark Mode
          </button>
        </div>
      </nav>

      <main className="page-wrapper">{children}</main>
    </>
  );
};

export default Layout;

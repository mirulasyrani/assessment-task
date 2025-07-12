import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated, logout } from '../utils/auth';
import './Layout.css';

const Layout = ({ children }) => {
  // 🌙 Toggle and persist dark mode
  const handleToggleDark = () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // 🌅 Restore theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav-links">
          {isAuthenticated() && (
            <span className="welcome-msg">👋 Welcome, User</span>
          )}

          {!isAuthenticated() ? (
            <>
              <Link to="/register" className="nav-btn">Register</Link>
              <Link to="/login" className="nav-btn">Login</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-btn">Dashboard</Link>
              <button className="nav-btn" onClick={logout}>Logout</button>
              <button className="nav-btn" onClick={handleToggleDark}>🌓 Dark Mode</button>
            </>
          )}
        </div>
      </nav>

      <div className="page-wrapper">{children}</div>
    </>
  );
};

export default Layout;

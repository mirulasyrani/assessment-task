// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound = () => {
  return (
    <Layout>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1 style={{ fontSize: '48px' }}>404</h1>
        <p style={{ fontSize: '18px' }}>Sorry, the page you’re looking for doesn't exist.</p>
        <Link to="/" className="nav-btn" style={{ marginTop: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;

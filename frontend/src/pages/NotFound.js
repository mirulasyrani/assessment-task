import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
// import styles from './NotFound.module.css'; // Uncomment if using CSS module

const NotFound = () => {
  return (
    <Layout>
      <div
        className="not-found-container"
        role="alert"
        aria-labelledby="not-found-title"
        aria-describedby="not-found-desc"
      >
        <h1 id="not-found-title">404</h1>
        <p id="not-found-desc">
          Oops! The page you’re looking for seems to have gone on vacation.
        </p>
        <Link
          to="/"
          className="nav-btn not-found-link-wrapper"
          aria-label="Return to homepage"
        >
          ← Back to Home
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;

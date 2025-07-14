import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
// import './HomePage.css'; // Uncomment if custom styling is needed

const HomePage = () => {
  return (
    <Layout>
      <main className="homepage-section" role="main" aria-labelledby="homepage-title">
        <h2 id="homepage-title">Welcome to RecruitFlow!</h2>
        <p>
          Your simple and efficient system to manage job candidates through different hiring stages—from application to hire.
          Streamline your recruitment process and keep track of every candidate effortlessly.
        </p>

        <div className="homepage-buttons-group">
          <Link to="/login">
            <button
              className="nav-btn"
              aria-label="Navigate to login page"
            >
              Login
            </button>
          </Link>

          <Link to="/register">
            <button
              className="nav-btn"
              aria-label="Navigate to registration page"
            >
              Register
            </button>
          </Link>
        </div>
      </main>
    </Layout>
  );
};

export default HomePage;

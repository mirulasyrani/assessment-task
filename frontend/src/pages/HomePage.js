import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
// import './HomePage.css'; // Uncomment if you create a dedicated CSS file

const HomePage = () => {
  return (
    <Layout>
      <section className="homepage-section"> {/* Using a class */}
        <h2>Welcome to RecruitFlow!</h2> {/* Updated title with product name */}
        <p>Your simple and efficient system to manage job candidates through different hiring stages, from application to hire. Streamline your recruitment process and keep track of every candidate.</p>

        <div className="homepage-buttons-group"> {/* Using a class */}
          <Link to="/login">
            <button
              className="nav-btn" // Reusing the existing nav-btn class
              aria-label="Go to login page"
            >
              Login
            </button>
          </Link>

          <Link to="/register">
            <button
              className="nav-btn" // Reusing the existing nav-btn class
              aria-label="Go to register page"
            >
              Register
            </button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
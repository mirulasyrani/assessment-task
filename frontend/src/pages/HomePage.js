import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const HomePage = () => {
  return (
    <Layout>
      <h2>Welcome to Recruitment Tracker</h2>
      <p>This is a simple system to manage job candidates through different hiring stages.</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/login">
          <button style={{ marginRight: '10px' }}>Login</button>
        </Link>
        <Link to="/register">
          <button>Register</button>
        </Link>
      </div>
    </Layout>
  );
};

export default HomePage;

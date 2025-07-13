import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader" role="alert" aria-busy="true" aria-live="polite">
      <span className="spinner" aria-hidden="true"></span>
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};

export default Loader;

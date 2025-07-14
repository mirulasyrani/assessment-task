import React from 'react';
import './Loader.css';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div
      className="loader"
      role="alert"
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      <span className="spinner" aria-hidden="true"></span>
      <span className="visually-hidden">{message}</span>
    </div>
  );
};

export default Loader;

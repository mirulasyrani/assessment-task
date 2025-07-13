import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext'; // <-- import here

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>    {/* Wrap AuthProvider here */}
        <App />
        <ToastContainer position="top-center" autoClose={3000} />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();

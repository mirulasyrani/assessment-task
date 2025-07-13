// frontend\src\components\ErrorBoundary.jsx
import React from 'react';
import API from '../services/api'; // Your API service for backend communication
// import './ErrorBoundary.css'; // Optional: for styling the fallback UI

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null }; // Store the error object too
  }

  // This lifecycle method is called if an error is thrown in a child component
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error }; // Set error object in state
  }

  // This lifecycle method is called after an error has been thrown
  // It's the place for side effects like logging errors.
  componentDidCatch(error, errorInfo) {
    console.error('❌ Error caught in ErrorBoundary:', error, errorInfo);

    // Set errorInfo in state to display technical details in fallback UI
    this.setState({ errorInfo });

    // 🔐 Send error details to backend logging endpoint
    // This is crucial for monitoring and debugging issues in production.
    API.post('/logs/frontend-error', {
      context: 'ErrorBoundary',
      message: error?.message || 'Unknown frontend error', // Ensure message is always a string
      stack: error?.stack,
      componentStack: errorInfo?.componentStack, // Include component stack for better debugging
      url: window.location.href,
      // `method` is 'N/A' here as this is a frontend runtime error, not an HTTP request error
      method: 'N/A',
      timestamp: new Date().toISOString(),
    }).catch(err => {
      // Log if the error logging itself failed (e.g., network issue to log server)
      console.warn('⚠️ Failed to send frontend error log to backend:', err);
    });
  }

  /**
   * Handles reloading the page when the user clicks the button.
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error is caught
      return (
        <div style={{
            padding: 20,
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
            maxWidth: 600,
            margin: '50px auto',
            border: '1px solid #ffcccc',
            borderRadius: '8px',
            backgroundColor: '#fffafa',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
          <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>😵 Oops! Something went wrong.</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            We're sorry for the inconvenience. Our team has been notified and is working to fix it.
            You can try refreshing the page, which often resolves temporary glitches.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              fontSize: '1em',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            🔁 Reload Page
          </button>
          {/* Display technical details in development or based on an environment flag */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
            <details style={{
                whiteSpace: 'pre-wrap',
                marginTop: '25px',
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e2e6ea',
                borderRadius: '5px',
                padding: '15px',
                overflowX: 'auto',
                fontSize: '0.9em',
                color: '#333'
              }}>
              <summary style={{ fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', color: '#007bff' }}>
                Technical details (visible in development)
              </summary>
              <pre>{this.state.error.toString()}</pre> {/* Show actual error object too */}
              <br/>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
          {/* Alternatively, if you only want the stack without component info in prod,
              you might show this.state.error.stack in details, but hide it usually. */}
        </div>
      );
    }

    // Render children normally if no error
    return this.props.children;
  }
}

export default ErrorBoundary;
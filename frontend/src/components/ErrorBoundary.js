// frontend\src\components\ErrorBoundary.jsx
import React from 'react';
import API from '../services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error caught in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Async logging to backend
    (async () => {
      try {
        await API.post('/logs/frontend-error', {
          context: 'ErrorBoundary',
          message: error?.message || 'Unknown frontend error',
          stack: error?.stack,
          componentStack: errorInfo?.componentStack,
          url: window.location.href,
          method: 'N/A',
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('⚠️ Failed to send frontend error log to backend:', logErr);
      }
    })();
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: 20,
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
            maxWidth: 600,
            margin: '50px auto',
            border: '1px solid #ffcccc',
            borderRadius: '8px',
            backgroundColor: '#fffafa',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>😵 Oops! Something went wrong.</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            We're sorry for the inconvenience. Our team has been notified.
            Try refreshing the page to continue.
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
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#007bff')}
          >
            🔁 Reload Page
          </button>

          {process.env.NODE_ENV === 'development' && errorInfo?.componentStack && (
            <details
              style={{
                whiteSpace: 'pre-wrap',
                marginTop: '25px',
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e2e6ea',
                borderRadius: '5px',
                padding: '15px',
                overflowX: 'auto',
                fontSize: '0.9em',
                color: '#333',
              }}
            >
              <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: '#007bff' }}>
                Technical details (visible in development)
              </summary>
              <pre>{error?.toString() || 'Unknown error'}</pre>
              <br />
              <pre>{errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

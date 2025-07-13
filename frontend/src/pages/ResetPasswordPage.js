import React, { useState, useEffect } from 'react';
import { z } from 'zod'; // Assuming Zod is installed in your frontend
import { useSearchParams, useNavigate } from 'react-router-dom'; // Assuming react-router-dom for navigation and URL params

// Define the Zod schema for password reset
// This should ideally match your backend's reset password schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'], // Path to the field that caused the error
});

// Main ResetPasswordPage component
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract token from URL on component mount
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('Error: Password reset token is missing from the URL.');
      setIsSuccess(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setIsSuccess(false);

    // Client-side validation
    try {
      resetPasswordSchema.parse({ password, confirmPassword });
    } catch (validationError) {
      const fieldErrors = {};
      validationError.errors.forEach(err => {
        if (err.path && err.path.length > 0) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      setMessage('Please correct the errors in the form.');
      setIsSuccess(false);
      return;
    }

    if (!token) {
      setMessage('Error: Password reset token is missing. Cannot reset password.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    try {
      // Replace with your actual backend API endpoint
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password reset successfully! You can now log in.');
        setIsSuccess(true);
        // Optionally redirect to login page after a delay
        setTimeout(() => {
          navigate('/login'); // Adjust to your login route
        }, 3000);
      } else {
        setMessage(data.message || 'Failed to reset password. Please try again.');
        setIsSuccess(false);
        // Log frontend error to backend
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/logs/frontend-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: 'ResetPasswordPage',
            message: 'Backend API call failed for password reset.',
            url: `${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`,
            method: 'POST',
            response_status: response.status,
            response_data: data,
            stack: 'N/A (check backend logs for full stack)',
            timestamp: new Date().toISOString(),
          }),
        }).catch(logErr => console.error('Failed to log frontend error:', logErr));
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      setMessage('An unexpected error occurred. Please try again later.');
      setIsSuccess(false);
      // Log frontend error to backend
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/logs/frontend-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'ResetPasswordPage',
          message: `Network or unexpected error during password reset: ${error.message}`,
          url: `${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`,
          method: 'POST',
          stack: error.stack,
          timestamp: new Date().toISOString(),
        }),
      }).catch(logErr => console.error('Failed to log frontend error:', logErr));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Reset Password</h2>

        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {!token && !message && (
            <div className="p-3 mb-4 rounded-md bg-red-100 text-red-700 text-sm">
                Loading... (Waiting for password reset token in URL)
            </div>
        )}

        {token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                required
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

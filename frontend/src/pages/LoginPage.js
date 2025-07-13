import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../services/api';
import { loginSchema } from '../validation/schemas';
// import { isAuthenticated, fetchUser } from '../utils/auth'; // Potentially remove these direct imports
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { toast } from 'react-toastify';
import styles from './AuthForm.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login: authLogin } = useAuth(); // Use useAuth hook for global state
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [localLoading, setLocalLoading] = useState(false); // Use local loading for form submission

  // Redirect if already authenticated and auth state is loaded
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (field) => {
    try {
      loginSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' })); // Clear error for this field
    } catch (err) {
      const message = err?.errors?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true); // Start local form loading
    setErrors({}); // Clear previous errors

    try {
      // Validate form data using Zod
      loginSchema.parse(form);

      // Call the login function from AuthContext
      await authLogin(form); 

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'ZodError') {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          const field = e.path?.[0] || 'form';
          fieldErrors[field] = e.message;
        });
        setErrors(fieldErrors);
        toast.error(
          `Please fix the following:\n${err.errors.map((e) => `• ${e.message}`).join('\n')}`,
          { autoClose: false, style: { whiteSpace: 'pre-line' } }
        );
      } else if (err.response) {
        // Specific error messages from backend, e.g., 401 Unauthorized
        toast.error(err.response.data.message || 'Login failed. Please check your credentials.');
      } else {
        // Network errors or other unexpected issues
        toast.error('Login failed. Please check your network connection.');
      }
    } finally {
      setLocalLoading(false); // End local form loading
    }
  };

  // If AuthContext is still loading initial auth state, show a loading indicator
  if (authLoading) {
    // You might want a full-page loader here or simply return null
    return <Layout><p>Loading authentication state...</p></Layout>; 
  }

  return (
    <Layout>
      <div className={styles.authContainer}> {/* Optional: Add a container for centering/styling */}
        <h2>Login</h2>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="john.doe@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            required
            className={styles.input}
          />
          {errors.email && (
            <small id="email-error" className={styles.error}>
              {errors.email}
            </small>
          )}

          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="********"
            value={form.password}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={!!errors.password}
            required
            className={styles.input}
          />
          {errors.password && (
            <small id="password-error" className={styles.error}>
              {errors.password}
            </small>
          )}

          <button
            type="submit"
            disabled={localLoading} // Use localLoading here
            aria-busy={localLoading}
            className={styles.button}
          >
            {localLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginPage;
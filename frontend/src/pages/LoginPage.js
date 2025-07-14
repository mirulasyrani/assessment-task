import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { loginSchema } from '../validation/schemas';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from './AuthForm.module.css';
import API from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login: authLogin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const logFrontendErrorToBackend = useCallback(async (error, context) => {
    try {
      const errorDetails = {
        message: error?.message || 'Unknown login error',
        stack: error?.stack,
        context,
        response_data: error?.response?.data,
        response_status: error?.response?.status,
        url: error?.config?.url || window.location.href,
        method: error?.config?.method || 'POST',
        timestamp: new Date().toISOString(),
      };
      await API.post('/logs/frontend-error', errorDetails);
    } catch (logError) {
      console.error('❌ Failed to log error to backend:', logError);
    }
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (field) => {
    try {
      loginSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (err) {
      const message = err?.errors?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setErrors({});

    try {
      loginSchema.parse(form);
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
      } else {
        logFrontendErrorToBackend(err, 'login_failure');
        if (err.response) {
          toast.error(err.response.data?.message || 'Login failed. Please check your credentials.');
        } else {
          toast.error('Login failed. Please check your internet connection.');
        }
      }
    } finally {
      setLocalLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <p>Loading authentication state...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.authContainer}>
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
            autoFocus
            autoComplete="email"
            aria-describedby={errors.email ? 'email-error' : undefined}
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
          <div className={styles.passwordField}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              autoComplete="current-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              required
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={styles.togglePasswordBtn}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <small id="password-error" className={styles.error}>
              {errors.password}
            </small>
          )}

          <button
            type="submit"
            disabled={localLoading}
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

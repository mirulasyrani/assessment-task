import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { registerSchema } from '../validation/schemas';
import { useAuth } from '../context/AuthContext';
import styles from './AuthForm.module.css';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, register: authRegister } = useAuth();

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (field) => {
    try {
      if (field === 'confirmPassword' || field === 'password') {
        registerSchema.pick({ password: true, confirmPassword: true }).parse({
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
      } else {
        registerSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      }
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (e) {
      const fieldPath = e?.errors?.[0]?.path?.[0] || 'unknown';
      const message = e?.errors?.[0]?.message || 'Invalid input';
      if (fieldPath === field || (fieldPath === 'confirmPassword' && (field === 'password' || field === 'confirmPassword'))) {
        setErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setErrors({});

    try {
      registerSchema.parse(form);
      await authRegister(form); // Send only needed fields inside the hook

      toast.success('Registration successful! Redirecting to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'ZodError' && Array.isArray(err.errors)) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          const message = e?.message || 'Invalid input';
          fieldErrors[e?.path?.[0] || 'unknown'] = message;
        });
        setErrors(fieldErrors);
        toast.error(
          `Please fix the following:\n${err.errors.map((e) => `• ${e.message}`).join('\n')}`,
          { autoClose: false, style: { whiteSpace: 'pre-line' } }
        );
      } else if (err.response) {
        if (err.response.status === 409) {
          toast.error(err.response.data.message || 'User with this email/username already exists.');
        } else {
          toast.error(err.response.data.message || 'Registration failed. Please try again.');
        }
      } else {
        toast.error('Registration failed. Please check your network connection.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  if (authLoading) {
    return <Layout><p>Loading authentication state...</p></Layout>;
  }

  return (
    <Layout>
      <div className={styles.authContainer}>
        <h2>Register</h2>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {/* Username */}
          <label htmlFor="username" className={styles.label}>Username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Choose a username"
            value={form.username}
            onChange={handleChange}
            onBlur={() => handleBlur('username')}
            autoComplete="username"
            aria-describedby={errors.username ? "username-error" : undefined}
            aria-invalid={!!errors.username}
            required
            className={styles.input}
          />
          {errors.username && (
            <small id="username-error" role="alert" className={styles.error}>
              {errors.username}
            </small>
          )}

          {/* Full Name */}
          <label htmlFor="full_name" className={styles.label}>Full Name (optional)</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Your full name"
            value={form.full_name}
            onChange={handleChange}
            onBlur={() => handleBlur('full_name')}
            autoComplete="name"
            aria-describedby={errors.full_name ? "full_name-error" : undefined}
            aria-invalid={!!errors.full_name}
            className={styles.input}
          />
          {errors.full_name && (
            <small id="full_name-error" role="alert" className={styles.error}>
              {errors.full_name}
            </small>
          )}

          {/* Email */}
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="your.email@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            required
            className={styles.input}
          />
          {errors.email && (
            <small id="email-error" role="alert" className={styles.error}>
              {errors.email}
            </small>
          )}

          {/* Password */}
          <label htmlFor="password" className={styles.label}>Password</label>
          <div className={styles.passwordField}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              autoComplete="new-password"
              aria-describedby={errors.password ? "password-error" : undefined}
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
            <small id="password-error" role="alert" className={styles.error}>
              {errors.password}
            </small>
          )}

          {/* Confirm Password */}
          <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
          <div className={styles.passwordField}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="********"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur('confirmPassword')}
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              aria-invalid={!!errors.confirmPassword}
              required
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className={styles.togglePasswordBtn}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && (
            <small id="confirmPassword-error" role="alert" className={styles.error}>
              {errors.confirmPassword}
            </small>
          )}

          <button
            type="submit"
            disabled={localLoading}
            aria-busy={localLoading}
            className={styles.button}
          >
            {localLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterPage;

// src/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
// If your `authRegister` function (from AuthContext) handles the API call internally,
// then you do NOT need to import `API` directly here.
// import API from '../services/api'; 
import { registerSchema } from '../validation/schemas';
import { useAuth } from '../context/AuthContext';
import styles from './AuthForm.module.css';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  // Destructure 'register' function from useAuth
  const { user, loading: authLoading, register: authRegister } = useAuth(); 

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated and auth state is loaded
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (field) => {
    try {
      registerSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' })); // Clear error for this field
    } catch (e) {
      const message = e?.errors?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Validate form data using Zod
      registerSchema.parse(form);

      // Call the AuthContext's register function
      await authRegister(form); 

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
        // Handle specific backend errors, e.g., if username/email already exists
        if (err.response.status === 409) { // Assuming 409 Conflict for existing user
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

  // If AuthContext is still loading initial auth state, show a loading indicator
  if (authLoading) {
    return <Layout><p>Loading authentication state...</p></Layout>;
  }

  return (
    <Layout>
      <div className={styles.authContainer}> {/* Assuming you have an .authContainer in AuthForm.module.css */}
        <h2>Register</h2>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {/* Username */}
          <label htmlFor="username" className={styles.label}>
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text" // Explicitly define type for better browser behavior
            placeholder="Choose a username"
            value={form.username}
            onChange={handleChange}
            onBlur={() => handleBlur('username')}
            autoComplete="username"
            aria-describedby={errors.username ? "username-error" : undefined}
            aria-invalid={!!errors.username}
            required // Indicate this field is required
            className={styles.input} {/* Apply input styling */}
          />
          {errors.username && (
            <small id="username-error" role="alert" className={styles.error}> {/* Apply error styling */}
              {errors.username}
            </small>
          )}

          {/* Full Name */}
          <label htmlFor="full_name" className={styles.label}>
            Full Name (optional)
          </label>
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
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
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
            autoComplete="new-password"
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={!!errors.password}
            required
            className={styles.input}
          />
          {errors.password && (
            <small id="password-error" role="alert" className={styles.error}>
              {errors.password}
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
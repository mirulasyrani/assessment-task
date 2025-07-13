// src/pages/ResetPasswordPage.js
import React, { useState } from 'react';
import API from '../services/api';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { z } from 'zod';
import styles from './AuthForm.module.css'; 

// Define simple validation schema with Zod
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
// The pointless .refine() block has been removed as there's no confirmPassword field

const ResetPasswordPage = () => {
  const [form, setForm] = useState({ email: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) { 
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    try {
      resetPasswordSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (err) {
      const message = err?.errors?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); 

    try {
      const parsedForm = resetPasswordSchema.parse(form);
      
      await API.post('/auth/reset-password', parsedForm); 
      
      toast.success('Password updated successfully! You can now log in with your new password.');
      setForm({ email: '', newPassword: '' }); 
    } catch (err) {
      if (err.name === 'ZodError') {
        const fieldErrors = {};
        const messages = ['Please correct the following errors:']; 
        err.errors.forEach((e) => {
          fieldErrors[e.path[0]] = e.message;
          messages.push(`• ${e.message}`); 
        });
        setErrors(fieldErrors);
        toast.error(messages.join('\n'), { 
          autoClose: false,
          style: { whiteSpace: 'pre-line' },
        });
      } else if (err.response) {
        toast.error(err.response?.data?.message || 'Password reset failed. Please try again.');
      } else {
        console.error("Reset Password Error:", err); 
        toast.error('An unexpected error occurred. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.authContainer}> 
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit} noValidate className={styles.form}> 
          {/* Email Input */}
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

          {/* New Password Input */}
          <label htmlFor="newPassword" className={styles.label}>
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            placeholder="At least 6 characters"
            value={form.newPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('newPassword')}
            autoComplete="new-password"
            aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
            aria-invalid={!!errors.newPassword}
            required
            className={styles.input} 
          />
          {errors.newPassword && (
            <small id="newPassword-error" role="alert" className={styles.error}> 
              {errors.newPassword}
            </small>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.button} 
            aria-busy={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
// pages/ResetPasswordPage.js
import React, { useState } from 'react';
import API from '../services/api';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
  const [form, setForm] = useState({ email: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/reset-password', form);
      toast.success('Password updated successfully!');
      setForm({ email: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="newPassword"
          placeholder="New Password"
          type="password"
          value={form.newPassword}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </Layout>
  );
};

export default ResetPasswordPage;

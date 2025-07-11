import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../services/api';
import { loginSchema } from '../validation/schemas';
import { isAuthenticated } from '../utils/auth';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard');
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    setLoading(true);

    try {
      loginSchema.parse(form);

      const res = await API.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'ZodError') {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          const message = e?.message || 'Invalid input';
          fieldErrors[e?.path?.[0] || 'unknown'] = message;
        });
        setErrors(fieldErrors);
      } else if (err.response) {
        toast.error(err.response.data.message || 'Login failed');
      } else {
        toast.error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
        />
        {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}<br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
        />
        {errors.password && <small style={{ color: 'red' }}>{errors.password}</small>}<br />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </Layout>
  );
};

export default LoginPage;

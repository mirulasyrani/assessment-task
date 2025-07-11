import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { registerSchema } from '../validation/schemas'; // Should match the updated schema
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
  });

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
      registerSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (e) {
      const message = e?.errors?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      registerSchema.parse(form);
      const res = await API.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      toast.success('Registration successful');
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'ZodError' && Array.isArray(err.errors)) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          const message = e?.message || 'Invalid input';
          fieldErrors[e?.path?.[0] || 'unknown'] = message;
        });
        setErrors(fieldErrors);
      } else if (err.response) {
        toast.error(err.response.data.message || 'Registration failed');
      } else {
        toast.error('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          onBlur={() => handleBlur('username')}
        />
        {errors.username && <small>{errors.username}</small>}<br />

        <input
          name="full_name"
          placeholder="Full Name (optional)"
          value={form.full_name}
          onChange={handleChange}
          onBlur={() => handleBlur('full_name')}
        />
        {errors.full_name && <small>{errors.full_name}</small>}<br />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
        />
        {errors.email && <small>{errors.email}</small>}<br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
        />
        {errors.password && <small>{errors.password}</small>}<br />

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </Layout>
  );
};

export default RegisterPage;

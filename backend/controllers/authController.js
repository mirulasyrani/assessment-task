const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} = require('../validation/authSchema');

// ✅ Register a new user
const register = async (req, res) => {
  try {
    const { username, full_name, email, password } = registerSchema.parse(req.body);

    const userExists = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User with that email or username already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      `INSERT INTO users (username, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, email`,
      [username, full_name || null, email, hashed]
    );

    const token = jwt.sign({ userId: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ user: newUser.rows[0], token });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Login existing user
const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user.rows.length) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        full_name: user.rows[0].full_name,
        email: user.rows[0].email
      },
      token
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get user profile (authenticated)
const getMe = async (req, res) => {
  try {
    const userId = z.number().int().positive().parse(req.userId);
    const user = await pool.query(
      'SELECT id, username, email, full_name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid token data' });
    }
    console.error('GetMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Reset password (dev/testing)
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = resetPasswordSchema.parse(req.body);

    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, username, email, full_name',
      [hashed, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password reset successful', user: result.rows[0] });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  resetPassword,
};

// src/controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const { loginSchema, registerSchema } = require('../schemas/authSchema');

/**
 * @desc Register a new recruiter
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    console.log('Register request received:', req.body);

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation error during registration:', parsed.error);
      return next(parsed.error);
    }

    const { username, full_name, email, password } = parsed.data;

    const userExists = await pool.query(
      'SELECT 1 FROM recruiters WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      console.warn('Registration failed: Email or username already exists.');
      return next(new CustomError('User with that email or username already exists.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newRecruiter = await pool.query(
      `INSERT INTO recruiters (username, full_name, email, password_hash, name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name, email, created_at`,
      [username, full_name, email, hashedPassword, full_name]
    );

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables!');
      return next(new CustomError('Server configuration error.', 500));
    }

    const token = jwt.sign({ userId: newRecruiter.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None', // ✅ Needed for cookies across domains
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });.status(201).json({
      user: {
        id: newRecruiter.rows[0].id,
        username: newRecruiter.rows[0].username,
        full_name: newRecruiter.rows[0].full_name,
        email: newRecruiter.rows[0].email,
      },
      message: 'Registration successful.',
    });
  } catch (err) {
    console.error('Register error:', err);
    next(err);
  }
};

/**
 * @desc Authenticate a recruiter & get token
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    console.log('Login request received:', req.body);

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation error during login:', parsed.error);
      return next(parsed.error);
    }

    const { email, password } = parsed.data;

    const recruiter = await pool.query('SELECT * FROM recruiters WHERE email = $1', [email]);

    if (!recruiter.rows.length) {
      console.warn('Login failed: Email not found.');
      return next(new CustomError('Invalid credentials.', 401));
    }

    const match = await bcrypt.compare(password, recruiter.rows[0].password_hash);
    if (!match) {
      console.warn('Login failed: Incorrect password.');
      return next(new CustomError('Invalid credentials.', 401));
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables!');
      return next(new CustomError('Server configuration error.', 500));
    }

    const token = jwt.sign({ userId: recruiter.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None', // ✅ Important for cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).status(200).json({
      user: {
        id: recruiter.rows[0].id,
        username: recruiter.rows[0].username,
        full_name: recruiter.rows[0].full_name,
        email: recruiter.rows[0].email,
      },
      message: 'Login successful.',
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

/**
 * @desc Get current authenticated recruiter's data
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.userId) {
      console.warn('Unauthorized access: No userId on request.');
      return next(new CustomError('Unauthorized: User ID not found.', 401));
    }

    const recruiter = await pool.query(
      'SELECT id, username, full_name, email, created_at FROM recruiters WHERE id = $1',
      [req.userId]
    );

    if (!recruiter.rows.length) {
      console.warn('User not found in database.');
      return next(new CustomError('User not found.', 404));
    }

    res.status(200).json({ user: recruiter.rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    next(err);
  }
};

/**
 * @desc Log out recruiter by clearing cookie
 * @route POST /api/auth/logout
 * @access Public
 */
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None', // ✅ Important for cross-origin
  }).status(200).json({ message: 'Logged out successfully.' });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};

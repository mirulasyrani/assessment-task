const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const { loginSchema, registerSchema } = require('../schemas/authSchema');

const isProduction = process.env.NODE_ENV === 'production';

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not defined in environment variables.');
  }

  console.log('🔐 Generating JWT for user ID:', userId);
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const sendAuthCookie = (res, token) => {
  console.log(`🍪 Sending cookie | Secure: ${isProduction} | SameSite: ${isProduction ? 'None' : 'Lax'}`);
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookie = (res) => {
  console.log(`🧹 Clearing cookie | Secure: ${isProduction} | SameSite: ${isProduction ? 'None' : 'Lax'}`);
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
  });
};

const register = async (req, res, next) => {
  console.log('📥 Register request received');

  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error.format());
      return next(parsed.error);
    }

    const { username, full_name, email, password } = parsed.data;

    const existing = await pool.query(
      'SELECT 1 FROM recruiters WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      console.warn('⚠️ User already exists:', email, username);
      return next(new CustomError('User with that email or username already exists.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO recruiters (username, full_name, email, password_hash, name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name, email, created_at`,
      [username, full_name, email, hashedPassword, full_name]
    );

    const token = generateToken(result.rows[0].id);
    sendAuthCookie(res, token);

    res.status(201).json({
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        full_name: result.rows[0].full_name,
        email: result.rows[0].email,
      },
      message: 'Registration successful.',
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    next(err);
  }
};

const login = async (req, res, next) => {
  console.log('📥 Login request received');

  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error.format());
      return next(parsed.error);
    }

    const { email, password } = parsed.data;

    const recruiterRes = await pool.query(
      'SELECT * FROM recruiters WHERE email = $1',
      [email]
    );

    const recruiter = recruiterRes.rows[0];
    if (!recruiter) {
      console.warn('⚠️ No user found with email:', email);
      return next(new CustomError('Invalid credentials.', 401));
    }

    const isMatch = await bcrypt.compare(password, recruiter.password_hash);
    if (!isMatch) {
      console.warn('⚠️ Incorrect password for email:', email);
      return next(new CustomError('Invalid credentials.', 401));
    }

    const token = generateToken(recruiter.id);
    sendAuthCookie(res, token);

    res.status(200).json({
      user: {
        id: recruiter.id,
        username: recruiter.username,
        full_name: recruiter.full_name,
        email: recruiter.email,
      },
      message: 'Login successful.',
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    next(err);
  }
};

const getMe = async (req, res, next) => {
  console.log('📤 GET /me hit | userId from token:', req.userId);
  console.log('📦 Cookies on /me request:', req.cookies);

  try {
    if (!req.userId) {
      return next(new CustomError('Unauthorized: No user ID found.', 401));
    }

    const result = await pool.query(
      'SELECT id, username, full_name, email, created_at FROM recruiters WHERE id = $1',
      [req.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return next(new CustomError('User not found.', 404));
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ getMe error:', err);
    next(err);
  }
};

const logout = async (req, res) => {
  clearAuthCookie(res);
  console.log('👋 Logout completed');
  res.status(200).json({ message: 'Logged out successfully.' });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};

const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const { loginSchema, registerSchema } = require('../schemas/authSchema');

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sendAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // 🔐 For HTTPS only
    sameSite: 'None', // 🌍 For cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  console.log('✅ Auth cookie set with SameSite=None and Secure=true');
};

const register = async (req, res, next) => {
  console.log('📥 Register request:', req.body);
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { username, full_name, email, password } = parsed.data;
    const existing = await pool.query('SELECT 1 FROM recruiters WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) return next(new CustomError('User already exists.', 409));

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(`INSERT INTO recruiters (username, full_name, email, password_hash, name)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, email`,
      [username, full_name, email, hashedPassword, full_name]
    );

    const token = generateToken(result.rows[0].id);
    sendAuthCookie(res, token);

    res.status(201).json({
      user: result.rows[0],
      message: 'Registration successful.'
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    next(err);
  }
};

const login = async (req, res, next) => {
  console.log('📥 Login request:', req.body);
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { email, password } = parsed.data;
    const result = await pool.query('SELECT * FROM recruiters WHERE email = $1', [email]);
    const recruiter = result.rows[0];

    if (!recruiter || !(await bcrypt.compare(password, recruiter.password_hash))) {
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
      message: 'Login successful.'
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    console.log('📤 /me accessed. Token user ID:', req.userId);
    if (!req.userId) return next(new CustomError('Unauthorized.', 401));

    const result = await pool.query('SELECT id, username, full_name, email FROM recruiters WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user) return next(new CustomError('User not found.', 404));

    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ getMe error:', err);
    next(err);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  console.log('👋 Logout: cookie cleared');
  res.status(200).json({ message: 'Logged out successfully.' });
};

module.exports = { register, login, getMe, logout };

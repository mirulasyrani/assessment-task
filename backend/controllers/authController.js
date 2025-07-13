const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

const { loginSchema, registerSchema } = require('../schemas/authSchema');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sendAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.log('✅ Cookie set:', token);
};

exports.register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { username, full_name, email, password } = parsed.data;

    const userExists = await pool.query(
      'SELECT 1 FROM recruiters WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (userExists.rows.length > 0) {
      return next(new CustomError('User already exists.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO recruiters (username, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, email`,
      [username, full_name, email, hashedPassword]
    );

    const token = generateToken(result.rows[0].id);
    sendAuthCookie(res, token);

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return next(parsed.error);

    const { email, password } = parsed.data;

    const userResult = await pool.query(
      'SELECT * FROM recruiters WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];
    if (!user) return next(new CustomError('Invalid credentials', 401));

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return next(new CustomError('Invalid credentials', 401));

    const token = generateToken(user.id);
    sendAuthCookie(res, token);

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.userId) {
      return next(new CustomError('Unauthorized', 401));
    }

    const result = await pool.query(
      'SELECT id, username, full_name, email FROM recruiters WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];
    if (!user) return next(new CustomError('User not found', 404));

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  });

  console.log('🚪 Auth cookie cleared.');
  res.status(200).json({ message: 'Logged out' });
};

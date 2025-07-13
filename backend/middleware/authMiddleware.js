const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

/**
 * Middleware to authenticate user from JWT token in cookie
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new CustomError('Authentication required: No token provided.', 401));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not defined in environment variables.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    const env = process.env.NODE_ENV || 'development';
    if (env !== 'production') {
      console.error('❌ JWT verification error:', err.message);
    }

    // Token error handling
    if (err.name === 'JsonWebTokenError') {
      return next(new CustomError('Authentication failed: Invalid token.', 401));
    }

    if (err.name === 'TokenExpiredError') {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
      });

      return next(new CustomError('Authentication required: Token expired. Please log in again.', 401));
    }

    return next(new CustomError('Authentication failed: Unexpected token error.', 401));
  }
};

module.exports = authMiddleware;

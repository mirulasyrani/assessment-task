const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

/**
 * Middleware to authenticate user from JWT token in cookie
 */
const authMiddleware = (req, res, next) => {
  console.log('🍪 Incoming cookies:', req.cookies);

  if (!req.cookies || !req.cookies.token) {
    console.warn('⚠️ No cookies or token found in request.');
    return next(new CustomError('Authentication required: No token provided.', 401));
  }

  const token = req.cookies.token;

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not defined in environment variables.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    console.log('✅ Token verified. User ID:', req.userId);
    return next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    const isInvalid = err.name === 'JsonWebTokenError';

    console.error(`❌ JWT Error [${err.name}]: ${err.message}`);

    // Clear cookie if token is expired or invalid
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,        // 🔐 Must be true for cross-origin
      sameSite: 'None',    // 🌍 Cross-site safe
    });

    if (isExpired) {
      return next(new CustomError('Authentication required: Token expired. Please log in again.', 401));
    }

    if (isInvalid) {
      return next(new CustomError('Authentication failed: Invalid token.', 401));
    }

    return next(new CustomError('Authentication failed: Unexpected error.', 401));
  }
};

module.exports = authMiddleware;

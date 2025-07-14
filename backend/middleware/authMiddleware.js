const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Middleware to authenticate user from JWT token in cookie
 */
const authMiddleware = (req, res, next) => {
  console.log('🔐 [authMiddleware] Checking authentication...');
  console.log('🌐 ENV:', process.env.NODE_ENV);
  console.log('🍪 Incoming cookies:', req.cookies);

  const token = req.cookies?.token;

  if (!token) {
    console.warn('⚠️ No JWT token found in cookies.');
    return next(new CustomError('Authentication required: No token provided.', 401));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not defined in environment variables.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    console.log('✅ Token verified. Extracted userId:', req.userId);
    return next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    const isInvalid = err.name === 'JsonWebTokenError';

    console.error(`❌ JWT Verification Error [${err.name}]: ${err.message}`);

    // Clear cookie on error
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
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

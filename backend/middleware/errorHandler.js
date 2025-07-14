const { ZodError } = require('zod');
const CustomError = require('../utils/customError');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const method = req.method;
  const url = req.originalUrl;
  const userId = req.userId || 'N/A';

  const errorLog = {
    message: err.message,
    code: err.code,
    name: err.name,
    constraint: err.constraint || undefined,
  };

  // Log error context for debugging
  console.error(`❌ Error in ${method} ${url} by user ${userId}:`, errorLog);

  // Special debug logging for JWT errors
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    console.warn('🛑 JWT error triggered. Logging request cookies and headers:');
    console.warn('🍪 Cookies:', req.cookies || {});
    console.warn('🧠 Headers:', req.headers);
  }

  // Handle Zod validation errors explicitly
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
  }

  // Handle PostgreSQL unique constraint violation (duplicate)
  if (err.code === '23505') {
    let message = 'Duplicate entry. Record already exists.';
    if (err.detail?.includes('email')) {
      message = 'A user with this email already exists.';
    } else if (err.constraint) {
      const fieldName = err.constraint.replace(/_key$/, '').replace(/_/g, ' ');
      message = `Duplicate entry for ${fieldName}.`;
    }

    return res.status(409).json({
      success: false,
      message,
    });
  }

  // Handle PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. Related record not found.',
    });
  }

  // Handle custom errors thrown in your app
  if (err instanceof CustomError) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'An unexpected error occurred.',
    });
  }

  // Fallback for unknown errors
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

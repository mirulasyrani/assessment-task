const rateLimit = require('express-rate-limit');

/**
 * @desc Rate limiter for authentication routes (e.g., /register, /login)
 * Limits requests to prevent brute-force and abuse.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 requests per IP per window
  statusCode: 429,
  standardHeaders: true, // Adds `RateLimit-*` headers
  legacyHeaders: false,  // Disables old `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: false, // Count successful attempts too
});

/**
 * @desc General API limiter (non-auth routes, e.g., /candidates)
 * Higher threshold for general usage.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per IP per window
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
};

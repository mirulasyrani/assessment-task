const rateLimit = require('express-rate-limit');

/**
 * Utility: Safely resolve client IP, respecting proxies like Vercel, Render, etc.
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.ip;
};

/**
 * Logs each blocked request for monitoring/rate-limit auditing.
 */
const logRateLimitHit = (req, message) => {
  const ip = getClientIp(req);
  console.warn(`⛔ Rate limit triggered for IP: ${ip} on ${req.method} ${req.originalUrl}`);
};

/**
 * Rate limiter for sensitive authentication endpoints (e.g., login, register).
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // default 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10, // default max 10 requests per window
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skipSuccessfulRequests: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    logRateLimitHit(req, options.message);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * General API rate limiter for all other routes.
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skipSuccessfulRequests: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    logRateLimitHit(req, options.message);
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};

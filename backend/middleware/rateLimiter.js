const rateLimit = require('express-rate-limit');

/**
 * Utility: Safe IP resolver supporting proxies (like Vercel or Render)
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.ip;
};

/**
 * Logs each blocked request to console
 */
const logRateLimitHit = (req, message) => {
  console.warn(`⛔ Rate limit triggered for IP: ${getClientIp(req)} on ${req.method} ${req.originalUrl}`);
};

/**
 * Rate limiter for sensitive auth routes
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 mins
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
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
 * General API limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100,
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

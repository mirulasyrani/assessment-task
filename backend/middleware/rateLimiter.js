const rateLimit = require('express-rate-limit');

/**
 * @desc Rate limiter for authentication routes (register, login)
 * Limits attempts to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for auth routes
    statusCode: 429, // 429 Too Many Requests
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'error',
        message: 'Too many authentication requests from this IP. Please try again after 15 minutes.',
    },
    // By default, keyGenerator uses `req.ip`. Explicitly stating it for clarity.
    keyGenerator: (req) => req.ip,
    skipSuccessfulRequests: false, // Count successful requests as well
});

/**
 * @desc General API rate limiter for non-authentication routes (e.g., candidate management)
 * Provides a higher limit for typical API usage.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for general API
    statusCode: 429, // 429 Too Many Requests
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many API requests from this IP. Please try again after 15 minutes.',
    },
    keyGenerator: (req) => req.ip,
    skipSuccessfulRequests: false,
});

module.exports = {
    authLimiter,
    apiLimiter,
};
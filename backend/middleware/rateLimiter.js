const rateLimit = require('express-rate-limit');

// Apply to login, register, etc.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please try again later.',
  },
  // ✅ Avoid parsing IP headers yourself
  keyGenerator: (req, res) => {
    return req.ip; // safely returns the IP, especially with `app.set('trust proxy', 1)`
  },
});

module.exports = authLimiter;

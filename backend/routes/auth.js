const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
} = require('../schemas/authSchema');

/**
 * Middleware to log all incoming auth requests with method, path, and IP.
 */
router.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  console.log(`📨 [AUTH] ${req.method} ${req.originalUrl} from ${ip}`);
  next();
});

/**
 * Register a new recruiter
 * Rate limited for protection against abuse.
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  register
);

/**
 * Login an existing recruiter
 * Rate limited to prevent brute force attempts.
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  login
);

/**
 * Get current authenticated recruiter's info
 * Requires valid JWT token (authMiddleware).
 */
router.get('/me', authMiddleware, getMe);

/**
 * Logout recruiter by clearing the auth cookie
 * Does not require authentication.
 */
router.post('/logout', logout);

// Future routes placeholders (optional)
// router.post('/refresh-token', ...)
// router.post('/forgot-password', ...)

module.exports = router;

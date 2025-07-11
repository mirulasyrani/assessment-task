const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  resetPassword,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const authLimiter = require('../middleware/rateLimiter'); // ✅ Rate limiter

// ✅ Import Zod schemas
const {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} = require('../validation/authSchema');

// 🔐 Register new user
router.post('/register', authLimiter, validate(registerSchema), register);

// 🔐 Login existing user
router.post('/login', authLimiter, validate(loginSchema), login);

// 🔐 Get current user profile (protected)
router.get('/me', authMiddleware, getMe);

// 🧪 Dev/test: Reset password (rate-limited)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;

// routes/auth.js
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const {
  registerSchema,
  loginSchema
} = require('../schemas/authSchema');

// Register recruiter
router.post('/register', authLimiter, validate(registerSchema), register);

// Login recruiter
router.post('/login', authLimiter, validate(loginSchema), login);

// Get current authenticated recruiter info
router.get('/me', authMiddleware, getMe);

// Logout (consider making it GET or POST based on frontend use)
router.post('/logout', logout);

module.exports = router;

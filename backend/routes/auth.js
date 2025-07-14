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

// ✅ Register recruiter
router.post('/register', authLimiter, validate(registerSchema), register);

// ✅ Login recruiter
router.post('/login', authLimiter, validate(loginSchema), login);

// ✅ Get current recruiter info
router.get('/me', authMiddleware, getMe);

// ✅ Logout recruiter (stateless logout by clearing cookie)
router.post('/logout', logout);

module.exports = router;

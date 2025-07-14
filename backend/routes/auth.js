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

// ✅ Log incoming request method and route
router.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  console.log(`📨 [AUTH] ${req.method} ${req.originalUrl} from ${ip}`);
  next();
});

// ✅ Register recruiter
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  register
);

// ✅ Login recruiter
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  login
);

// ✅ Get current recruiter info (requires auth)
router.get('/me', authMiddleware, getMe);

// ✅ Logout recruiter (clears cookie, no auth needed)
router.post('/logout', logout);

// 🔧 [Optional Future Routes]
// router.post('/refresh-token', ...)
// router.post('/forgot-password', ...)

module.exports = router;

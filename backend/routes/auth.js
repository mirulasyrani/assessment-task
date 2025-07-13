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
} = require('../../frontend/src/shared/schemas/authSchema');

// Recruiter registration
router.post('/register', authLimiter, validate(registerSchema), register);

// Recruiter login
router.post('/login', authLimiter, validate(loginSchema), login);

// Get current user profile (protected)
router.get('/me', authMiddleware, getMe);

// Log out recruiter
router.post('/logout', logout);

module.exports = router;
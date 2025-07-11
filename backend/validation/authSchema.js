const { z } = require('zod');

// Recruiter Registration Schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  email: z.string().email('Invalid email'),
  full_name: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Recruiter Login Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// Password Reset Schema (for dev/testing)
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
};

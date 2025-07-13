const { z } = require('zod');

// Strong password: 8–32 chars, uppercase, lowercase, number, special char
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d^$*+.!@#$%&]{8,32}$/;

// Email field
const emailField = z
  .string({ required_error: 'Email is required.', invalid_type_error: 'Email must be a string.' })
  .email('Invalid email address format.')
  .max(100, 'Email cannot exceed 100 characters.')
  .trim()
  .toLowerCase();

// Password field
const strongPasswordField = z
  .string({ required_error: 'Password is required.', invalid_type_error: 'Password must be a string.' })
  .min(8, 'Password must be at least 8 characters long.')
  .max(32, 'Password must be at most 32 characters long.')
  .regex(
    strongPasswordRegex,
    'Password must include uppercase, lowercase, number, and special character (8–32 characters).'
  );

// Username (letters, numbers, hyphen, underscore)
const usernameField = z
  .string({ required_error: 'Username is required.', invalid_type_error: 'Username must be a string.' })
  .min(3, 'Username must be at least 3 characters.')
  .max(50, 'Username cannot exceed 50 characters.')
  .trim()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores.');

// Full name (optional, trimmed, letters only)
const fullNameField = z
  .string({ invalid_type_error: 'Full name must be a string.' })
  .trim()
  .max(100, 'Full name cannot exceed 100 characters.')
  .optional()
  .nullable();

// Register schema
const registerSchema = z.object({
  username: usernameField,
  full_name: fullNameField,
  email: emailField,
  password: strongPasswordField,
  confirmPassword: z.string({
    required_error: 'Password confirmation is required.',
    invalid_type_error: 'Password confirmation must be a string.',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

// Login schema
const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'Password is required.', invalid_type_error: 'Password must be a string.' }).min(1),
  rememberMe: z.boolean().optional().default(false),
});

// Password reset request schema
const resetPasswordRequestSchema = z.object({
  email: emailField,
});

// Password reset
const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required.', invalid_type_error: 'Token must be a string.' }).min(1).trim(),
  newPassword: strongPasswordField,
  confirmPassword: z.string({ required_error: 'Password confirmation is required.' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

// Change password
const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required.' }).min(1),
  newPassword: strongPasswordField,
  confirmPassword: z.string({ required_error: 'Password confirmation is required.' }),
})
.refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})
.refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password.',
  path: ['newPassword'],
});

// Verify email schema
const verifyEmailSchema = z.object({
  token: z.string({ required_error: 'Verification token is required.' }).min(1).trim(),
});

// JWT token schema
const jwtTokenSchema = z.object({
  token: z.string({ required_error: 'Token is required.' }).min(1).trim(),
});

// Refresh token schema
const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required.' }).min(1).trim(),
});

// Resend verification
const resendVerificationSchema = z.object({
  email: emailField,
});

// Auth success response schema
const authSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    user: z.object({
      id: z.string(),
      username: z.string(),
      email: z.string(),
      full_name: z.string().nullable(),
      email_verified: z.boolean(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
    token: z.string(),
    refreshToken: z.string(),
  }),
});

// Auth error response schema
const authErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    })
  ).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  jwtTokenSchema,
  refreshTokenSchema,
  resendVerificationSchema,
  authSuccessResponseSchema,
  authErrorResponseSchema,
};

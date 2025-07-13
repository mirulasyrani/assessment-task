import { z } from 'zod';

/**
 * Regex for strong passwords:
 * - At least 8 characters long
 * - At most 32 characters long
 * - Contains at least one uppercase letter (A-Z)
 * - Contains at least one lowercase letter (a-z)
 * - Contains at least one digit (0-9)
 * - Contains at least one special character from the allowed set
 */
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d^$*+.!@#$%&]{8,32}$/;

/**
 * Email validation with consistent rules
 */
const emailField = z
  .string({
    required_error: 'Email is required.',
    invalid_type_error: 'Email must be a string.',
  })
  .email('Invalid email address format.')
  .max(100, 'Email cannot exceed 100 characters.')
  .trim()
  .toLowerCase();

/**
 * Strong password validation
 */
const strongPasswordField = z
  .string({
    required_error: 'Password is required.',
    invalid_type_error: 'Password must be a string.',
  })
  .min(8, 'Password must be at least 8 characters long.')
  .max(32, 'Password must be at most 32 characters long.')
  .regex(
    strongPasswordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (8-32 characters).'
  );

/**
 * Zod schema for Recruiter Registration
 */
const registerSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required.',
      invalid_type_error: 'Username must be a string.',
    })
    .min(3, 'Username must be at least 3 characters long.')
    .max(50, 'Username cannot exceed 50 characters.')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores.'),
  full_name: z
    .string({ invalid_type_error: 'Full name must be a string.' })
    .max(100, 'Full name cannot exceed 100 characters.')
    .trim()
    .min(1, 'Full name cannot be empty.')
    .optional()
    .or(z.literal('')), // Allow empty string or undefined
  email: emailField,
  password: strongPasswordField,
  confirmPassword: z.string({
    required_error: 'Password confirmation is required.',
    invalid_type_error: 'Password confirmation must be a string.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

/**
 * Zod schema for Recruiter Login
 */
const loginSchema = z.object({
  email: emailField,
  password: z
    .string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a string.',
    })
    .min(1, 'Password is required.'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Zod schema for Password Reset Request
 */
const resetPasswordRequestSchema = z.object({
  email: emailField,
});

/**
 * Zod schema for Password Reset Confirmation
 */
const resetPasswordSchema = z.object({
  token: z
    .string({
      required_error: 'Reset token is required.',
      invalid_type_error: 'Reset token must be a string.',
    })
    .min(1, 'Reset token is required.'),
  newPassword: strongPasswordField,
  confirmPassword: z.string({
    required_error: 'Password confirmation is required.',
    invalid_type_error: 'Password confirmation must be a string.',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

/**
 * Zod schema for Change Password (authenticated user)
 */
const changePasswordSchema = z.object({
  currentPassword: z
    .string({
      required_error: 'Current password is required.',
      invalid_type_error: 'Current password must be a string.',
    })
    .min(1, 'Current password is required.'),
  newPassword: strongPasswordField,
  confirmPassword: z.string({
    required_error: 'Password confirmation is required.',
    invalid_type_error: 'Password confirmation must be a string.',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password.',
  path: ['newPassword'],
});

/**
 * Zod schema for Email Verification
 */
const verifyEmailSchema = z.object({
  token: z
    .string({
      required_error: 'Verification token is required.',
      invalid_type_error: 'Verification token must be a string.',
    })
    .min(1, 'Verification token is required.'),
});

/**
 * Zod schema for JWT Token Validation
 */
const jwtTokenSchema = z.object({
  token: z
    .string({
      required_error: 'Token is required.',
      invalid_type_error: 'Token must be a string.',
    })
    .min(1, 'Token is required.'),
});

/**
 * Zod schema for Refresh Token
 */
const refreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: 'Refresh token is required.',
      invalid_type_error: 'Refresh token must be a string.',
    })
    .min(1, 'Refresh token is required.'),
});

/**
 * Zod schema for Resend Email Verification
 */
const resendVerificationSchema = z.object({
  email: emailField,
});

/**
 * Common API Response Schemas
 */
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

const authErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

// JSDoc type definitions for better IDE support
/**
 * @typedef {Object} RegisterInput
 * @property {string} username
 * @property {string} [full_name]
 * @property {string} email
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} LoginInput
 * @property {string} email
 * @property {string} password
 * @property {boolean} [rememberMe]
 */

/**
 * @typedef {Object} AuthSuccessResponse
 * @property {true} success
 * @property {string} message
 * @property {Object} data
 * @property {Object} data.user
 * @property {string} data.token
 * @property {string} data.refreshToken
 */

// Export schemas
export {
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
  strongPasswordRegex,
};
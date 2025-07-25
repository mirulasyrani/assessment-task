import { z } from 'zod';

// ✅ Regex: At least 1 lowercase, 1 uppercase, 1 digit, 1 special char, and 8–32 characters
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/;

// ✅ Shared fields
const emailField = z
  .string()
  .email('Invalid email address')
  .max(100, 'Email must be at most 100 characters')
  .trim()
  .toLowerCase();

const strongPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(32, 'Password must be at most 32 characters')
  .regex(
    strongPasswordRegex,
    'Password must include uppercase, lowercase, number, and special character'
  );

// ✅ User Registration
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores allowed'),
    full_name: z
      .string()
      .max(100, 'Full name too long')
      .trim()
      .optional()
      .or(z.literal('')),
    email: emailField,
    password: strongPasswordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ✅ Login
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// ✅ Reset Password (Request Email)
export const resetPasswordRequestSchema = z.object({
  email: emailField,
});

// ✅ Reset Password (Submit new password with token)
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: strongPasswordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ✅ Change Password (while logged in)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ✅ Email Verification
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ✅ Resend Email Verification
export const resendVerificationSchema = z.object({
  email: emailField,
});

// ✅ JWT & Refresh Token
export const jwtTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

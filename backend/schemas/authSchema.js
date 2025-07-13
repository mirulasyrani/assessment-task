const { z } = require('zod');

// --- Common Fields ---

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d^$*+.!@#$%&]{8,32}$/;

const emailField = z
  .string()
  .email('Invalid email format.')
  .max(100, 'Email can be at most 100 characters.')
  .trim()
  .toLowerCase();

const strongPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(32, 'Password must be at most 32 characters.')
  .regex(strongPasswordRegex, 'Password must include uppercase, lowercase, number, and special character.');

const usernameField = z
  .string()
  .min(3, 'Username must be at least 3 characters.')
  .max(50, 'Username can be at most 50 characters.')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens and underscores are allowed.');

const fullNameField = z
  .string()
  .max(100, 'Full name can be at most 100 characters.')
  .trim()
  .optional()
  .nullable();

const malaysianPhoneField = z
  .string()
  .regex(/^(\+?60|0)1[0-46-9]-?[0-9]{7,8}$/, 'Must be a valid Malaysian phone number.')
  .max(15, 'Phone number must be less than 15 digits.');

// --- Schemas ---

const registerSchema = z
  .object({
    username: usernameField,
    full_name: fullNameField,
    email: emailField,
    password: strongPasswordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
});

const resetPasswordRequestSchema = z.object({
  email: emailField,
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required.').trim(),
    newPassword: strongPasswordField,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: strongPasswordField,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password.',
    path: ['newPassword'],
  });

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required.'),
});

const jwtTokenSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

const resendVerificationSchema = z.object({
  email: emailField,
});

// Example extra field: years of experience
const experienceField = z.coerce
  .number({
    required_error: 'Years of experience is required.',
    invalid_type_error: 'Years of experience must be a number.',
  })
  .min(0, 'Years must be 0 or greater.')
  .max(50, 'Years must be 50 or less.');

// --- Export ---

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

  // common fields (for reuse in candidates schema)
  emailField,
  usernameField,
  fullNameField,
  strongPasswordField,
  malaysianPhoneField,
  experienceField,
};

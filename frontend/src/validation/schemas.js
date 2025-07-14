// Centralized export for all Zod validation schemas

// Auth-related schemas
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  jwtTokenSchema,
  refreshTokenSchema,
  resendVerificationSchema,
} from './authSchema';

// Candidate form schema
import { candidateSchema } from './candidateSchema';

// Export all schemas for easy import elsewhere
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
  candidateSchema,
};

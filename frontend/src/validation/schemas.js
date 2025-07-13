// frontend/src/validation/schemas.js
// This file acts as a central point for frontend schema imports and re-exports.
// It pulls the main schema definitions from the shared folder for consistency
// between frontend and backend.

// Import all authentication-related schemas from the shared authSchema.js
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
  authSuccessResponseSchema,
  authErrorResponseSchema,
  // If strongPasswordRegex is used outside of the schemas in authSchema.js,
  // you might need to import and re-export it here too:
  // strongPasswordRegex,
} from '../shared/schemas/authSchema'; // Path relative to src/validation/

// Import the candidate schema from the shared candidateSchema.js
import { candidateSchema } from '../shared/schemas/candidateSchema'; // Path relative to src/validation/

// Re-export all schemas that are used by other frontend components/pages.
// This allows files like LoginPage, RegisterPage, ResetPasswordPage, CandidateForm
// to import from '../validation/schemas' without needing to change their paths.
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
  candidateSchema,
};
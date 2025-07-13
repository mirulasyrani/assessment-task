// schemas.js
import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/;
const passwordMessage = 'Password must be 8-32 characters, include uppercase, lowercase, number, and special character';

const phoneRegex = /^(\+?60|0)1[0-46-9]-?\d{7,8}$/;
const phoneMessage = 'Phone number must be a valid Malaysian number';

// ✅ Register Schema
export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  full_name: z.string().optional(),
  email: z.string().email('Invalid email'),
  password: z.string().min(8).max(32).regex(passwordRegex, passwordMessage),
});

// ✅ Login Schema (matches register password policy)
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).max(32).regex(passwordRegex, passwordMessage),
});

// ✅ Candidate Schema
export const candidateSchema = z.object({
  name: z.string().min(1, 'Candidate name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(phoneRegex, phoneMessage),
  position: z.string().min(1, 'Position is required'),
  skills: z.string().min(1, 'Skills are required'),
  experience_years: z
    .number({ invalid_type_error: 'Experience must be a number' })
    .nonnegative('Experience must be 0 or more'),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional().nullable(),
});

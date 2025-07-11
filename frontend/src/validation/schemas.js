// schemas.js
import { z } from 'zod';

// Register Schema
export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  full_name: z.string().optional(),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ✅ Updated Candidate Schema
export const candidateSchema = z.object({
  name: z.string().min(1, 'Candidate name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  position: z.string().min(1, 'Position is required'),
  skills: z.string().min(1, 'Skills are required'),
  experience_years: z
    .number({ invalid_type_error: 'Experience must be a number' })
    .nonnegative('Experience must be 0 or more'),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional().nullable(),
});
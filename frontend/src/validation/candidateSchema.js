import { z } from 'zod';

// Malaysian phone number format
const malaysianPhoneRegex = /^(\+?60|0)?1[0-46-9]-?[0-9]{7,8}$/;

// Reusable field schemas
const nameField = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, apostrophes allowed');

const emailField = z
  .string()
  .email('Invalid email')
  .max(100, 'Email must be at most 100 characters')
  .trim()
  .toLowerCase();

const phoneField = z
  .string()
  .regex(malaysianPhoneRegex, 'Invalid Malaysian phone number')
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

const positionField = z
  .string()
  .min(1, 'Position is required')
  .max(100, 'Position must be at most 100 characters')
  .trim();

const skillsField = z
  .string()
  .max(1000, 'Skills must be at most 1000 characters')
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

const experienceYearsField = z
  .coerce.number()
  .min(0, 'Experience must be at least 0 years')
  .max(50, 'Experience cannot exceed 50 years')
  .optional()
  .nullable();

const notesField = z
  .string()
  .max(1000, 'Notes must be at most 1000 characters')
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

// ✅ Exported schema for candidate form validation
export const candidateSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  position: positionField,
  skills: skillsField,
  experience_years: experienceYearsField,
  notes: notesField,
});

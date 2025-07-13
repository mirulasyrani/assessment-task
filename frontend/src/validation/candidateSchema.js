import { z } from 'zod';

const malaysianPhoneRegex = /^(\+?60|0)?1[0-46-9]-?[0-9]{7,8}$/;

const nameField = z
  .string()
  .min(1, 'Name is required')
  .max(100)
  .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, apostrophes allowed');

const emailField = z
  .string()
  .email('Invalid email')
  .max(100)
  .trim()
  .toLowerCase();

const phoneField = z
  .string()
  .regex(malaysianPhoneRegex, 'Invalid Malaysian phone number')
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

const positionField = z.string().min(1, 'Position is required').max(100).trim();

const skillsField = z.string().max(1000).trim().optional().nullable().transform((val) => (val === '' ? null : val));

const experienceYearsField = z.coerce.number().min(0).max(50).optional().nullable();

const notesField = z.string().max(1000).trim().optional().nullable().transform((val) => (val === '' ? null : val));

export const candidateSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  position: positionField,
  skills: skillsField,
  experience_years: experienceYearsField,
  notes: notesField,
});

const { z } = require('zod');

/**
 * Regex for Malaysian mobile phone numbers.
 * Supports formats like:
 * - +60123456789
 * - 0123456789
 * - 012-3456789
 * - 60123456789
 * Malaysian mobile number prefixes typically start with '1' followed by 0-4 or 6-9.
 */
const malaysianPhoneRegex = /^(\+?60|0)?1[0-46-9]-?[0-9]{7,8}$/;

/**
 * Common field validations
 */
const nameField = z
  .string({
    required_error: 'Name is required.',
    invalid_type_error: 'Name must be a string.',
  })
  .min(1, 'Name cannot be empty.')
  .max(100, 'Name cannot exceed 100 characters.')
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes.');

const emailField = z
  .string({
    required_error: 'Email is required.',
    invalid_type_error: 'Email must be a string.',
  })
  .email('Invalid email address format.')
  .max(100, 'Email cannot exceed 100 characters.')
  .trim()
  .toLowerCase();

const phoneField = z
  .string({ invalid_type_error: 'Phone number must be a string.' })
  .max(20, 'Phone number cannot exceed 20 characters.')
  .trim()
  .regex(malaysianPhoneRegex, 'Invalid Malaysian phone number format (e.g., +60123456789 or 012-3456789).')
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

const positionField = z
  .string({
    required_error: 'Position is required.',
    invalid_type_error: 'Position must be a string.',
  })
  .min(1, 'Position cannot be empty.')
  .max(100, 'Position cannot exceed 100 characters.')
  .trim();

const skillsField = z
  .string({ invalid_type_error: 'Skills must be a string.' })
  .max(1000, 'Skills text cannot exceed 1000 characters.')
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

const experienceYearsField = z
  .coerce.number({
    invalid_type_error: 'Experience years must be a number.',
  })
  .int('Experience years must be an integer.')
  .min(0, 'Experience years cannot be negative.')
  .max(50, 'Experience years value is unrealistically high (max 50).')
  .optional()
  .nullable();

const notesField = z
  .string({ invalid_type_error: 'Notes must be a string.' })
  .max(1000, 'Notes cannot exceed 1000 characters.')
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

/**
 * Application status enum with proper validation
 */
const CandidateStatus = z.enum([
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn'
], {
  errorMap: () => ({
    message: 'Invalid application status. Must be one of: applied, screening, interview, offer, hired, rejected, withdrawn.'
  }),
});

/**
 * Priority levels for candidate tracking
 */
const CandidatePriority = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({
    message: 'Invalid priority level. Must be one of: low, medium, high, urgent.'
  }),
});

/**
 * Main candidate schema for creating new candidates
 */
const createCandidateSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  position: positionField,
  skills: skillsField,
  experience_years: experienceYearsField,
  status: CandidateStatus.default('applied'),
  priority: CandidatePriority.default('medium'),
  notes: notesField,
  resume_url: z
    .string()
    .url('Invalid URL format for resume.')
    .optional()
    .nullable(),
  linkedin_url: z
    .string()
    .url('Invalid URL format for LinkedIn profile.')
    .regex(/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Must be a valid LinkedIn URL.')
    .optional()
    .nullable(),
  portfolio_url: z
    .string()
    .url('Invalid URL format for portfolio.')
    .optional()
    .nullable(),
  expected_salary: z
    .coerce.number({
      invalid_type_error: 'Expected salary must be a number.',
    })
    .min(0, 'Expected salary cannot be negative.')
    .max(999999, 'Expected salary value is too high.')
    .optional()
    .nullable(),
  availability_date: z
    .string()
    .datetime('Invalid date format for availability.')
    .optional()
    .nullable(),
  source: z
    .enum(['website', 'linkedin', 'referral', 'job_board', 'agency', 'other'], {
      errorMap: () => ({
        message: 'Invalid source. Must be one of: website, linkedin, referral, job_board, agency, other.'
      }),
    })
    .default('website'),
});

/**
 * Schema for updating existing candidates (all fields optional except ID)
 */
const updateCandidateSchema = z.object({
  id: z
    .string({
      required_error: 'Candidate ID is required for updates.',
      invalid_type_error: 'Candidate ID must be a string.',
    })
    .min(1, 'Candidate ID cannot be empty.'),
  name: nameField.optional(),
  email: emailField.optional(),
  phone: phoneField,
  position: positionField.optional(),
  skills: skillsField,
  experience_years: experienceYearsField,
  status: CandidateStatus.optional(),
  priority: CandidatePriority.optional(),
  notes: notesField,
  resume_url: z
    .string()
    .url('Invalid URL format for resume.')
    .optional()
    .nullable(),
  linkedin_url: z
    .string()
    .url('Invalid URL format for LinkedIn profile.')
    .regex(/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Must be a valid LinkedIn URL.')
    .optional()
    .nullable(),
  portfolio_url: z
    .string()
    .url('Invalid URL format for portfolio.')
    .optional()
    .nullable(),
  expected_salary: z
    .coerce.number({
      invalid_type_error: 'Expected salary must be a number.',
    })
    .min(0, 'Expected salary cannot be negative.')
    .max(999999, 'Expected salary value is too high.')
    .optional()
    .nullable(),
  availability_date: z
    .string()
    .datetime('Invalid date format for availability.')
    .optional()
    .nullable(),
  source: z
    .enum(['website', 'linkedin', 'referral', 'job_board', 'agency', 'other'], {
      errorMap: () => ({
        message: 'Invalid source. Must be one of: website, linkedin, referral, job_board, agency, other.'
      }),
    })
    .optional(),
});

/**
 * Schema for candidate search/filter parameters
 */
const candidateSearchSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  position: z.string().optional(),
  status: CandidateStatus.optional(),
  priority: CandidatePriority.optional(),
  min_experience: z.coerce.number().min(0).optional(),
  max_experience: z.coerce.number().min(0).optional(),
  source: z.enum(['website', 'linkedin', 'referral', 'job_board', 'agency', 'other']).optional(),
  skills: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort_by: z.enum(['name', 'email', 'position', 'status', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for bulk candidate operations
 */
const bulkCandidateOperationSchema = z.object({
  candidate_ids: z
    .array(z.string().min(1, 'Candidate ID cannot be empty.'))
    .min(1, 'At least one candidate ID is required.')
    .max(100, 'Cannot process more than 100 candidates at once.'),
  operation: z.enum(['update_status', 'update_priority', 'delete'], {
    errorMap: () => ({
      message: 'Invalid operation. Must be one of: update_status, update_priority, delete.'
    }),
  }),
  data: z.object({
    status: CandidateStatus.optional(),
    priority: CandidatePriority.optional(),
  }).optional(),
});

/**
 * Response schemas for API consistency
 */
const candidateResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  position: z.string(),
  skills: z.string().nullable(),
  experience_years: z.number().nullable(),
  status: CandidateStatus,
  priority: CandidatePriority,
  notes: z.string().nullable(),
  resume_url: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  portfolio_url: z.string().nullable(),
  expected_salary: z.number().nullable(),
  availability_date: z.string().nullable(),
  source: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  recruiter_id: z.string(),
});

const candidateListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    candidates: z.array(candidateResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }),
  }),
});

const candidateErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

// Export schemas
export {
  createCandidateSchema,
  updateCandidateSchema,
  candidateSearchSchema,
  bulkCandidateOperationSchema,
  candidateResponseSchema,
  candidateListResponseSchema,
  candidateErrorResponseSchema,
  CandidateStatus,
  CandidatePriority,
  malaysianPhoneRegex,
};

// For backward compatibility, also export the original schema name
export const candidateSchema = createCandidateSchema;
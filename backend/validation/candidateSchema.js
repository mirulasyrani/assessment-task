const { z } = require('zod');

const candidateSchema = z.object({
  name: z.string().min(1, 'Candidate name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone number is too short')
    .or(z.literal('').transform(() => undefined))
    .optional(),
  position: z.string().min(1, 'Position is required'),
  skills: z.string().min(1, 'Skills are required'),
  experience_years: z.preprocess(
    (val) => {
      if (val === '') return undefined;
      if (typeof val === 'string') return Number(val);
      return val;
    },
    z
      .number({
        required_error: 'Experience is required',
        invalid_type_error: 'Experience must be a number',
      })
      .min(0, 'Experience must be at least 0')
  ),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional(),
});

module.exports = { candidateSchema };
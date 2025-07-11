const { z } = require('zod');

const candidateSchema = z.object({
  name: z.string().min(1, 'Candidate name is required'),
  position: z.string().min(1, 'Position is required'),
  skills: z.string().min(1, 'Skills are required'),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional(),
});

module.exports = {
  candidateSchema,
};

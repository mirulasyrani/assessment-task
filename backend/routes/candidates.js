const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createCandidateSchema,
  updateCandidateSchema,
  candidateSearchSchema,
} = require('../schemas/candidateSchema');
const { z } = require('zod');

const {
  getCandidates,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');

const idParamSchema = z.object({
  id: z.string().min(1, 'Candidate ID is required'),
});

router.use(authMiddleware);

router.get('/', getCandidates);

router.get('/search', validate(candidateSearchSchema), searchCandidates);

router.get('/filter', validate(candidateSearchSchema), filterCandidates);

router.post('/', validate(createCandidateSchema), createCandidate);

router.put('/:id', validate(updateCandidateSchema), updateCandidate);

router.delete('/:id', validate(idParamSchema), deleteCandidate);

module.exports = router;

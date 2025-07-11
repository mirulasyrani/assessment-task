const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate'); // ✅ Zod middleware
const { candidateSchema } = require('../validation/candidateSchema'); // ✅ Zod schema

const {
  getCandidates,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');

// ✅ Protect all candidate routes
router.use(authMiddleware);

// ✅ Routes
router.get('/', getCandidates);
router.get('/search', searchCandidates);
router.get('/filter', filterCandidates);

// ✅ Zod validation middleware applied here:
router.post('/', validate(candidateSchema), createCandidate);
router.put('/:id', validate(candidateSchema), updateCandidate);

router.delete('/:id', deleteCandidate);

module.exports = router;

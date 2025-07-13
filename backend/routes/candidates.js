const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createCandidateSchema,
  updateCandidateSchema
} = require('../schemas/candidateSchema');

const {
  getCandidates,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');

// All routes in this router require authentication
router.use(authMiddleware);

// Get all candidates
router.get('/', getCandidates);

// Search candidates
router.get('/search', searchCandidates);

// Filter candidates by status
router.get('/filter', filterCandidates);

// Create new candidate
router.post('/', validate(createCandidateSchema), createCandidate);

// Update candidate by ID
router.put('/:id', validate(updateCandidateSchema), updateCandidate);

// Delete candidate by ID
router.delete('/:id', deleteCandidate);

module.exports = router;

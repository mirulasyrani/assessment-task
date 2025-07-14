const express = require('express');
const router = express.Router();
const { z } = require('zod');

const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createCandidateSchema,
  updateCandidateSchema,
  candidateSearchSchema,
} = require('../schemas/candidateSchema');
const {
  getCandidates,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');

const pool = require('../db'); // ✅ PostgreSQL connection pool

// Validate candidate ID param
const idParamSchema = z.object({
  id: z.string().min(1, 'Candidate ID is required'),
});

// ✅ Apply authentication to all candidate routes
router.use(authMiddleware);

/**
 * @route   GET /api/candidates/summary
 * @desc    Returns total count and status breakdown
 * @access  Private
 */
router.get('/summary', async (req, res, next) => {
  try {
    const client = await pool.connect();

    // Total candidate count
    const totalRes = await client.query(`SELECT COUNT(*) FROM candidates WHERE recruiter_id = $1`, [req.userId]);
    const total = parseInt(totalRes.rows[0].count, 10);

    // Count by status
    const statusRes = await client.query(
      `SELECT status, COUNT(*) FROM candidates WHERE recruiter_id = $1 GROUP BY status`,
      [req.userId]
    );

    const summary = { total };
    for (const row of statusRes.rows) {
      summary[row.status] = parseInt(row.count, 10);
    }

    client.release();
    res.status(200).json(summary);
  } catch (err) {
    console.error('❌ Failed to get summary:', err);
    next(err);
  }
});

// ✅ List, search, filter
router.get('/', getCandidates);
router.get('/search', validate(candidateSearchSchema, 'query'), searchCandidates);
router.get('/filter', validate(candidateSearchSchema, 'query'), filterCandidates);

// ✅ Create, update, delete
router.post('/', validate(createCandidateSchema), createCandidate);
router.put('/:id', validate(updateCandidateSchema), updateCandidate);
router.delete('/:id', validate(idParamSchema, 'params'), deleteCandidate);

module.exports = router;

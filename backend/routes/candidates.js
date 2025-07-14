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
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');

const pool = require('../db'); // PostgreSQL connection pool

// Validate candidate ID param
const idParamSchema = z.object({
  id: z.string().min(1, 'Candidate ID is required'),
});

// Protect all candidate routes
router.use(authMiddleware);

/**
 * GET /api/candidates/summary
 * Returns total count and status breakdown
 * Private route
 */
router.get('/summary', async (req, res, next) => {
  let client;
  try {
    client = await pool.connect();

    // Total candidate count for recruiter
    const totalRes = await client.query(
      `SELECT COUNT(*) FROM candidates WHERE recruiter_id = $1`,
      [req.userId]
    );
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

    res.status(200).json(summary);
  } catch (err) {
    console.error('❌ Failed to get summary:', err);
    next(err);
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/candidates
 * List candidates with optional search and filter parameters
 * Combined approach for scalability and simplicity
 */
router.get('/', validate(candidateSearchSchema, 'query'), getCandidates);

// Create new candidate
router.post('/', validate(createCandidateSchema), createCandidate);

// Update existing candidate by ID
router.put('/:id', validate(idParamSchema, 'params'), validate(updateCandidateSchema), updateCandidate);

// Delete candidate by ID
router.delete('/:id', validate(idParamSchema, 'params'), deleteCandidate);

module.exports = router;

// backend/routes/candidates.js

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

const idParamSchema = z.object({
  id: z.string().min(1, 'Candidate ID is required'),
});

const pool = require('../db'); // ✅ make sure this points to your PostgreSQL pool

// Protect all routes
router.use(authMiddleware);

// ✅ Working summary route using raw SQL
router.get('/summary', async (req, res, next) => {
  try {
    const client = await pool.connect();

    // Count total candidates
    const totalRes = await client.query(`SELECT COUNT(*) FROM candidates`);
    const total = parseInt(totalRes.rows[0].count, 10);

    // Group by status
    const statusRes = await client.query(`
      SELECT status, COUNT(*) FROM candidates GROUP BY status
    `);

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

router.get('/', getCandidates);
router.get('/search', validate(candidateSearchSchema), searchCandidates);
router.get('/filter', validate(candidateSearchSchema), filterCandidates);
router.post('/', validate(createCandidateSchema), createCandidate);
router.put('/:id', validate(updateCandidateSchema), updateCandidate);
router.delete('/:id', validate(idParamSchema), deleteCandidate);

module.exports = router;

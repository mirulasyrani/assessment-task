const pool = require('../db');
const { z } = require('zod');
const CustomError = require('../utils/customError');

// GET /api/candidates
const getCandidates = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const parsedPage = z.coerce.number().int().min(1).parse(page);
    const parsedLimit = z.coerce.number().int().min(1).max(100).parse(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    const result = await pool.query(
      `SELECT * FROM candidates
       WHERE recruiter_id = $1
       ORDER BY ${sort_by} ${sort_order.toUpperCase()}
       LIMIT $2 OFFSET $3`,
      [req.userId, parsedLimit, offset]
    );

    const count = await pool.query(
      'SELECT COUNT(*) FROM candidates WHERE recruiter_id = $1',
      [req.userId]
    );

    res.status(200).json({
      success: true,
      data: {
        candidates: result.rows,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: parseInt(count.rows[0].count),
          pages: Math.ceil(count.rows[0].count / parsedLimit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/candidates/search?q=term
const searchCandidates = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.status(200).json([]);
    }

    const result = await pool.query(
      `SELECT * FROM candidates
       WHERE recruiter_id = $1 AND (
         LOWER(name) ILIKE $2 OR
         LOWER(position) ILIKE $2 OR
         LOWER(skills) ILIKE $2
       )
       ORDER BY created_at DESC`,
      [req.userId, `%${q.toLowerCase()}%`]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/candidates/filter (optional, you can remove this if search covers it)
const filterCandidates = async (req, res, next) => {
  try {
    const status = req.query.status;
    if (!status) return res.status(200).json([]);

    const result = await pool.query(
      `SELECT * FROM candidates
       WHERE recruiter_id = $1 AND status = $2
       ORDER BY created_at DESC`,
      [req.userId, status]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/candidates
const createCandidate = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      skills,
      experience_years,
      status,
      priority,
      notes,
      resume_url,
      linkedin_url,
      portfolio_url,
      expected_salary,
      availability_date,
      source,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO candidates (
        recruiter_id, name, email, phone, position, skills,
        experience_years, status, priority, notes,
        resume_url, linkedin_url, portfolio_url,
        expected_salary, availability_date, source
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16
      )
      RETURNING *`,
      [
        req.userId, name, email, phone, position, skills,
        experience_years, status, priority, notes,
        resume_url, linkedin_url, portfolio_url,
        expected_salary, availability_date, source,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/candidates/:id
const updateCandidate = async (req, res, next) => {
  try {
    const candidateId = z.string().uuid().parse(req.params.id);
    const fields = req.body;

    // Build dynamic SET clause
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return next(new CustomError('No fields provided to update.', 400));
    }

    const updates = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = keys.map((key) => fields[key]);

    values.push(candidateId);       // $n+1
    values.push(req.userId);        // $n+2

    const result = await pool.query(
      `UPDATE candidates SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length - 1} AND recruiter_id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return next(new CustomError('Candidate not found or not authorized.', 404));
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/candidates/:id
const deleteCandidate = async (req, res, next) => {
  try {
    const candidateId = z.string().uuid().parse(req.params.id);

    const result = await pool.query(
      'DELETE FROM candidates WHERE id = $1 AND recruiter_id = $2 RETURNING *',
      [candidateId, req.userId]
    );

    if (result.rows.length === 0) {
      return next(new CustomError('Candidate not found or not authorized.', 404));
    }

    res.status(200).json({ message: 'Candidate deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCandidates,
  searchCandidates,
  filterCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
};

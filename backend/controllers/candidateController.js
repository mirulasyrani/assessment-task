const pool = require('../db');
const { z } = require('zod');
const CustomError = require('../utils/customError');
const {
  createCandidateSchema,
  updateCandidateSchema,
  candidateSearchSchema,
} = require('../schemas/candidateSchema');

const VALID_SORT_COLUMNS = ['created_at', 'name', 'position', 'status'];

// Centralized Zod error handler
const handleZodError = (err, next) => {
  if (err instanceof z.ZodError) {
    return next(new CustomError('Validation Error', 400, err.format()));
  }
  next(err);
};

// GET /api/candidates
const getCandidates = async (req, res, next) => {
  try {
    const parsedQuery = candidateSearchSchema.safeParse(req.query);

    if (!parsedQuery.success) {
      console.error('❌ Validation failed for getCandidates query:', parsedQuery.error.format());
      return handleZodError(parsedQuery.error, next);
    }

    const {
      page,
      limit,
      sort_by,
      sort_order,
      status,
      name,
      position,
      priority,
    } = parsedQuery.data;

    const offset = Math.max((page - 1) * limit, 0);
    const sortBy = VALID_SORT_COLUMNS.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Base query strings
    let query = `SELECT * FROM candidates WHERE recruiter_id = $1`;
    let countQuery = `SELECT COUNT(*) FROM candidates WHERE recruiter_id = $1`;
    const queryParams = [req.userId];
    let paramIndex = 2;

    // Dynamic filters
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      countQuery += ` AND priority = $${paramIndex}`;
      queryParams.push(priority);
      paramIndex++;
    }
    if (name) {
      query += ` AND LOWER(name) LIKE $${paramIndex}`;
      countQuery += ` AND LOWER(name) LIKE $${paramIndex}`;
      queryParams.push(`%${name.toLowerCase()}%`);
      paramIndex++;
    }
    if (position) {
      query += ` AND LOWER(position) LIKE $${paramIndex}`;
      countQuery += ` AND LOWER(position) LIKE $${paramIndex}`;
      queryParams.push(`%${position.toLowerCase()}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Execute queries
    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, paramIndex - 1)), // exclude limit/offset for count
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    res.status(200).json({
      success: true,
      data: {
        candidates: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('❌ Error in getCandidates:', err);
    handleZodError(err, next);
  }
};

// POST /api/candidates
const createCandidate = async (req, res, next) => {
  try {
    const parsed = createCandidateSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('❌ Validation failed for createCandidate:', parsed.error.format());
      return handleZodError(parsed.error, next);
    }

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
    } = parsed.data;

    const values = [
      req.userId,
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
    ];

    const result = await pool.query(
      `INSERT INTO candidates (
          recruiter_id, name, email, phone, position, skills,
          experience_years, status, priority, notes,
          resume_url, linkedin_url, portfolio_url,
          expected_salary, availability_date, source
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16
        ) RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error in createCandidate:', err);
    handleZodError(err, next);
  }
};

// PUT /api/candidates/:id
const updateCandidate = async (req, res, next) => {
  try {
    const candidateId = z.string().uuid('Invalid candidate ID format.').parse(req.params.id);

    const parsedFields = updateCandidateSchema.safeParse(req.body);
    if (!parsedFields.success) {
      console.error('❌ Validation failed for updateCandidate:', parsedFields.error.format());
      return handleZodError(parsedFields.error, next);
    }

    const fieldsToUpdate = parsedFields.data;
    const keys = Object.keys(fieldsToUpdate);

    if (keys.length === 0) {
      return next(new CustomError('No valid fields provided to update.', 400));
    }

    const updates = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = keys.map((key) => fieldsToUpdate[key]);

    values.push(candidateId);
    values.push(req.userId);

    const result = await pool.query(
      `UPDATE candidates SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length - 1} AND recruiter_id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return next(new CustomError('Candidate not found or not authorized to update.', 404));
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error in updateCandidate:', err);
    handleZodError(err, next);
  }
};

// DELETE /api/candidates/:id
const deleteCandidate = async (req, res, next) => {
  try {
    const candidateId = z.string().uuid('Invalid candidate ID format.').parse(req.params.id);

    const result = await pool.query(
      'DELETE FROM candidates WHERE id = $1 AND recruiter_id = $2 RETURNING *',
      [candidateId, req.userId]
    );

    if (result.rows.length === 0) {
      return next(new CustomError('Candidate not found or not authorized to delete.', 404));
    }

    res.status(200).json({ message: 'Candidate deleted successfully.' });
  } catch (err) {
    console.error('❌ Error in deleteCandidate:', err);
    handleZodError(err, next);
  }
};

module.exports = {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
};

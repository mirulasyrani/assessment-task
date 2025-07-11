const pool = require('../db');
const { candidateSchema } = require('../validation/candidateSchema');
const { z } = require('zod');

// ✅ Get all candidates for the logged-in recruiter
const getCandidates = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM candidates WHERE recruiter_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getCandidates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Search candidates
const searchCandidates = async (req, res) => {
  const q = req.query.q || '';
  try {
    const result = await pool.query(
      `SELECT * FROM candidates
       WHERE recruiter_id = $1 AND 
       (LOWER(name) LIKE $2 OR LOWER(position) LIKE $2 OR LOWER(skills) LIKE $2)
       ORDER BY created_at DESC`,
      [req.userId, `%${q.toLowerCase()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in searchCandidates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Filter by status
const filterCandidates = async (req, res) => {
  const status = req.query.status || 'applied';
  try {
    const result = await pool.query(
      `SELECT * FROM candidates 
       WHERE recruiter_id = $1 AND status = $2 
       ORDER BY created_at DESC`,
      [req.userId, status]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in filterCandidates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Create candidate
const createCandidate = async (req, res) => {
  try {
    const data = candidateSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO candidates 
       (recruiter_id, name, email, phone, position, skills, experience_years, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.userId,
        data.name,
        data.email,
        data.phone || null,
        data.position,
        data.skills,
        data.experience_years || null,
        data.status || 'applied',
        data.notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Error creating candidate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Update candidate
const updateCandidate = async (req, res) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const data = candidateSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE candidates SET
        name = $1,
        email = $2,
        phone = $3,
        position = $4,
        skills = $5,
        experience_years = $6,
        status = $7,
        notes = $8,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND recruiter_id = $10
       RETURNING *`,
      [
        data.name,
        data.email,
        data.phone || null,
        data.position,
        data.skills,
        data.experience_years || null,
        data.status,
        data.notes || null,
        id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Error updating candidate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Delete candidate
const deleteCandidate = async (req, res) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);

    const result = await pool.query(
      `DELETE FROM candidates WHERE id = $1 AND recruiter_id = $2 RETURNING *`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error('Error deleting candidate:', err);
    res.status(500).json({ message: 'Server error' });
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

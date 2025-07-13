const pool = require('../db');
const { z } = require('zod');
const CustomError = require('../utils/customError');

// Note: Zod schema validation will be handled by a middleware (e.g., validate.js)
// before these controller functions are executed.
// const { candidateSchema, updateCandidateSchema } = require('../../shared/schemas/candidateSchema');

/**
 * @desc Get all candidates for the authenticated recruiter
 * @route GET /api/candidates
 * @access Private
 */
const getCandidates = async (req, res, next) => {
    try {
        // These are parsed and validated by Zod in the middleware if used,
        // or handled gracefully if missing.
        const limit = z.coerce.number().int().positive().max(100).default(100).parse(req.query.limit);
        const offset = z.coerce.number().int().min(0).default(0).parse(req.query.offset);

        const result = await pool.query(
            'SELECT * FROM candidates WHERE recruiter_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [req.userId, limit, offset]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Search candidates by name, position, or skills
 * @route GET /api/candidates/search?q=term
 * @access Private
 */
const searchCandidates = async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            // If no search query, return all candidates or an empty array as per logic.
            // Returning an empty array is often better for explicit search.
            return res.status(200).json([]);
        }

        // Fuzzy search using ILIKE and wildcards
        const result = await pool.query(
            `SELECT * FROM candidates
             WHERE recruiter_id = $1 AND (
               LOWER(name) ILIKE '%' || LOWER($2) || '%' OR
               LOWER(position) ILIKE '%' || LOWER($2) || '%' OR
               LOWER(skills) ILIKE '%' || LOWER($2) || '%'
             )
             ORDER BY created_at DESC`,
            [req.userId, q]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Filter candidates by application status
 * @route GET /api/candidates/filter?status=applied
 * @access Private
 */
const filterCandidates = async (req, res, next) => {
    try {
        const statusRaw = req.query.status;

        let queryText = `SELECT * FROM candidates WHERE recruiter_id = $1`;
        const params = [req.userId];

        if (statusRaw) {
            // Define allowed statuses as per the task brief
            const allowedStatuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
            if (!allowedStatuses.includes(statusRaw)) {
                return next(new CustomError('Invalid status filter provided. Allowed statuses are: ' + allowedStatuses.join(', '), 400));
            }
            queryText += ` AND status = $2`;
            params.push(statusRaw);
        }

        queryText += ` ORDER BY created_at DESC`;

        const result = await pool.query(queryText, params);

        res.status(200).json(result.rows);
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Create a new candidate
 * @route POST /api/candidates
 * @access Private
 */
const createCandidate = async (req, res, next) => {
    try {
        // req.body is assumed to be validated by Zod middleware
        const { name, email, phone, position, skills, years_of_experience, status, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO candidates
               (recruiter_id, name, email, phone, position, skills, years_of_experience, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                req.userId,
                name, // name is already trimmed by Zod .trim() and validated
                email, // email is already trimmed by Zod .trim() and validated
                phone, // phone is already trimmed by Zod .trim() and validated
                position, // position is already trimmed by Zod .trim() and validated
                skills, // skills is already trimmed by Zod .trim() and validated
                years_of_experience, // years_of_experience is already coerced to number by Zod
                status, // status is already validated by Zod
                notes || null, // notes can be optional, Zod should handle its type
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Update an existing candidate
 * @route PUT /api/candidates/:id
 * @access Private
 */
const updateCandidate = async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id); // Validate param ID
        // req.body is assumed to be validated by Zod middleware
        const { name, email, phone, position, skills, years_of_experience, status, notes } = req.body;

        const result = await pool.query(
            `UPDATE candidates SET
                name = $1,
                email = $2,
                phone = $3,
                position = $4,
                skills = $5,
                years_of_experience = $6,
                status = $7,
                notes = $8,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND recruiter_id = $10
             RETURNING *`,
            [
                name,
                email,
                phone,
                position,
                skills,
                years_of_experience,
                status,
                notes || null,
                id,
                req.userId,
            ]
        );

        if (result.rows.length === 0) {
            return next(new CustomError('Candidate not found or unauthorized to update.', 404));
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Delete a candidate
 * @route DELETE /api/candidates/:id
 * @access Private
 */
const deleteCandidate = async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id); // Validate param ID

        const result = await pool.query(
            `DELETE FROM candidates WHERE id = $1 AND recruiter_id = $2 RETURNING *`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return next(new CustomError('Candidate not found or unauthorized to delete.', 404));
        }

        res.status(200).json({ message: 'Candidate deleted successfully.' });
    } catch (err) {
        next(err); // Pass error to global error handler
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
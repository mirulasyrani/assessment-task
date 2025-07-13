const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

// Note: Zod schema validation will be handled by a middleware (e.g., validate.js)
// before these controller functions are executed.
// const { registerSchema, loginSchema } = require('../../shared/schemas/authSchema');

/**
 * @desc Register a new recruiter
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, company } = req.body;

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedCompany = company.trim();

        const userExists = await pool.query(
            'SELECT 1 FROM recruiters WHERE email = $1',
            [trimmedEmail]
        );

        if (userExists.rows.length > 0) {
            return next(new CustomError('User with that email already exists.', 409)); // 409 Conflict for existing resource
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newRecruiter = await pool.query(
            `INSERT INTO recruiters (name, email, password_hash, company)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, company, created_at`,
            [trimmedName, trimmedEmail, hashedPassword, trimmedCompany]
        );

        const token = jwt.sign({ userId: newRecruiter.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        })
            .status(201)
            .json({
                user: {
                    id: newRecruiter.rows[0].id,
                    name: newRecruiter.rows[0].name,
                    email: newRecruiter.rows[0].email,
                    company: newRecruiter.rows[0].company,
                },
                message: 'Registration successful.',
            });
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Authenticate a recruiter & get token
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const trimmedEmail = email.trim();

        const recruiter = await pool.query('SELECT * FROM recruiters WHERE email = $1', [trimmedEmail]);

        if (!recruiter.rows.length) {
            return next(new CustomError('Invalid credentials.', 401)); // 401 Unauthorized for login failure
        }

        const match = await bcrypt.compare(password, recruiter.rows[0].password_hash);
        if (!match) {
            return next(new CustomError('Invalid credentials.', 401));
        }

        const token = jwt.sign({ userId: recruiter.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
            .status(200)
            .json({
                user: {
                    id: recruiter.rows[0].id,
                    name: recruiter.rows[0].name,
                    email: recruiter.rows[0].email,
                    company: recruiter.rows[0].company,
                },
                message: 'Login successful.',
            });
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Get current authenticated recruiter's data
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
    try {
        // req.userId is set by the authMiddleware
        if (!req.userId) {
            return next(new CustomError('Unauthorized: User ID not found.', 401));
        }

        const recruiter = await pool.query(
            'SELECT id, name, email, company, created_at FROM recruiters WHERE id = $1',
            [req.userId]
        );

        if (!recruiter.rows.length) {
            return next(new CustomError('User not found.', 404));
        }

        res.status(200).json(recruiter.rows[0]);
    } catch (err) {
        next(err); // Pass error to global error handler
    }
};

/**
 * @desc Log out recruiter by clearing cookie
 * @route POST /api/auth/logout
 * @access Public (but typically used after authentication)
 */
const logout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    })
        .status(200)
        .json({ message: 'Logged out successfully.' });
};

module.exports = {
    register,
    login,
    getMe,
    logout,
};
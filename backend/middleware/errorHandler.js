const { ZodError } = require('zod');
const CustomError = require('../utils/customError');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    console.error(`Error in ${req.method} ${req.originalUrl} by user ${req.userId || 'N/A'}:`, err);

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed. Please check your input.',
            errors: err.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            })),
        });
    }

    // PostgreSQL unique constraint (e.g., duplicate email)
    if (err.code === '23505') {
        let message = 'Duplicate entry. Record already exists.';
        if (err.detail?.includes('email')) {
            message = 'A user with this email already exists.';
        } else if (err.constraint) {
            message = `Duplicate entry for ${err.constraint.replace(/_key$/, '').replace(/_/g, ' ')}.`;
        }
        return res.status(409).json({ success: false, message });
    }

    // PostgreSQL foreign key constraint
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: 'Invalid reference. Related record not found.',
        });
    }

    // Custom errors
    if (err instanceof CustomError) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || 'An unexpected error occurred.',
        });
    }

    // Unhandled errors
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error.',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = errorHandler;

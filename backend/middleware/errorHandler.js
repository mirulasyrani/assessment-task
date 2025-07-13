const { ZodError } = require('zod');
const CustomError = require('../utils/customError');

/**
 * @desc Global error handling middleware.
 * Catches errors from routes and other middleware, formats them, and sends a standardized response.
 * @param {Error} err - The error object.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
    // If headers have already been sent, delegate to the default Express error handler
    // This prevents trying to send a response when one has already started
    if (res.headersSent) {
        return next(err);
    }

    // Log the error for debugging purposes (in development/staging environments)
    // Avoid logging sensitive information in production
    console.error(`Error processing request for ${req.method} ${req.originalUrl} by user ${req.userId || 'N/A'}:`, err);

    // Zod validation error: Return all validation errors in a structured format
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed. Please check your input.',
            errors: err.issues.map(issue => ({
                field: issue.path.join('.'), // Path to the field that caused the error (e.g., 'body.email')
                message: issue.message,     // Zod's error message
                code: issue.code            // Zod's error code (e.g., 'invalid_string', 'too_small')
            })),
        });
    }

    // PostgreSQL specific errors
    // Error Code: 23505 - Unique violation (e.g., trying to register with an existing email)
    if (err.code === '23505') {
        // You might want to parse err.detail or err.constraint for more specific messages
        let detailMessage = 'Duplicate entry. Record already exists.';
        if (err.detail && err.detail.includes('email')) {
             detailMessage = 'A user with this email already exists.';
        } else if (err.constraint) {
            detailMessage = `Duplicate entry for ${err.constraint.replace(/_key$/, '').replace(/_/g, ' ')}.`;
        }
        return res.status(409).json({ // 409 Conflict is more appropriate for duplicate entries
            status: 'fail',
            message: detailMessage,
        });
    }

    // Error Code: 23503 - Foreign key violation (e.g., trying to assign candidate to non-existent recruiter_id)
    if (err.code === '23503') {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid reference. Related record not found.',
        });
    }

    // Custom application-specific errors (e.g., CustomError from authController)
    if (err instanceof CustomError) {
        return res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message || 'An unexpected error occurred.',
        });
    }

    // Catch-all for unhandled/unknown errors (e.g., operational errors not explicitly caught)
    // In production, avoid exposing stack traces for security reasons
    return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error.',
        // Only include stack trace in non-production environments
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
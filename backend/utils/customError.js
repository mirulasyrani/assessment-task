/**
 * Custom error class for application-specific errors with HTTP status codes.
 */
class CustomError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.name = 'CustomError';
        this.statusCode = statusCode;
        if (code) this.code = code;

        // Captures stack trace for better debugging, excluding the constructor call itself.
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CustomError;
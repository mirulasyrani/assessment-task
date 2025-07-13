const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

/**
 * @desc Middleware to protect routes, ensuring only authenticated users can access them.
 * Extracts JWT from HTTP-only cookie, verifies it, and attaches userId to req.
 */
const authMiddleware = (req, res, next) => {
    // Check for token in httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
        // No token provided, user is unauthorized
        return next(new CustomError('Authentication required: No token provided.', 401));
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach the userId from the token payload to the request object
        req.userId = decoded.userId;
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        // Handle specific JWT errors for clearer client feedback
        if (err.name === 'JsonWebTokenError') {
            return next(new CustomError('Authentication failed: Invalid token.', 401));
        }
        if (err.name === 'TokenExpiredError') {
            // Clear the expired cookie to ensure client doesn't keep an invalid token
            // Ensure cookie settings here match those used when setting the cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            return next(new CustomError('Authentication required: Token expired. Please log in again.', 401));
        }
        // Catch any other unexpected errors during token verification
        return next(new CustomError('Authentication failed: An unexpected error occurred during token verification.', 401));
    }
};

module.exports = authMiddleware;
const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return next(new CustomError('Authentication required: No token provided.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        return next();
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('JWT verification failed:', err);
        }

        if (err.name === 'JsonWebTokenError') {
            return next(new CustomError('Authentication failed: Invalid token.', 401));
        }

        if (err.name === 'TokenExpiredError') {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            return next(new CustomError('Authentication required: Token expired. Please log in again.', 401));
        }

        return next(new CustomError('Authentication failed: An unexpected error occurred during token verification.', 401));
    }
};

module.exports = authMiddleware;

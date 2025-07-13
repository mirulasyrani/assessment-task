// backend/middleware/validate.js
const { ZodError } = require('zod');

/**
 * Middleware to validate request body, query, or params using a Zod schema.
 * Supports async schema refinements. Parsed data replaces `req[target]`.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} target - Which part of the request to validate (default: 'body').
 * @returns {Function} Express middleware function.
 */
const validate = (schema, target = 'body') => async (req, res, next) => {
  try {
    const validatedData = await schema.parseAsync(req[target]);
    req[target] = validatedData;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Return validation errors as a proper JSON response
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Any other error, pass to global error handler
    next(err);
  }
};

module.exports = validate;

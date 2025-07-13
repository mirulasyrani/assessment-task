// backend\middleware\validate.js
const { ZodError } = require('zod');

/**
 * Middleware to validate request body, query, or params using a Zod schema.
 * If validation fails, a ZodError is passed to the global error handling middleware.
 * If validation succeeds, the validated data replaces the original `req[target]`.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} target - Which part of the request object to validate (default: 'body').
 * @returns {Function} Express middleware function.
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  try {
    const validatedData = schema.parse(req[target]);
    req[target] = validatedData;
    next();
  } catch (err) {
    // Add validation context for better error tracking
    if (err instanceof ZodError) {
      err.validationTarget = target;
    }
    next(err);
  }
};

module.exports = validate;
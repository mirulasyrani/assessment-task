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
      err.validationTarget = target;

      // Optional: Add development-only logging
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Zod validation error on ${target}:`, err.issues);
      }
    }
    next(err);
  }
};

module.exports = validate;

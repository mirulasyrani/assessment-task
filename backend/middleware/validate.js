const { ZodError } = require('zod');

/**
 * Middleware to validate req.body, req.query, req.params, or req.headers using a Zod schema.
 * On success, replaces the original input with the parsed data.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params' | 'headers'} [target='body'] - The target property to validate.
 * @returns {Function} Express middleware function.
 */
const validate = (schema, target = 'body') => async (req, res, next) => {
  try {
    const validated = await schema.parseAsync(req[target]);
    req[target] = validated;
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      const route = `${req.method} ${req.originalUrl}`;
      const ip = req.headers['x-forwarded-for'] || req.ip;
      console.warn(`❌ Zod validation error (${target}) on ${route} from ${ip}:`, err.issues);

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed.',
        errors: err.issues.map(issue => ({
          field: issue.path?.join('.') || 'unknown',
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    // Pass other unexpected errors to the global error handler
    return next(err);
  }
};

module.exports = validate;

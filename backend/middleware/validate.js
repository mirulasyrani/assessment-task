const { ZodError } = require('zod');

/**
 * @desc Middleware to validate req.body, req.query, req.params, or req.headers using a Zod schema.
 * If validation passes, replaces original input with parsed data.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate.
 * @param {'body' | 'query' | 'params' | 'headers'} target - Target location to validate (default: 'body').
 * @returns {Function} Express middleware.
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

    return next(err); // Unhandled non-Zod errors go to global handler
  }
};

module.exports = validate;

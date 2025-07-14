const { ZodError } = require('zod');

/**
 * @desc Middleware to validate req.body, req.query, or req.params using a Zod schema.
 * If validation passes, replaces original input with parsed data.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate.
 * @param {'body' | 'query' | 'params'} target - Target location to validate (default: 'body').
 * @returns {Function} Express middleware.
 */
const validate = (schema, target = 'body') => async (req, res, next) => {
  try {
    const validatedData = await schema.parseAsync(req[target]);
    req[target] = validatedData;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      console.warn(`❌ Zod validation failed for ${target}:`, err.issues);

      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: err.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Let global error handler deal with unexpected errors
    next(err);
  }
};

module.exports = validate;

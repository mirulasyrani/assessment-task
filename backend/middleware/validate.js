const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // overwrite with validated data
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      console.error('🛑 Zod validation failed:', JSON.stringify(err.errors, null, 2));
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: err.errors // <-- return full array for frontend
      });
    }

    console.error('🔥 Unexpected validation error:', err);
    return res.status(500).json({ message: 'Validation error' });
  }
};

module.exports = validate;

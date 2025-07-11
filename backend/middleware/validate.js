const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // overwrite with validated data
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    return res.status(500).json({ message: 'Validation error' });
  }
};

module.exports = validate;

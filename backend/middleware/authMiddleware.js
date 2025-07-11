const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('authHeader:', authHeader);

  const token = authHeader && authHeader.split(' ')[1];
  console.log('token:', token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('decoded:', decoded);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.log('JWT verify error:', err.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

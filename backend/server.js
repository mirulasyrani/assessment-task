const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');

const app = express();

// Log startup
console.log('🟢 Starting server setup...');

// Trust proxy (for rate limiting, etc.)
app.set('trust proxy', 1);

// ✅ Setup CORS
const allowedOrigins = ['https://assessment-task-five.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// ✅ Preflight request handler
app.options('*', cors({
  origin: 'https://assessment-task-five.vercel.app',
  credentials: true,
}));

// Body parser
app.use(express.json());

// ✅ Mount routes with error logging
try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Mounted /api/auth');
} catch (err) {
  console.error('❌ Failed to mount /api/auth:', err.stack || err);
}

try {
  app.use('/api/candidates', candidateRoutes);
  console.log('✅ Mounted /api/candidates');
} catch (err) {
  console.error('❌ Failed to mount /api/candidates:', err.stack || err);
}

// ✅ Global error handler (optional, for other uncaught errors)
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled server error:', err.stack || err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

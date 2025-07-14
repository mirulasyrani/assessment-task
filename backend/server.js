const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');

const app = express();

// ✅ Trust proxy so that secure cookies work correctly on Render/Vercel
app.set('trust proxy', 1);

// ✅ Define allowed frontend URLs
const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ''),
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

console.log('✅ Allowed CORS origins:', allowedOrigins);

// ✅ CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS origin attempt:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`⛔ Blocked by CORS: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true, // ✅ Allow credentials (cookies)
};

// ✅ Apply CORS globally BEFORE all routes/middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Request Logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  console.log('🍪 Cookies:', req.cookies || {});
  next();
});

// ✅ Healthcheck route
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working properly!' });
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// ✅ Frontend error logger
app.post('/api/logs/frontend-error', (req, res) => {
  const {
    context,
    message,
    url,
    method,
    response_status,
    response_data,
    timestamp,
    stack,
  } = req.body || {};

  if (!context || !message) {
    console.warn('⚠️ Invalid frontend error log:', req.body);
    return res.status(400).json({ message: 'Invalid log payload.' });
  }

  console.error('🛑 Frontend error log:', {
    context,
    message,
    url,
    method,
    response_status,
    response_data,
    timestamp,
    stack,
  });

  res.status(200).json({ message: 'Logged successfully' });
});

// ✅ 404 handler
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(`❌ Error on ${req.method} ${req.originalUrl}:`, err.message);
  errorHandler(err, req, res, next);
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

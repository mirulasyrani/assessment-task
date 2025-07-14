const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates'); // Optional

const app = express();
app.set('trust proxy', 1); // ✅ Secure cookies behind proxy

// ✅ Dynamically get allowed origins from env + hardcoded ones
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : null;
const allowedOrigins = [
  clientUrl,
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000',
].filter(Boolean); // remove any null or undefined

// ✅ CORS config with credentials and dynamic origin
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ Blocked by CORS: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

// ✅ Apply CORS middleware for all requests
app.use(cors(corsOptions));

// ✅ Preflight requests handled with same CORS config
app.options('*', cors(corsOptions));

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Request logging for debugging
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  console.log('🍪 Cookies:', req.cookies || {});
  next();
});

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// ✅ Frontend error logging endpoint
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

// ✅ Global error handler middleware
app.use((err, req, res, next) => {
  console.error(`❌ Error on ${req.method} ${req.originalUrl}:`, err);
  errorHandler(err, req, res, next);
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

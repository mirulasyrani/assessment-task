const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates'); // Optional

const app = express();
app.set('trust proxy', 1); // Required for secure cookies on Render/Vercel

// ✅ Get allowed frontend origins (env + fallbacks)
const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, ''); // strip trailing slash
const allowedOrigins = [
  clientUrl,
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

console.log('✅ Allowed CORS origins:', allowedOrigins);

// ✅ CORS middleware config
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS origin attempt:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ Blocked by CORS: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

// ✅ Apply CORS to all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight requests

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  console.log('🍪 Cookies:', req.cookies || {});
  next();
});

// ✅ CORS test route (optional)
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working properly!' });
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// ✅ Frontend error logger route
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

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(`❌ Error on ${req.method} ${req.originalUrl}:`, err);
  errorHandler(err, req, res, next);
});

// ✅ Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

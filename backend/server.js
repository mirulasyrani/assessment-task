const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates'); // Optional if needed

const app = express();
app.set('trust proxy', 1); // ✅ Trust proxy for secure cookies behind proxies

// ✅ Allowed Origins
const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000',
];

// ✅ CORS config for cookie-based auth
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ Blocked by CORS: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true, // 🔑 Required for sending cookies cross-origin
}));

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Request logging with cookies
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  console.log('🍪 Incoming cookies:', req.cookies || {});
  next();
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes); // Optional if you need candidate routes

// ✅ Frontend error logger route (optional)
app.post('/api/logs/frontend-error', (req, res) => {
  console.error('🛑 Frontend error log:', req.body);
  res.status(200).json({ message: 'Logged' });
});

// ✅ 404 handler for unmatched routes
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
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

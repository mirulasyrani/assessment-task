const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates'); // Optional if you use it

const app = express();
app.set('trust proxy', 1); // ✅ Required for cookies behind proxies like Vercel/Render

const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000',
];

// ✅ CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Debug incoming cookies
app.use((req, res, next) => {
  console.log('🍪 Incoming cookies:', req.cookies || {});
  next();
});

// ✅ Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes); // If applicable

// ✅ Log frontend error route
app.post('/api/logs/frontend-error', (req, res) => {
  console.error('Frontend error log:', req.body);
  res.json({ message: 'Logged' });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ✅ Global error handler
app.use(errorHandler);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`)
);

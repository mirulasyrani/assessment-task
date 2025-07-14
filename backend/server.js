const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');

const app = express();
app.set('trust proxy', 1); // For secure cookies behind proxy (Render/Vercel)

// ✅ Set CORS config
const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000'
];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow curl/postman
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Preflight for complex requests


app.use(express.json());
app.use(cookieParser());

// ✅ Logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  console.log('🍪 Cookies:', req.cookies);
  next();
});

// ✅ Healthcheck
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working properly!' });
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// ✅ Error Logging
app.post('/api/logs/frontend-error', (req, res) => {
  const {
    context, message, url, method,
    response_status, response_data,
    timestamp, stack,
  } = req.body || {};

  if (!context || !message) {
    return res.status(400).json({ message: 'Invalid log payload.' });
  }

  console.error('🛑 Frontend error:', {
    context, message, url, method,
    response_status, response_data,
    timestamp, stack,
  });

  res.status(200).json({ message: 'Logged successfully' });
});

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `API not found: ${req.method} ${req.originalUrl}` });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(`❌ Error:`, err.message);
  errorHandler(err, req, res, next);
});

// ✅ Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'dev'})`);
});

// backend/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const app = express();

console.log('🟢 Starting server setup...');
app.set('trust proxy', 1);

const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'https://assessment-task-1.onrender.com',
  'http://localhost:3000',
];

// Main CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error(`Not allowed by CORS policy for origin: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Fix pre-flight (OPTIONS) request handling using same origin check
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS pre-flight blocked for origin: ${origin}`);
      callback(new Error(`Not allowed by CORS policy for origin: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json());
app.use(cookieParser());

app.post('/api/logs/frontend-error', (req, res) => {
  const errorData = req.body;
  console.error('\n--- FRONTEND ERROR REPORT ---');
  console.error('Context:', errorData.context || 'N/A');
  console.error('Message:', errorData.message || 'No message provided');
  console.error('URL:', errorData.url || 'N/A');
  console.error('Method:', errorData.method || 'N/A');
  console.error('Timestamp:', errorData.timestamp || new Date().toISOString());
  if (errorData.response_status) {
    console.error('Backend Response Status:', errorData.response_status);
  }
  if (errorData.response_data) {
    console.error('Backend Response Data:', JSON.stringify(errorData.response_data, null, 2));
  }
  if (errorData.stack) {
    console.error('Stack Trace:');
    console.error(errorData.stack);
  }
  console.error('-----------------------------\n');
  res.status(200).json({ message: 'Frontend error log received by backend.' });
});

const logRoutes = (basePath, router) => {
  try {
    router.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase()).join(', ');
        console.log(`🔍 Route: ${methods.padEnd(8)} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach((nestedLayer) => {
          if (nestedLayer.route) {
            const methods = Object.keys(nestedLayer.route.methods).map(method => method.toUpperCase()).join(', ');
            const nestedPath = nestedLayer.route.path === '/' ? '' : nestedLayer.route.path;
            console.log(`🔍 Route: ${methods.padEnd(8)} ${basePath}${nestedPath}`);
          }
        });
      }
    });
  } catch (err) {
    console.error(`⚠️ Failed to log routes for ${basePath}:`, err.message);
  }
};

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  logRoutes('/api/auth', authRoutes);
  console.log('✅ Mounted /api/auth routes.');
} catch (err) {
  console.error('❌ Failed to mount /api/auth routes:', err.stack || err);
}

try {
  const candidateRoutes = require('./routes/candidates');
  app.use('/api/candidates', candidateRoutes);
  logRoutes('/api/candidates', candidateRoutes);
  console.log('✅ Mounted /api/candidates routes.');
} catch (err) {
  console.error('❌ Failed to mount /api/candidates routes:', err.stack || err);
}

app.use((req, res, next) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`Access backend at: http://localhost:${PORT}`);
});

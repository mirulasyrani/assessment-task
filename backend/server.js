const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Log startup
console.log('🟢 Starting server setup...');

// Trust proxy (for rate limiting, etc.)
app.set('trust proxy', 1);

// ✅ Setup CORS
const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app'
];

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
app.options('/*', cors({
  origin: 'https://assessment-task-five.vercel.app',
  credentials: true,
}));

// Body parser
app.use(express.json());

// 🔍 Helper to log route paths
const logRoutes = (basePath, router) => {
  try {
    router.stack?.forEach((layer) => {
      if (layer.route?.path) {
        console.log(`🔍 Route added: ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        layer.handle.stack.forEach((nestedLayer) => {
          if (nestedLayer.route?.path) {
            console.log(`🔍 Route added: ${basePath}${nestedLayer.route.path}`);
          }
        });
      }
    });
  } catch (err) {
    console.error(`⚠️ Failed to log routes for ${basePath}`, err);
  }
};

// ✅ Mount /api/auth
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  logRoutes('/api/auth', authRoutes); // 🔍 Log each route
  console.log('✅ Mounted /api/auth');
} catch (err) {
  console.error('❌ Failed to mount /api/auth:', err.stack || err);
}

// ✅ Mount /api/candidates
try {
  const candidateRoutes = require('./routes/candidates');
  app.use('/api/candidates', candidateRoutes);
  logRoutes('/api/candidates', candidateRoutes); // 🔍 Log each route
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

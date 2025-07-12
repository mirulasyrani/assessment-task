const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Log startup
console.log('🟢 Starting server setup...');

// Trust proxy (for rate limiting, etc.)
app.set('trust proxy', 1);

// ✅ Setup CORS
// IMPORTANT: Add the Render URL where your frontend is deployed.
// Render dynamically assigns URLs like https://your-app-name-xxxx.onrender.com
// You MUST replace 'https://assessment-task-1.onrender.com' with your actual frontend's Render URL.
const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'https://assessment-task-1.onrender.com', // <--- REPLACE THIS with your ACTUAL FRONTEND RENDER URL
  'http://localhost:3000', // For local frontend development
  'http://localhost:5173', // Common for Vite/React dev server
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    // and requests from allowed origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('CORS not allowed by server policy'));
    }
  },
  credentials: true,
}));

// ✅ Preflight request handler
// It's crucial for complex HTTP methods (like PUT, DELETE) and custom headers.
// Ensure this also allows all your 'allowedOrigins'.
app.options('/*', cors({
  origin: allowedOrigins, // Use the full list of allowed origins for preflight
  credentials: true,
}));

// Body parser - ESSENTIAL for parsing JSON request bodies (like the one from frontend error logs)
app.use(express.json());

// --- FIX: NEW Frontend Error Logging Endpoint ---
// This endpoint receives error reports from your client-side (Dashboard.js)
// and logs them to your backend's stdout, which Render captures.
// Placement here is good: after body parser, before other specific routes or global error handlers.
app.post('/api/logs/frontend-error', (req, res) => {
    const errorData = req.body;
    console.error('--- FRONTEND ERROR REPORT ---');
    console.error('Context:', errorData.context);
    console.error('Message:', errorData.message);
    console.error('URL:', errorData.url);
    console.error('Method:', errorData.method);
    console.error('Timestamp:', errorData.timestamp);
    if (errorData.response_status) {
        console.error('Backend Response Status (from failed API call):', errorData.response_status);
    }
    if (errorData.response_data) {
        // Stringify complex objects for better readability in logs
        console.error('Backend Response Data (from failed API call):', JSON.stringify(errorData.response_data, null, 2));
    }
    if (errorData.stack) {
        console.error('Stack Trace (from frontend error):');
        console.error(errorData.stack);
    }
    console.error('-----------------------------');
    res.status(200).json({ message: 'Error log received by backend' });
});
// ---------------------------------------------

// 🔍 Helper to log route paths
const logRoutes = (basePath, router) => {
  try {
    router.stack?.forEach((layer) => {
      if (layer.route?.path) {
        console.log(`🔍 Route added: ${basePath}${layer.route.path} (${Object.keys(layer.route.methods).join(', ').toUpperCase()})`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        // Handle nested routers (e.g., if authRoutes or candidateRoutes are Express.Router instances)
        layer.handle.stack.forEach((nestedLayer) => {
          if (nestedLayer.route?.path) {
            console.log(`🔍 Nested Route added: ${basePath}${layer.regexp.source.replace(/\\|\^|\$/g, '')}${nestedLayer.route.path} (${Object.keys(nestedLayer.route.methods).join(', ').toUpperCase()})`);
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

// ✅ Global error handler
// This catches any unhandled errors that occur in your routes or middleware
// and ensures a generic 500 response is sent.
// This should be the LAST middleware/route defined.
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled server error caught by global handler:', err.stack || err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
// Use process.env.PORT provided by Render, or default to 5000 for local development.
// Render typically provides PORT=10000 for web services.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Using PORT: ${PORT} (from process.env.PORT: ${process.env.PORT || 'not set'})`); // Added for clarity in logs
});
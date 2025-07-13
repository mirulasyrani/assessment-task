// backend\server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Load environment variables from .env file

// Import global error handler middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

console.log('🟢 Starting server setup...');

// Enable trust proxy for correct IP detection behind proxies (e.g., Vercel, Render)
// This is crucial for rate limiting to work accurately based on client IP.
app.set('trust proxy', 1);

// Define allowed origins for CORS (Cross-Origin Resource Sharing)
// This list should be updated with your actual frontend deployment URLs.
const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  // IMPORTANT: Replace this with your actual deployed frontend URL on Render/Railway
  'https://your-frontend-render-url.onrender.com', // Example: 'https://my-recruitment-tracker-frontend.onrender.com'
  'http://localhost:3000', // For local development
];

// Configure CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    // or from origins present in the allowedOrigins list.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy.')); // Block the request
    }
  },
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Handle pre-flight requests for all routes (important for complex CORS scenarios)
app.options('/*', cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Built-in middleware to parse incoming JSON payloads
app.use(express.json());

// Middleware to parse cookies attached to the client request object
app.use(cookieParser());

/**
 * Endpoint for frontend error logging.
 * Frontend applications can send error details to this endpoint for server-side logging.
 */
app.post('/api/logs/frontend-error', (req, res) => {
  const errorData = req.body;
  console.error('\n--- FRONTEND ERROR REPORT ---');
  console.error('Context:', errorData.context || 'N/A');
  console.error('Message:', errorData.message || 'No message provided');
  console.error('URL:', errorData.url || 'N/A');
  console.error('Method:', errorData.method || 'N/A');
  console.error('Timestamp:', errorData.timestamp || new Date().toISOString());
  if (errorData.response_status) {
    console.error('Backend Response Status (from failed API call):', errorData.response_status);
  }
  if (errorData.response_data) {
    console.error('Backend Response Data (from failed API call):', JSON.stringify(errorData.response_data, null, 2));
  }
  if (errorData.stack) {
    console.error('Stack Trace (from frontend error):');
    console.error(errorData.stack);
  }
  console.error('-----------------------------\n');
  res.status(200).json({ message: 'Frontend error log received by backend.' });
});

/**
 * Helper function to log mounted routes for debugging purposes.
 * @param {string} basePath - The base path for the router.
 * @param {express.Router} router - The Express router instance.
 */
const logRoutes = (basePath, router) => {
  try {
    router.stack.forEach((layer) => {
      if (layer.route) { // Routes registered directly on the router
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`🔍 Route: ${methods} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) { // Nested routers
        layer.handle.stack.forEach((nestedLayer) => {
          if (nestedLayer.route) {
            const methods = Object.keys(nestedLayer.route.methods).join(', ').toUpperCase();
            // This regexp logic needs to be robust for nested routers
            const nestedPath = nestedLayer.route.path === '/' ? '' : nestedLayer.route.path;
            console.log(`🔍 Route: ${methods} ${basePath}${nestedPath}`);
          }
        });
      }
    });
  } catch (err) {
    console.error(`⚠️ Failed to log routes for ${basePath}:`, err.message);
  }
};

// Mount API routes
try {
  // Corrected path: require('./routes/auth.js')
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  logRoutes('/api/auth', authRoutes);
  console.log('✅ Mounted /api/auth routes.');
} catch (err) {
  console.error('❌ Failed to mount /api/auth routes:', err.stack || err);
}

try {
  // Corrected path: require('./routes/candidates.js')
  const candidateRoutes = require('./routes/candidates');
  app.use('/api/candidates', candidateRoutes);
  logRoutes('/api/candidates', candidateRoutes);
  console.log('✅ Mounted /api/candidates routes.');
} catch (err) {
  console.error('❌ Failed to mount /api/candidates routes:', err.stack || err);
}

// Global error handling middleware (must be the last middleware added)
app.use(errorHandler);

// Set the port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`Access backend at: http://localhost:${PORT}`);
});
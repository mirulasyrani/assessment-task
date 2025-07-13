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
// This should be set if your app is behind a proxy (like Render's load balancer).
app.set('trust proxy', 1);

// Define allowed origins for CORS (Cross-Origin Resource Sharing)
// This list should be updated with your actual frontend deployment URLs.
const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'https://assessment-task-1.onrender.com', // Backend URL
  'http://localhost:3000', // For local development
];

// Configure CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests from the backend itself)
    // or from origins present in the allowedOrigins list.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error(`Not allowed by CORS policy for origin: ${origin}`)); // Provide more context in the error
    }
  },
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Explicitly list all allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Common headers. Add more if your frontend sends custom headers
}));

// Handle pre-flight requests for all routes (important for complex CORS scenarios)
// This app.options('*', cors(...)) line is generally redundant if cors() middleware is applied globally before routes
// and configured with methods and allowedHeaders. The cors middleware handles pre-flight OPTIONS requests automatically.
// However, it doesn't hurt to have it. Let's keep it but simplified.
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Ensure OPTIONS is here
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
        const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase()).join(', ');
        console.log(`🔍 Route: ${methods.padEnd(8)} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) { // Nested routers (e.g., from app.use('/somepath', someRouter))
        // This case handles a router instance being used as middleware, and then we inspect its stack
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


// Mount API routes
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


// --- 404 Handler (MUST be after all other routes and middleware) ---
app.use((req, res, next) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});


// Global error handling middleware (must be the last middleware added)
app.use(errorHandler);

// Set the port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`Access backend at: http://localhost:${PORT}`);
});
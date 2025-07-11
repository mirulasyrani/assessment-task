const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');

const app = express();

// Trust proxy (for rate limit or headers)
app.set('trust proxy', 1);

// ✅ Allow CORS for your Vercel frontend
const allowedOrigins = ['https://assessment-task-five.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors({
  origin: 'https://assessment-task-five.vercel.app',
  credentials: true,
}));

// Built-in body parser
app.use(express.json());

// Your routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

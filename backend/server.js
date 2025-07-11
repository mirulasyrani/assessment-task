const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');

const app = express();

// ✅ Fix CORS properly
app.use(cors({
  origin: 'https://assessment-task-five.vercel.app', // 🚫 remove trailing slash
  credentials: true, // optional: if you ever use cookies
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

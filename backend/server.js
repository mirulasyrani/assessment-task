// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'https://assessment-task-five.vercel.app/',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// ✅ Health check (optional)
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

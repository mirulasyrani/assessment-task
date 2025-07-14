const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);


const allowedOrigins = [
  'https://assessment-task-five.vercel.app',
  'https://assessment-task-git-main-mirulasyranis-projects.vercel.app',
  'http://localhost:3000',
];

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

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log('🍪 Incoming cookies:', req.cookies || {});
  next();
});

app.post('/api/logs/frontend-error', (req, res) => {
  console.error('Frontend error log:', req.body);
  res.json({ message: 'Logged' });
});

// mount auth and candidate routes...
// then:
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

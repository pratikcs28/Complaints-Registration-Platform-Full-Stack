import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // allow the frontend port
  credentials: true // allow cookies
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Keep the process alive just in case the event loop empties out prematurely
  setInterval(() => {}, 1000 * 60 * 60);
});

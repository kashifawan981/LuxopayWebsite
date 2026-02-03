import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payments.js';
import { authMiddleware } from './auth.js';
import { initializeDatabase } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'Unexpected server error' });
});

await initializeDatabase();

app.listen(port, () => {
  console.log(`Luxopay backend running on port ${port}`);
});

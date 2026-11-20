import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import doctorRoutes from './src/routes/doctorRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || 8000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set in .env and be at least 32 characters long.');
}

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Doctor login API is running.' });
});

app.use('/api/doctor', doctorRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Doctor login API running at http://localhost:${PORT}`);
});

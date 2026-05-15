require('dotenv').config();

const express = require('express');
const cors = require('cors');

const predictRoutes = require('./src/routes/predict');
const historyRoutes = require('./src/routes/history');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// ─── BUILT-IN MIDDLEWARE ──────────────────────────────────────────────────────
app.use(express.json());

// ─── REQUEST LOGGER ───────────────────────────────────────────────────────────
app.use(logger);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DiabeteCheck API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('─────────────────────────────────────────');
  console.log(`  DiabeteCheck Backend berjalan`);
  console.log(`  Local  : http://localhost:${PORT}`);
  console.log(`  Health : http://localhost:${PORT}/api/health`);
  console.log(`  Mode   : ${process.env.NODE_ENV || 'development'}`);
  console.log('─────────────────────────────────────────');
});
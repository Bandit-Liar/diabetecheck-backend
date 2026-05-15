/**
 * errorHandler.js
 * Global error handler Express — WAJIB dipasang paling bawah di server.js.
 * Menangkap semua error yang diteruskan via next(err).
 */

const errorHandler = (err, req, res, next) => {
  // Log detail error ke console untuk debugging
  console.error('─────────────────────────────────────────');
  console.error(`[ERROR] ${new Date().toISOString()}`);
  console.error(`Route  : ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${err.message}`);
  if (err.stack) console.error(`Stack  :\n${err.stack}`);
  console.error('─────────────────────────────────────────');

  // Tentukan HTTP status code
  const status = err.status || err.statusCode || 500;

  // Pesan error: di production jangan bocorkan detail internal
  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    status === 500 && isProduction
      ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
      : err.message || 'Terjadi kesalahan pada server';

  res.status(status).json({
    success: false,
    message,
    // Sertakan stack trace hanya di development
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
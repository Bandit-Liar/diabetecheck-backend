/**
 * history.js
 * Route handler untuk GET /api/history
 * Menyimpan riwayat prediksi secara in-memory (MVP).
 */

const express = require('express');
const router = express.Router();

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
let history = [];
let idCounter = 1;

/**
 * Tambahkan satu hasil prediksi ke history.
 * Dipanggil oleh predict.js setelah inferensi berhasil.
 * @param {object} result — hasil dari predictionService.predict()
 * @returns {object} record yang disimpan (lengkap dengan id)
 */
const addToHistory = (result) => {
  const record = {
    id: idCounter++,
    ...result,
  };
  history.push(record);
  return record;
};

/**
 * GET /api/history
 * Mengembalikan semua riwayat prediksi, terbaru di atas.
 */
router.get('/', (req, res) => {
  const sorted = [...history].reverse();
  res.status(200).json({
    success: true,
    total: history.length,
    data: sorted,
  });
});

/**
 * DELETE /api/history
 * Menghapus semua riwayat (opsional, berguna saat development/testing).
 */
router.delete('/', (req, res) => {
  history = [];
  idCounter = 1;
  res.status(200).json({
    success: true,
    message: 'Semua riwayat prediksi berhasil dihapus.',
  });
});

module.exports = router;
module.exports.addToHistory = addToHistory;
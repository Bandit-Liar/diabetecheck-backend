/**
 * history.js
 * Route handler untuk GET dan DELETE /api/history
 * Menyimpan riwayat prediksi secara in-memory (MVP).
 */

const express = require('express');
const router = express.Router();

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
let historyStore = [];
let idCounter = 1;

/**
 * addToHistory()
 * Dipanggil oleh predict.js setelah inferensi berhasil.
 * @param {object} result — hasil dari predictionService.predict()
 * @returns {object} record lengkap dengan id dan timestamp
 */
const addToHistory = (result) => {
  const record = {
    id: idCounter++,
    ...result,
    timestamp: new Date().toISOString(),
  };
  historyStore.push(record);
  return record;
};

/**
 * GET /api/history
 * Mengembalikan semua riwayat prediksi, terbaru di atas.
 */
router.get('/', (req, res) => {
  const sorted = [...historyStore].reverse();
  res.status(200).json({
    success: true,
    count: historyStore.length,
    data: sorted,
  });
});

/**
 * DELETE /api/history
 * Menghapus seluruh riwayat prediksi dari memory.
 */
router.delete('/', (req, res) => {
  historyStore = [];
  idCounter = 1;
  res.status(200).json({
    success: true,
    message: 'History cleared',
  });
});

module.exports = router;
module.exports.addToHistory = addToHistory;
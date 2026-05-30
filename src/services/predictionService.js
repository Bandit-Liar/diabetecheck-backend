/**
 * predictionService.js — v3
 * Express bertindak sebagai PROXY ke FastAPI Garrand.
 * Tidak ada lagi child_process / inference.py.
 * Semua komunikasi ke model AI dilakukan via Axios HTTP request.
 */

const axios = require('axios');

// ─── KONFIGURASI ──────────────────────────────────────────────────────────────
const TIMEOUT_MS = 30000; // 30 detik

/**
 * determineResult()
 * Mengkonversi response FastAPI ke format konsisten untuk frontend.
 *
 * Konversi prediction:
 *   predicted_label "Diabetik"       → prediction "Berisiko"
 *   predicted_label selain "Diabetik" → prediction "Tidak Berisiko"
 *
 * risk_level diteruskan langsung dari FastAPI (sudah Bahasa Indonesia).
 *
 * @param {object} inferenceData — response JSON dari FastAPI
 * @returns {{ prediction: string, probability: number, risk_level: string }}
 */
const determineResult = (inferenceData) => {
  const prediction =
    inferenceData.predicted_label === 'Diabetik' ? 'Berisiko' : 'Tidak Berisiko';

  const probability = inferenceData.probability_diabetic;
  const risk_level = inferenceData.risk_level;

  return { prediction, probability, risk_level };
};

/**
 * runInference()
 * Mengirim 17 field ke FastAPI Garrand via Axios POST.
 *
 * Format yang dikirim ke FastAPI (dibungkus otomatis):
 *   { "features": { ...17 field... }, "use_optimal_threshold": true }
 *
 * Header ngrok-skip-browser-warning wajib ada agar ngrok tidak
 * memblokir request dengan redirect ke halaman peringatan.
 *
 * @param {object} inputData — 17 field dari req.body (sudah divalidasi)
 * @returns {Promise<object>} response JSON dari FastAPI
 */
const runInference = async (inputData) => {
  const aiApiUrl = process.env.AI_API_URL;

  if (!aiApiUrl) {
    throw new Error(
      'AI_API_URL belum diatur di file .env. ' +
      'Minta URL ngrok terbaru dari Garrand dan isi di .env.'
    );
  }

  const payload = {
    features: inputData,
    use_optimal_threshold: true,
  };

  try {
    const response = await axios.post(`${aiApiUrl}/predict`, payload, {
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    return response.data;

  } catch (err) {
    // Koneksi ditolak atau host tidak ditemukan (FastAPI tidak aktif)
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error(
        'AI service tidak dapat diakses. Pastikan server model aktif.'
      );
    }

    // Request timeout
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new Error('AI service timeout. Coba beberapa saat lagi.');
    }

    // Response error dari FastAPI (4xx / 5xx)
    if (err.response) {
      const status = err.response.status;
      const detail =
        err.response.data?.detail ||
        err.response.data?.message ||
        'Tidak ada detail error';
      throw new Error(
        `FastAPI mengembalikan error ${status}: ${detail}`
      );
    }

    // Error tidak terduga lainnya
    throw new Error(err.message || 'Terjadi error tidak terduga saat inference');
  }
};

/**
 * predict()
 * Fungsi utama yang dipanggil oleh route handler.
 *
 * @param {object} inputData — 17 field dari req.body
 * @returns {Promise<{ prediction, probability, risk_level }>}
 */
const predict = async (inputData) => {
  const inferenceData = await runInference(inputData);
  return determineResult(inferenceData);
};

module.exports = { predict, runInference, determineResult };
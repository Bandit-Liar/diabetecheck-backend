/**
 * predictionService.js
 * Memanggil inference.py via child_process dan mengolah hasilnya.
 */

const { spawn } = require('child_process');
const path = require('path');

// ─── KONFIGURASI ──────────────────────────────────────────────────────────────
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const INFERENCE_SCRIPT = path.resolve(__dirname, '../../model/inference.py');

// ─── THRESHOLD RISIKO ─────────────────────────────────────────────────────────
const THRESHOLD = {
  LOW: 0.4,      // < 0.4  → Risiko Rendah
  MEDIUM: 0.7,   // 0.4–0.7 → Risiko Sedang
                 // > 0.7  → Risiko Tinggi
};

/**
 * Menentukan label hasil, warna, dan saran berdasarkan probability.
 * @param {number} probability — nilai 0.0–1.0 dari model
 * @returns {{ level: string, label: string, color: string, suggestion: string }}
 */
const determineResult = (probability) => {
  if (probability < THRESHOLD.LOW) {
    return {
      level: 'low',
      label: 'Risiko Rendah',
      color: 'green',
      suggestion:
        'Pertahankan gaya hidup sehat Anda. Tetap aktif berolahraga dan jaga pola makan bergizi.',
    };
  }

  if (probability < THRESHOLD.MEDIUM) {
    return {
      level: 'medium',
      label: 'Risiko Sedang',
      color: 'yellow',
      suggestion:
        'Disarankan untuk memeriksakan diri ke dokter dan mulai menerapkan pola hidup lebih sehat.',
    };
  }

  return {
    level: 'high',
    label: 'Risiko Tinggi',
    color: 'red',
    suggestion:
      'Segera konsultasikan kondisi Anda dengan dokter atau tenaga medis untuk pemeriksaan lebih lanjut.',
  };
};

/**
 * Menjalankan inference.py sebagai child process Python.
 * Input dikirim via stdin, output dibaca dari stdout.
 * @param {object} inputData — data yang sudah divalidasi dari req.validatedInput
 * @returns {Promise<object>} hasil prediksi lengkap
 */
const runInference = (inputData) => {
  return new Promise((resolve, reject) => {
    const process = spawn(PYTHON_PATH, [INFERENCE_SCRIPT]);

    let stdout = '';
    let stderr = '';

    // Kumpulkan output dari Python
    process.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    // Kirim input ke Python via stdin
    process.stdin.write(JSON.stringify(inputData));
    process.stdin.end();

    process.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Proses Python keluar dengan kode ${code}. stderr: ${stderr}`)
        );
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (!result.success) {
          return reject(new Error(result.error || 'Inference gagal'));
        }

        resolve(result);
      } catch {
        reject(new Error(`Gagal parse output Python: "${stdout}"`));
      }
    });

    process.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            `Python tidak ditemukan di path "${PYTHON_PATH}". ` +
            `Periksa PYTHON_PATH di file .env (coba "python" atau "python3").`
          )
        );
      } else {
        reject(err);
      }
    });
  });
};

/**
 * Fungsi utama yang dipanggil oleh route handler.
 * @param {object} inputData — data dari req.validatedInput
 * @returns {Promise<object>} hasil prediksi + risk assessment
 */
const predict = async (inputData) => {
  const inference = await runInference(inputData);

  const { probability } = inference;
  const riskResult = determineResult(probability);

  return {
    probability,
    percentage: `${(probability * 100).toFixed(1)}%`,
    ...riskResult,
    input: inputData,
    predictedAt: new Date().toISOString(),
  };
};

module.exports = { predict, determineResult };
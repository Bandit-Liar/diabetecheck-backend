/**
 * predictionService.js
 * Memanggil inference.py via child_process dan mengolah hasilnya.
 * Dataset: CDC Diabetes Health Indicators (21 fitur)
 */

const { spawn } = require('child_process');
const path = require('path');

// ─── KONFIGURASI ──────────────────────────────────────────────────────────────
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const INFERENCE_SCRIPT = path.resolve(__dirname, '../../model/inference.py');
const TIMEOUT_MS = 30000; // 30 detik

/**
 * determineResult()
 * Menentukan prediction label dan risk_level dari probability.
 *
 * prediction : >= 0.50 → "Berisiko"      | < 0.50 → "Tidak Berisiko"
 * risk_level : >= 0.70 → "Tinggi"        | >= 0.40 → "Sedang" | < 0.40 → "Rendah"
 *
 * @param {number} probability — nilai 0.0–1.0 dari model
 * @returns {{ prediction: string, risk_level: string }}
 */
const determineResult = (probability) => {
  const prediction = probability >= 0.5 ? 'Berisiko' : 'Tidak Berisiko';

  let risk_level;
  if (probability >= 0.70) {
    risk_level = 'Tinggi';
  } else if (probability >= 0.40) {
    risk_level = 'Sedang';
  } else {
    risk_level = 'Rendah';
  }

  return { prediction, risk_level };
};

/**
 * runInference()
 * Menjalankan inference.py sebagai child process Python.
 * Input dikirim via stdin (JSON), output dibaca dari stdout (JSON).
 *
 * @param {object} inputData — 21 field dari req.validatedInput
 * @returns {Promise<{ probability: number }>}
 */
const runInference = (inputData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_PATH, [INFERENCE_SCRIPT]);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Timeout 30 detik — kill process jika terlalu lama
    const timer = setTimeout(() => {
      timedOut = true;
      pythonProcess.kill();
      reject(new Error('Inference timeout setelah 30 detik. Coba lagi.'));
    }, TIMEOUT_MS);

    // Kumpulkan output dari Python
    pythonProcess.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    // Kirim input JSON ke Python via stdin
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    pythonProcess.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (code !== 0) {
        return reject(
          new Error(
            `Proses Python keluar dengan kode ${code}.${stderr ? ` stderr: ${stderr}` : ''}`
          )
        );
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (result.error) {
          return reject(new Error(result.error));
        }

        if (typeof result.probability !== 'number') {
          return reject(new Error(`Output Python tidak valid: "${stdout}"`));
        }

        resolve(result);
      } catch {
        reject(new Error(`Gagal parse output Python: "${stdout}"`));
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            `Python tidak ditemukan di path "${PYTHON_PATH}". ` +
            `Periksa PYTHON_PATH di file .env (gunakan "python" atau "python3").`
          )
        );
      } else {
        reject(err);
      }
    });
  });
};

/**
 * predict()
 * Fungsi utama yang dipanggil oleh route handler.
 *
 * @param {object} inputData — 21 field dari req.validatedInput
 * @returns {Promise<{ prediction, probability, risk_level, input_received }>}
 */
const predict = async (inputData) => {
  const { probability } = await runInference(inputData);
  const { prediction, risk_level } = determineResult(probability);

  return {
    prediction,
    probability,
    risk_level,
    input_received: inputData,
  };
};

module.exports = { predict, determineResult };
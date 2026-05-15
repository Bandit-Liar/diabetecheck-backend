/**
 * predict.js
 * Route handler untuk POST /api/predict
 * Menerima 8 field input, validasi, jalankan inferensi, simpan ke history.
 */

const express = require('express');
const router = express.Router();
const validateInput = require('../middleware/validateInput');
const { predict } = require('../services/predictionService');

// In-memory history — diimpor dari history.js agar satu sumber kebenaran
const { addToHistory } = require('./history');

/**
 * POST /api/predict
 * Body: { pregnancies, glucose, blood_pressure, skin_thickness,
 *         insulin, bmi, diabetes_pedigree_function, age }
 */
router.post('/', validateInput, async (req, res, next) => {
  try {
    // req.validatedInput sudah bersih & bertipe Number dari validateInput
    const result = await predict(req.validatedInput);

    // Simpan ke history in-memory
    const record = addToHistory(result);

    res.status(200).json({
      success: true,
      data: {
        id: record.id,
        ...result,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
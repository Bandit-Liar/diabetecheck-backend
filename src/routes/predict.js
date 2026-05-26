/**
 * predict.js
 * Route handler untuk POST /api/predict
 * Dataset: CDC Diabetes Health Indicators (21 fitur)
 */

const express = require('express');
const router = express.Router();
const validateInput = require('../middleware/validateInput');
const { predict } = require('../services/predictionService');
const { addToHistory } = require('./history');

/**
 * POST /api/predict
 * Body: 21 field CDC Diabetes Health Indicators (lihat validateInput.js)
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
        prediction: result.prediction,
        probability: result.probability,
        risk_level: result.risk_level,
        input_received: result.input_received,
        timestamp: record.timestamp,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
/**
 * predict.js — v3
 * Route handler POST /api/predict
 * Alur: validateInput → runInference (FastAPI) → determineResult → simpan history → response
 */

const express = require('express');
const router = express.Router();
const validateInput = require('../middleware/validateInput');
const { predict } = require('../services/predictionService');
const { addToHistory } = require('./history');

/**
 * POST /api/predict
 * Body: 17 field CDC (HighBP, HighChol, ... Age)
 *
 * Express otomatis membungkus ke format FastAPI:
 *   { features: { ...17 field }, use_optimal_threshold: true }
 * Frontend tidak perlu tahu format internal ini.
 */
router.post('/', validateInput, async (req, res, next) => {
  try {
    // req.validatedInput sudah bersih & bertipe Number dari validateInput
    const inputData = req.validatedInput;

    // Panggil FastAPI via predictionService
    const { prediction, probability, risk_level } = await predict(inputData);

    // Susun result dengan format konsisten untuk frontend
    const result = {
      prediction,
      probability,
      risk_level,
      input_received: inputData,
      timestamp: new Date().toISOString(),
    };

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
    // Bedakan error AI service dari error server biasa
    const isAiServiceError =
      err.message?.includes('AI service') ||
      err.message?.includes('FastAPI') ||
      err.message?.includes('AI_API_URL');

    if (isAiServiceError) {
      return res.status(503).json({
        success: false,
        error: err.message,
      });
    }

    next(err);
  }
});

module.exports = router;
/**
 * validateInput.js
 * Memvalidasi dan mensanitasi 8 field input sebelum request masuk ke route handler.
 * Jika ada field tidak valid, langsung return 400 — request tidak diteruskan.
 */

const FIELD_RULES = {
  pregnancies: {
    label: 'Pregnancies',
    min: 0,
    max: 17,
  },
  glucose: {
    label: 'Glucose',
    min: 0,
    max: 200,
  },
  blood_pressure: {
    label: 'Blood Pressure',
    min: 0,
    max: 122,
  },
  skin_thickness: {
    label: 'Skin Thickness',
    min: 0,
    max: 99,
  },
  insulin: {
    label: 'Insulin',
    min: 0,
    max: 846,
  },
  bmi: {
    label: 'BMI',
    min: 0,
    max: 67.1,
  },
  diabetes_pedigree_function: {
    label: 'Diabetes Pedigree Function',
    min: 0.078,
    max: 2.42,
  },
  age: {
    label: 'Age',
    min: 21,
    max: 81,
  },
};

const validateInput = (req, res, next) => {
  const body = req.body;
  const errors = [];

  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    const raw = body[field];

    // 1. Cek keberadaan field
    if (raw === undefined || raw === null || raw === '') {
      errors.push({
        field,
        message: `${rule.label} wajib diisi`,
      });
      continue;
    }

    // 2. Cek apakah bisa di-parse sebagai angka
    const value = Number(raw);
    if (isNaN(value)) {
      errors.push({
        field,
        message: `${rule.label} harus berupa angka`,
      });
      continue;
    }

    // 3. Cek range
    if (value < rule.min || value > rule.max) {
      errors.push({
        field,
        message: `${rule.label} harus berada di antara ${rule.min} dan ${rule.max} (diterima: ${value})`,
      });
    }
  }

  // Ada error → langsung return 400, tidak diteruskan ke route handler
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Input tidak valid. Periksa kembali data yang dikirim.',
      errors,
    });
  }

  // Sanitasi: konversi semua field ke Number agar route handler terima data bersih
  req.validatedInput = Object.fromEntries(
    Object.keys(FIELD_RULES).map((field) => [field, Number(body[field])])
  );

  next();
};

module.exports = validateInput;
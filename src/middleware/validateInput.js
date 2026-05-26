/**
 * validateInput.js
 * Memvalidasi 21 field CDC Diabetes Health Indicators.
 * Langsung return 400 jika ada field tidak valid — request tidak diteruskan.
 */

// ─── DEFINISI ATURAN VALIDASI PER FIELD ──────────────────────────────────────

// Field biner: hanya boleh 0 atau 1
const BINARY_FIELDS = [
  'HighBP',
  'HighChol',
  'CholCheck',
  'Smoker',
  'Stroke',
  'HeartDiseaseorAttack',
  'PhysActivity',
  'Fruits',
  'Veggies',
  'HvyAlcoholConsump',
  'AnyHealthcare',
  'NoDocbcCost',
  'DiffWalk',
  'Sex',
];

// Field numerik & skala: boleh nilai dalam range tertentu
const RANGE_FIELDS = {
  BMI:      { min: 12,  max: 98  },
  MentHlth: { min: 0,   max: 30  },
  PhysHlth: { min: 0,   max: 30  },
  GenHlth:  { min: 1,   max: 5   },
  Age:      { min: 1,   max: 13  },
  Education:{ min: 1,   max: 6   },
  Income:   { min: 1,   max: 8   },
};

// Semua 21 field yang wajib ada (urutan sesuai dataset CDC)
const ALL_FIELDS = [
  'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker', 'Stroke',
  'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies',
  'HvyAlcoholConsump', 'AnyHealthcare', 'NoDocbcCost', 'GenHlth',
  'MentHlth', 'PhysHlth', 'DiffWalk', 'Sex', 'Age', 'Education', 'Income',
];

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

const validateInput = (req, res, next) => {
  const body = req.body;
  const details = [];

  for (const field of ALL_FIELDS) {
    const raw = body[field];

    // 1. Cek keberadaan field
    if (raw === undefined || raw === null || raw === '') {
      details.push(`Field ${field} wajib ada dan tidak boleh kosong`);
      continue;
    }

    // 2. Cek apakah nilai bisa jadi angka
    const value = Number(raw);
    if (isNaN(value)) {
      details.push(`Field ${field} harus berupa angka (diterima: "${raw}")`);
      continue;
    }

    // 3. Validasi field biner: hanya 0 atau 1
    if (BINARY_FIELDS.includes(field)) {
      if (value !== 0 && value !== 1) {
        details.push(`Field ${field} harus bernilai 0 atau 1 (diterima: ${value})`);
      }
      continue;
    }

    // 4. Validasi field range
    if (RANGE_FIELDS[field]) {
      const { min, max } = RANGE_FIELDS[field];
      if (value < min || value > max) {
        details.push(
          `Field ${field} harus berada di antara ${min} dan ${max} (diterima: ${value})`
        );
      }
    }
  }

  // Ada error → return 400, jangan teruskan ke route handler
  if (details.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details,
    });
  }

  // Sanitasi: konversi semua ke Number dan simpan di req.validatedInput
  req.validatedInput = Object.fromEntries(
    ALL_FIELDS.map((field) => [field, Number(body[field])])
  );

  next();
};

module.exports = validateInput;
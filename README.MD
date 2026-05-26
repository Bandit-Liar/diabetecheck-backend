# DiabeteCheck — Backend API v2

Backend RESTful API untuk sistem deteksi dini risiko diabetes berbasis AI.
Dibangun dengan **Node.js + Express.js**, menggunakan dataset **CDC Diabetes Health Indicators (21 fitur)**.

---

## Prasyarat

| Tools  | Versi Minimum | Cek dengan |
|--------|---------------|------------|
| Node.js | v18+         | `node -v` |
| npm    | v8+           | `npm -v`  |
| Python | v3.8+         | `python --version` atau `python3 --version` |

---

## Instalasi

### 1. Install dependencies Node.js

```bash
cd backend
npm install
```

### 2. Buat file environment

```bash
cp .env.example .env
```

Sesuaikan isi `.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Windows  → PYTHON_PATH=python
# Mac/Linux → PYTHON_PATH=python3
PYTHON_PATH=python3

MODEL_PATH=./model/diabetecheck_model.keras
SCALER_PATH=./model/scaler.pkl
```

### 3. Jalankan server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Output saat berhasil:
```
─────────────────────────────────────────
  DiabeteCheck Backend v2 berjalan
  Local  : http://localhost:5000
  Health : http://localhost:5000/api/health
  Mode   : development
─────────────────────────────────────────
```

---

## Meletakkan File Model dari Garrand (AI Engineer)

Setelah Garrand selesai melatih model, minta dua file berikut:

| File | Deskripsi |
|------|-----------|
| `diabetecheck_model.keras` | Model neural network hasil training |
| `scaler.pkl` | Scaler yang dipakai saat training (wajib sama) |

Letakkan keduanya di folder `model/`:

```
backend/
└── model/
    ├── inference.py                  ← sudah ada
    ├── diabetecheck_model.keras      ← taruh di sini ✅
    └── scaler.pkl                    ← taruh di sini ✅
```

> **Penting:** Kedua file ini tidak akan ter-commit ke GitHub karena sudah
> ada di `.gitignore`. Bagikan via Google Drive, WeTransfer, atau channel tim.

### Aktifkan model asli

**Langkah 1** — Install dependency Python:
```bash
pip install tensorflow numpy joblib
```

**Langkah 2** — Buka `model/inference.py`, di fungsi `main()` ganti:
```python
# SEBELUM (mock)
result = mock_predict(input_data)

# SESUDAH (model asli)
result = production_predict(input_data)
```

**Langkah 3** — Konfirmasi urutan `FEATURE_ORDER` di `inference.py` ke Garrand.
Urutan 21 fitur **harus persis sama** dengan saat model dilatih.

---

## Struktur Folder

```
backend/
├── model/
│   ├── diabetecheck_model.keras   ← dari Garrand (tidak di-commit)
│   ├── scaler.pkl                 ← dari Garrand (tidak di-commit)
│   └── inference.py               ← script inferensi Python
├── src/
│   ├── routes/
│   │   ├── predict.js             ← POST /api/predict
│   │   └── history.js             ← GET + DELETE /api/history
│   ├── middleware/
│   │   ├── validateInput.js       ← validasi 21 field CDC
│   │   └── errorHandler.js        ← global error handler
│   ├── services/
│   │   └── predictionService.js   ← inference + determineResult()
│   └── utils/
│       └── logger.js              ← logger request
├── .env                           ← tidak di-commit
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## API Endpoints

### GET `/api/health`
Cek status server.

**Response 200:**
```json
{
  "status": "ok",
  "message": "DiabeteCheck API is running",
  "timestamp": "2026-05-17T10:00:00.000Z"
}
```

---

### POST `/api/predict`
Prediksi risiko diabetes berdasarkan 21 fitur CDC.

**Request Body (21 field wajib):**
```json
{
  "HighBP": 1,
  "HighChol": 0,
  "CholCheck": 1,
  "BMI": 28,
  "Smoker": 0,
  "Stroke": 0,
  "HeartDiseaseorAttack": 0,
  "PhysActivity": 1,
  "Fruits": 1,
  "Veggies": 1,
  "HvyAlcoholConsump": 0,
  "AnyHealthcare": 1,
  "NoDocbcCost": 0,
  "GenHlth": 3,
  "MentHlth": 5,
  "PhysHlth": 2,
  "DiffWalk": 0,
  "Sex": 1,
  "Age": 7,
  "Education": 5,
  "Income": 6
}
```

**Validasi 21 field:**

| Tipe | Field | Nilai Valid |
|------|-------|-------------|
| Biner | HighBP, HighChol, CholCheck, Smoker, Stroke, HeartDiseaseorAttack, PhysActivity, Fruits, Veggies, HvyAlcoholConsump, AnyHealthcare, NoDocbcCost, DiffWalk, Sex | 0 atau 1 |
| Numerik | BMI | 12 – 98 |
| Numerik | MentHlth, PhysHlth | 0 – 30 |
| Skala | GenHlth | 1 – 5 |
| Skala | Age | 1 – 13 |
| Skala | Education | 1 – 6 |
| Skala | Income | 1 – 8 |

**Response sukses 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prediction": "Berisiko",
    "probability": 0.6781,
    "risk_level": "Sedang",
    "input_received": { "...21 field..." },
    "timestamp": "2026-05-17T10:00:00.000Z"
  }
}
```

**Logic hasil:**
- `prediction`: `>= 0.50` → `"Berisiko"` | `< 0.50` → `"Tidak Berisiko"`
- `risk_level`: `>= 0.70` → `"Tinggi"` | `>= 0.40` → `"Sedang"` | `< 0.40` → `"Rendah"`

**Response error validasi 400:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    "Field HighBP harus bernilai 0 atau 1 (diterima: 5)",
    "Field BMI harus berada di antara 12 dan 98 (diterima: 999)"
  ]
}
```

---

### GET `/api/history`
Ambil semua riwayat prediksi (terbaru di atas).

**Response 200:**
```json
{
  "success": true,
  "count": 3,
  "data": [ { "...hasil prediksi..." } ]
}
```

---

### DELETE `/api/history`
Hapus semua riwayat prediksi dari memory.

**Response 200:**
```json
{
  "success": true,
  "message": "History cleared"
}
```

---

## Pengujian dengan Postman

### Setup Collection
1. Buka Postman → klik **New Collection** → beri nama `DiabeteCheck API`
2. Tambahkan request berikut satu per satu

### Request 1 — Health Check
| | |
|---|---|
| Method | `GET` |
| URL | `http://localhost:5000/api/health` |
| Expected | Status `200` |

### Request 2 — Predict (Input Valid)
| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Headers | `Content-Type: application/json` |
| Body | Raw JSON → 21 field seperti contoh di atas |
| Expected | Status `200`, ada `prediction` + `probability` + `risk_level` |

### Request 3 — Predict (Input Tidak Valid)
| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Body | `{ "HighBP": 5, "BMI": 999, ...sisanya valid... }` |
| Expected | Status `400`, ada array `details` berisi field yang salah |

### Request 4 — Predict (Field Tidak Lengkap)
| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Body | `{ "HighBP": 1, "BMI": 28 }` (hanya 2 field) |
| Expected | Status `400`, semua field yang hilang terdaftar di `details` |

### Request 5 — Get History
| | |
|---|---|
| Method | `GET` |
| URL | `http://localhost:5000/api/history` |
| Expected | Status `200`, array riwayat prediksi |

### Request 6 — Delete History
| | |
|---|---|
| Method | `DELETE` |
| URL | `http://localhost:5000/api/history` |
| Expected | Status `200`, `"message": "History cleared"` |

> **Tip:** Export collection via **⋯ → Export** untuk dibagikan ke anggota tim.

---

## Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Python tidak ditemukan` | `PYTHON_PATH` salah | Ganti `python3` → `python` di `.env` |
| `CORS error` di browser | Origin tidak diizinkan | Cek `FRONTEND_URL` di `.env` |
| `Cannot find module` | Belum `npm install` | Jalankan `npm install` |
| `EADDRINUSE port 5000` | Port sudah dipakai | Ganti `PORT=5001` di `.env` |
| `Inference timeout` | Model terlalu berat / Python crash | Cek Python & dependency: `pip install tensorflow numpy joblib` |

---

## Catatan Tim

- File `.env`, `*.keras`, dan `*.pkl` **tidak di-commit** ke GitHub
- History bersifat **in-memory** — hilang saat server restart (by design untuk MVP)
- Konfirmasi urutan `FEATURE_ORDER` di `inference.py` ke **Garrand** sebelum switch ke model asli
# DiabeteCheck — Backend API

Backend RESTful API untuk sistem deteksi dini risiko diabetes berbasis AI.
Dibangun dengan **Node.js + Express.js**, mengintegrasikan model Machine Learning
Python (TensorFlow/Keras) via child process.

---

## Prasyarat

Pastikan sudah terinstall di komputer kamu:

| Tools | Versi Minimum | Cek dengan |
|---|---|---|
| Node.js | v18+ | `node -v` |
| npm | v8+ | `npm -v` |
| Python | v3.8+ | `python --version` atau `python3 --version` |

---

## Instalasi

### 1. Clone / salin folder backend

```
diabetecheck/
└── backend/   ← kamu ada di sini
```

### 2. Install dependencies Node.js

```bash
cd backend
npm install
```

### 3. Buat file environment

```bash
cp .env.example .env
```

Lalu buka `.env` dan sesuaikan:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Sesuaikan dengan Python di komputer kamu:
# Windows  → python
# Mac/Linux → python3
PYTHON_PATH=python3

MODEL_PATH=./model/diabetecheck_model.keras
```

> **Windows:** Jika muncul error `Python tidak ditemukan`, ganti `PYTHON_PATH=python`

---

## Meletakkan File Model dari Tim AI Engineer

Setelah tim AI Engineer selesai melatih model, minta file **`diabetecheck_model.keras`**
lalu letakkan di folder `model/`:

```
backend/
└── model/
    ├── inference.py                  ← sudah ada
    └── diabetecheck_model.keras      ← taruh di sini ✅
```

### Aktifkan inferensi model asli

Buka `model/inference.py`, lalu di fungsi `main()` ganti baris ini:

```python
# SEBELUM (mock)
probability = mock_predict(input_data)

# SESUDAH (model asli)
probability = production_predict(input_data)
```

Kemudian uncomment bagian import di atas file:

```python
import numpy as np
import tensorflow as tf
import os
```

Dan uncomment isi fungsi `production_predict()`.

> **Catatan:** Pastikan library Python sudah terinstall:
> ```bash
> pip install tensorflow numpy
> ```

---

## Menjalankan Server

### Mode development (auto-restart saat file berubah)

```bash
npm run dev
```

### Mode production

```bash
npm start
```

Jika berhasil, terminal menampilkan:

```
─────────────────────────────────────────
  DiabeteCheck Backend berjalan
  Local  : http://localhost:5000
  Health : http://localhost:5000/api/health
  Mode   : development
─────────────────────────────────────────
```

---

## Struktur Folder

```
backend/
├── model/
│   ├── diabetecheck_model.keras   ← dari tim AI Engineer (tidak di-commit)
│   └── inference.py               ← script inferensi Python
├── src/
│   ├── routes/
│   │   ├── predict.js             ← POST /api/predict
│   │   └── history.js             ← GET  /api/history
│   ├── middleware/
│   │   ├── validateInput.js       ← validasi & sanitasi 8 field input
│   │   └── errorHandler.js        ← global error handler
│   ├── services/
│   │   └── predictionService.js   ← logic inferensi + determineResult()
│   └── utils/
│       └── logger.js              ← logger request ke console
├── .env                           ← tidak di-commit
├── .env.example                   ← template environment variables
├── .gitignore
├── package.json
├── server.js                      ← entry point Express
└── README.md
```

---

## Endpoints API

### `GET /api/health`
Cek apakah server berjalan.

### `POST /api/predict`
Jalankan prediksi risiko diabetes.

**Request Body:**
```json
{
  "pregnancies": 2,
  "glucose": 130,
  "blood_pressure": 80,
  "skin_thickness": 25,
  "insulin": 100,
  "bmi": 28.5,
  "diabetes_pedigree_function": 0.5,
  "age": 35
}
```

**Validasi range field:**

| Field | Min | Max |
|---|---|---|
| pregnancies | 0 | 17 |
| glucose | 0 | 200 |
| blood_pressure | 0 | 122 |
| skin_thickness | 0 | 99 |
| insulin | 0 | 846 |
| bmi | 0 | 67.1 |
| diabetes_pedigree_function | 0.078 | 2.42 |
| age | 21 | 81 |

**Response sukses `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "probability": 0.6243,
    "percentage": "62.4%",
    "level": "medium",
    "label": "Risiko Sedang",
    "color": "yellow",
    "suggestion": "Disarankan untuk memeriksakan diri ke dokter...",
    "predictedAt": "2026-05-14T10:00:00.000Z"
  }
}
```

**Response error validasi `400`:**
```json
{
  "success": false,
  "message": "Input tidak valid. Periksa kembali data yang dikirim.",
  "errors": [
    { "field": "glucose", "message": "Glucose harus berada di antara 0 dan 200 (diterima: 999)" }
  ]
}
```

### `GET /api/history`
Ambil semua riwayat prediksi (terbaru di atas).

### `DELETE /api/history`
Hapus semua riwayat (berguna saat development).

---

## Test dengan curl

### Health check
```bash
curl http://localhost:5000/api/health
```

### Prediksi — data valid
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 2,
    "glucose": 130,
    "blood_pressure": 80,
    "skin_thickness": 25,
    "insulin": 100,
    "bmi": 28.5,
    "diabetes_pedigree_function": 0.5,
    "age": 35
  }'
```

### Prediksi — validasi gagal (field hilang + out of range)
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 2,
    "glucose": 999,
    "blood_pressure": 80,
    "skin_thickness": 25,
    "insulin": 100,
    "bmi": 28.5,
    "diabetes_pedigree_function": 0.5,
    "age": 15
  }'
```

### Ambil history
```bash
curl http://localhost:5000/api/history
```

### Hapus history
```bash
curl -X DELETE http://localhost:5000/api/history
```

---

## Troubleshooting

| Error | Penyebab | Solusi |
|---|---|---|
| `Python tidak ditemukan` | `PYTHON_PATH` salah | Ganti `python3` → `python` di `.env` |
| `CORS error` di browser | Origin frontend tidak diizinkan | Pastikan `FRONTEND_URL` di `.env` sesuai URL frontend |
| `Cannot find module` | `npm install` belum dijalankan | Jalankan `npm install` di folder `backend/` |
| `EADDRINUSE port 5000` | Port sudah dipakai proses lain | Ganti `PORT=5001` di `.env` atau matikan proses lain |

---

## Catatan untuk Tim

- File `.env` dan `model/*.keras` **tidak di-commit** ke Git (sudah ada di `.gitignore`)
- History prediksi bersifat **in-memory** — akan hilang saat server restart (ini disengaja untuk MVP)
- Untuk mengganti ke model asli, lihat bagian **[Meletakkan File Model](#meletakkan-file-model-dari-tim-ai-engineer)** di atas
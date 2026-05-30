# DiabeteCheck — Backend API v3

Backend RESTful API untuk sistem deteksi dini risiko diabetes berbasis AI.
Dibangun dengan **Node.js + Express.js** sebagai **proxy** ke server FastAPI Garrand
yang menjalankan model TensorFlow/Keras dengan **17 fitur CDC BRFSS 2015**.

---

## Arsitektur Sistem

```
Frontend (port 5173)
    │  POST /api/predict — 17 field langsung di root body
    ▼
Express.js Backend (port 5000)   ← kamu di sini
    │  POST /predict — dibungkus: { features: {...}, use_optimal_threshold: true }
    │  Header: ngrok-skip-browser-warning: true
    ▼
FastAPI Garrand (ngrok URL)
    │  Model: diabetecheck_model.keras + scaler_final_17fitur.pkl
    ▼
Express (konversi format response)
    │  { success, data: { prediction, probability, risk_level, ... } }
    ▼
Frontend (tampilkan hasil)
```

---

## Prasyarat

| Tools   | Versi Minimum | Cek dengan        |
|---------|---------------|-------------------|
| Node.js | v18+          | `node -v`         |
| npm     | v8+           | `npm -v`          |

> Python tidak diperlukan lagi — model AI dijalankan oleh Garrand di server FastAPI terpisah.

---

## Instalasi

### 1. Install dependencies

```bash
cd backend
npm install
```

Pastikan `axios` sudah terinstall (cek di `node_modules/axios`).
Jika belum, jalankan:

```bash
npm install axios
```

### 2. Buat file `.env`

```bash
copy .env.example .env
```

### 3. Isi `AI_API_URL` di `.env`

Minta URL ngrok terbaru dari **Garrand (AI Engineer)**. URL berbentuk:
```
https://xxxx-xxxx.ngrok-free.app
```

Isi di `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
AI_API_URL=https://xxxx-xxxx.ngrok-free.app
```

> ⚠️ **Penting:** URL ngrok **berubah setiap kali** Google Colab Garrand di-restart.
> Setiap kali Garrand restart Colab, minta URL baru dan update `AI_API_URL` di `.env`.

### 4. Verifikasi FastAPI Garrand aktif

Buka browser dan akses:
```
https://xxxx-xxxx.ngrok-free.app/health
```
Harus muncul response `{ "status": "ok" }`. Jika tidak muncul, berarti server Garrand belum aktif — hubungi Garrand.

### 5. Jalankan server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Output saat berhasil:
```
─────────────────────────────────────────
  DiabeteCheck Backend v3 berjalan
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
│   └── inference.py          ← tidak dipakai lagi (arsip)
├── src/
│   ├── routes/
│   │   ├── predict.js        ← POST /api/predict (proxy ke FastAPI)
│   │   └── history.js        ← GET + DELETE /api/history
│   ├── middleware/
│   │   ├── validateInput.js  ← validasi 17 field CDC
│   │   └── errorHandler.js   ← global error handler
│   ├── services/
│   │   └── predictionService.js ← Axios ke FastAPI + konversi response
│   └── utils/
│       └── logger.js         ← logger request
├── .env                      ← tidak di-commit
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## API Endpoints

### `GET /api/health`
Cek status server Express.

**Response 200:**
```json
{
  "status": "ok",
  "message": "DiabeteCheck API is running",
  "timestamp": "2026-05-30T10:00:00.000Z"
}
```

---

### `POST /api/predict`
Prediksi risiko diabetes — **17 field CDC** langsung di root body.

**Request Body:**
```json
{
  "HighBP": 1,
  "HighChol": 1,
  "CholCheck": 1,
  "BMI": 28.5,
  "Smoker": 0,
  "Stroke": 0,
  "HeartDiseaseorAttack": 0,
  "PhysActivity": 1,
  "Fruits": 1,
  "Veggies": 1,
  "HvyAlcoholConsump": 0,
  "GenHlth": 3,
  "MentHlth": 0,
  "PhysHlth": 0,
  "DiffWalk": 0,
  "Sex": 0,
  "Age": 7
}
```

**Aturan validasi 17 field:**

| Tipe   | Field                                                                                     | Nilai Valid  |
|--------|-------------------------------------------------------------------------------------------|--------------|
| Biner  | HighBP, HighChol, CholCheck, Smoker, Stroke, HeartDiseaseorAttack, PhysActivity, Fruits, Veggies, HvyAlcoholConsump, DiffWalk, Sex | 0 atau 1 |
| Float  | BMI                                                                                       | 10 – 100     |
| Skala  | GenHlth                                                                                   | 1 – 5        |
| Skala  | MentHlth, PhysHlth                                                                        | 0 – 30       |
| Skala  | Age                                                                                       | 1 – 13       |

**Response sukses 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prediction": "Berisiko",
    "probability": 0.72,
    "risk_level": "Risiko Tinggi",
    "input_received": { "...17 field..." },
    "timestamp": "2026-05-30T10:00:00.000Z"
  }
}
```

**Response error validasi 400:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    "Field 'HighBP' harus bernilai 0 atau 1 (diterima: 5)",
    "Field 'BMI' harus berupa angka antara 10 dan 100 (diterima: 999)"
  ]
}
```

**Response error AI service 503:**
```json
{
  "success": false,
  "error": "AI service tidak dapat diakses. Pastikan server model aktif."
}
```

---

### `GET /api/history`
Ambil semua riwayat prediksi (terbaru di atas).

### `DELETE /api/history`
Hapus semua riwayat prediksi dari memory.

---

## Pengujian dengan Postman — 4 Skenario Wajib

### Setup
1. Buka Postman → **New Collection** → beri nama `DiabeteCheck API v3`
2. Tambahkan request berikut

---

### Skenario 1 — Input Valid (harus return 200)

| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Headers | `Content-Type: application/json` |
| Body (raw JSON) | 17 field lengkap seperti contoh di atas |

Expected: **Status 200**, ada `prediction`, `probability`, `risk_level`.

---

### Skenario 2 — Field Binary Salah (harus return 400)

| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Body | Sama seperti Skenario 1, tapi ubah `"HighBP": 5` |

Expected: **Status 400**, `details` berisi pesan error untuk field `HighBP`.

---

### Skenario 3 — Field Range Salah (harus return 400)

| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Body | Sama seperti Skenario 1, tapi ubah `"BMI": 999` |

Expected: **Status 400**, `details` berisi pesan error untuk field `BMI`.

---

### Skenario 4 — Field Tidak Lengkap (harus return 400)

| | |
|---|---|
| Method | `POST` |
| URL | `http://localhost:5000/api/predict` |
| Body | `{ "HighBP": 1, "HighChol": 0, "BMI": 28, "Age": 7, "Sex": 0 }` |

Expected: **Status 400**, `details` berisi 12 field yang hilang.

---

## Konversi Response FastAPI → Frontend

| FastAPI (`predicted_label`) | Express → Frontend (`prediction`) |
|---|---|
| `"Diabetik"` | `"Berisiko"` |
| Selain `"Diabetik"` | `"Tidak Berisiko"` |

| FastAPI (`risk_level`) | Frontend (`risk_level`) |
|---|---|
| `"Risiko Tinggi"` | `"Risiko Tinggi"` |
| `"Risiko Sedang"` | `"Risiko Sedang"` |
| `"Risiko Rendah"` | `"Risiko Rendah"` |

---

## Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `AI_API_URL belum diatur` | `.env` belum diisi | Isi `AI_API_URL` di `.env` dengan URL dari Garrand |
| `AI service tidak dapat diakses` | FastAPI Garrand tidak aktif / URL salah | Hubungi Garrand, minta Colab dijalankan ulang dan kirim URL baru |
| `AI service timeout` | Model lambat merespons | Coba lagi, atau hubungi Garrand untuk cek Colab |
| `EADDRINUSE port 5000` | Port dipakai proses lain | Ganti `PORT=5001` di `.env` |
| `Cannot find module 'axios'` | Axios belum terinstall | Jalankan `npm install axios` |

---

## Catatan Tim

- File `.env` **tidak di-commit** ke GitHub — bagikan `AI_API_URL` via chat tim
- **URL ngrok berubah** setiap Colab Garrand restart — selalu update `.env`
- History prediksi bersifat **in-memory** — hilang saat server Express restart (by design untuk MVP)
- Untuk cek FastAPI langsung: buka `{AI_API_URL}/docs` di browser → Swagger UI interaktif
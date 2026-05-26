"""
inference.py — DiabeteCheck v2 (CDC 21 Fitur)
Dipanggil Node.js via child_process.spawn.
Menerima JSON dari stdin, mengembalikan JSON ke stdout.

MODE SEKARANG : MOCK — probability acak 0.2–0.85
MODE PRODUKSI : Ganti pemanggilan mock_predict → production_predict di main()
                setelah menerima model .keras dan scaler.pkl dari Garrand.
"""

import sys
import json
import random

# ─── [PRODUCTION] Uncomment saat model dari Garrand sudah tersedia ─────────────
# import numpy as np
# import joblib
# from tensorflow import keras

# ─── URUTAN 21 FITUR (HARUS SAMA PERSIS DENGAN SAAT GARRAND MELATIH MODEL) ────
FEATURE_ORDER = [
    'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker', 'Stroke',
    'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies',
    'HvyAlcoholConsump', 'AnyHealthcare', 'NoDocbcCost', 'GenHlth',
    'MentHlth', 'PhysHlth', 'DiffWalk', 'Sex', 'Age', 'Education', 'Income'
]


def mock_predict(input_data):
    """
    MOCK: Simulasi prediksi dengan probability acak 0.2–0.85.
    Hapus / nonaktifkan fungsi ini saat model asli sudah siap.
    """
    probability = round(random.uniform(0.2, 0.85), 4)
    return {"probability": probability}


def production_predict(input_data):
    """
    [PRODUCTION] Load model .keras + scaler.pkl lalu jalankan inferensi sungguhan.

    Cara aktifkan:
      1. Pastikan diabetecheck_model.keras dan scaler.pkl ada di folder model/
      2. Uncomment import di atas (numpy, joblib, keras)
      3. Di fungsi main(), ganti mock_predict → production_predict
      4. Install dependency Python: pip install tensorflow numpy joblib

    PENTING: Konfirmasi urutan FEATURE_ORDER ke Garrand sebelum diaktifkan —
    urutan harus 100% sama dengan saat model dilatih.
    """
    import numpy as np
    import joblib
    from tensorflow import keras
    import os

    model_path = os.environ.get('MODEL_PATH', 'model/diabetecheck_model.keras')
    scaler_path = os.environ.get('SCALER_PATH', 'model/scaler.pkl')

    model = keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)

    # Susun fitur sesuai urutan training
    features = [[input_data[f] for f in FEATURE_ORDER]]
    features_array = np.array(features, dtype=float)

    features_scaled = scaler.transform(features_array)
    probability = float(model.predict(features_scaled)[0][0])

    return {"probability": round(probability, 4)}


def main():
    try:
        raw = sys.stdin.read()
        input_data = json.loads(raw)

        # ── Ganti mock_predict → production_predict saat model Garrand siap ──
        result = mock_predict(input_data)

    except json.JSONDecodeError as e:
        result = {"error": f"JSON parsing error: {str(e)}"}
    except Exception as e:
        result = {"error": str(e)}

    print(json.dumps(result))
    sys.stdout.flush()


if __name__ == '__main__':
    main()
"""
inference.py
Menerima input JSON dari stdin, mengembalikan hasil prediksi ke stdout.

MODE SEKARANG : MOCK — return probability acak antara 0.3–0.8
MODE PRODUKSI : Ganti bagian bertanda [PRODUCTION] untuk load model .keras asli
"""

import sys
import json
import random

# ─── [PRODUCTION] Import ini diaktifkan saat model .keras sudah tersedia ──────
# import numpy as np
# import tensorflow as tf
# import os

def mock_predict(input_data):
    """
    MOCK: Simulasi prediksi dengan probability acak 0.3–0.8.
    Hapus fungsi ini saat model asli sudah siap.
    """
    probability = round(random.uniform(0.3, 0.8), 4)
    return probability


def production_predict(input_data):
    """
    [PRODUCTION] Load model .keras dan jalankan inferensi sungguhan.
    Aktifkan fungsi ini dan ganti pemanggilan di main() saat model sudah ada.

    import numpy as np
    import tensorflow as tf
    import os

    model_path = os.environ.get('MODEL_PATH', './model/diabetecheck_model.keras')
    model = tf.keras.models.load_model(model_path)

    features = [
        input_data['pregnancies'],
        input_data['glucose'],
        input_data['blood_pressure'],
        input_data['skin_thickness'],
        input_data['insulin'],
        input_data['bmi'],
        input_data['diabetes_pedigree_function'],
        input_data['age'],
    ]

    input_array = np.array([features], dtype=np.float32)
    prediction = model.predict(input_array)
    probability = float(prediction[0][0])
    return round(probability, 4)
    """
    pass


def main():
    try:
        # Baca input JSON dari stdin (dikirim oleh Node.js)
        raw = sys.stdin.read()
        input_data = json.loads(raw)

        # ── Ganti mock_predict → production_predict saat model sudah siap ──
        probability = mock_predict(input_data)

        result = {
            "success": True,
            "probability": probability
        }

    except json.JSONDecodeError as e:
        result = {
            "success": False,
            "error": f"JSON parsing error: {str(e)}"
        }
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }

    # Output ke stdout — dibaca oleh Node.js
    print(json.dumps(result))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
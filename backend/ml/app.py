from flask import Flask, request, jsonify
import joblib
import numpy as np
from pathlib import Path
import os

app = Flask(__name__)
MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"
model = joblib.load(MODEL_PATH)
print("Crop recommendation model loaded")

@app.get("/")
@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "crop-ml-api"})

@app.post("/predict")
def predict():
    try:
        data = request.get_json(silent=True) or {}
        required = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
        missing = [key for key in required if key not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
        features = [[float(data[key]) for key in required]]
        probabilities = model.predict_proba(features)[0]
        top3_idx = np.argsort(probabilities)[-3:][::-1]
        recommendations = [{"crop": str(model.classes_[i]), "confidence": round(float(probabilities[i]) * 100, 2)} for i in top3_idx]
        return jsonify({"recommendations": recommendations})
    except (TypeError, ValueError, KeyError) as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=False)

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# Load your pre-trained model (ensure 'biogas_model.pkl' is in the folder)
model = joblib.load('biogas_model.pkl')

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    # Convert input to numpy array for the model
    features = np.array([[data['temperature'], data['ph'], data['hrt'], data['olr']]])
    prediction = model.predict(features)
    return jsonify({'yield': float(prediction[0])})

if __name__ == '__main__':
    app.run(port=5001)
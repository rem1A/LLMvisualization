from flask import Flask, render_template, request, jsonify
from pathlib import Path
import numpy as np

app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fetch_data', methods=['POST'])
def fetch_data():
    request_data = request.get_json()
    if not request_data:
        return jsonify({'error': 'No path provided'}), 400
    print(f"Received request for file: {request_data}")
    req_path = request_data.get('folder')
    filepath = Path('/Users/huangxin/Desktop/LLMvisualization/Llama3.2') / req_path
    if not filepath.exists():
        return jsonify({'error': 'Path does not exist'}), 404
    result = []
    for file in filepath.glob('*.bin'):
        with file.open('rb') as f:
            shape = np.fromfile(f, dtype='<i4', count=1)
            data = np.fromfile(f, dtype='<f4', count=shape[0])
            result.append({
                'filename': file.name,
                'shape': shape.tolist(),
                # 'data': data.tolist()
            })
    return jsonify(result)
if __name__ == '__main__':
    app.run(debug=True, port=8000)
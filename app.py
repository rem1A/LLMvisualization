from flask import Flask, render_template, request, jsonify
from pathlib import Path
import numpy as np
import math

app = Flask(__name__, template_folder='templates', static_folder='static')

def data_process(threshold, data_len, bin_data):
    chunks_num = 64
    threshold_cnt = 0
    cnt = 0
    chunk_size = math.ceil(data_len / chunks_num)
    rate_list = []
    data_array = np.array(bin_data)
    max_value = np.max(np.abs(data_array))
    min_value = np.min(np.abs(data_array))
    var_value = np.var(data_array)
    average_value = np.mean(np.abs(data_array))#average of absolute values
    total_rate = np.sum(np.abs(data_array) >= threshold) / data_len
    for i in range(data_len):
        if abs(data_array[i]) >= threshold:
            threshold_cnt += 1
        cnt += 1
        if i == data_len - 1:
            rate_list.append(threshold_cnt / cnt)
            break
        if cnt == chunk_size:
            rate_list.append(threshold_cnt / chunk_size)
            threshold_cnt = 0
            cnt = 0
    return {
        'max': max_value,
        'min': min_value,
        'var': var_value,
        'average': average_value,
        'rate_list': rate_list,
        'total_rate': total_rate,
        'chunk_size': chunk_size    
    }

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
    threshold = 0.000083
    for file in filepath.glob('*.bin'):
        with file.open('rb') as f:
            shape = np.fromfile(f, dtype='<i4', count=1)
            data = np.fromfile(f, dtype='<f4', count=shape[0])
            processed_data = data_process(threshold, shape[0], data)#TODO: threshold should be passed from the frontend
            result.append({
                'filename': file.name,
                'shape': shape.tolist(),
                'max': float(processed_data['max']),
                'min': float(processed_data['min']),
                'var': float(processed_data['var']),
                'average': float(processed_data['average']),
                'rate_list': [float(x) for x in processed_data['rate_list']],
                'total_rate': float(processed_data['total_rate']),
                'chunk_size': int(processed_data['chunk_size'])
            })#must be float, otherwise jsonify will not work
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
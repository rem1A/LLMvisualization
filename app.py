from flask import Flask, render_template, request, jsonify
from pathlib import Path
import numpy as np
import math
from collections import defaultdict

app = Flask(__name__, template_folder='templates', static_folder='static')

#截断到小数点后若干位 不进行四舍五入
def truncate(x, n):
    factor = 10 ** n
    return int(x * factor) / factor

def data_process(threshold, data_len, bin_data):
    num_precision = 6
    chunks_num = 64
    threshold_cnt = 0
    cnt = 0
    chunk_size = math.ceil(data_len / chunks_num)
    rate_list = []
    data_array = np.array(bin_data)
    max_absvalue = np.max(np.abs(data_array))
    min_absvalue = np.min(np.abs(data_array))
    var_value = np.var(data_array)
    average_absvalue = np.mean(np.abs(data_array))#average of absolute values
    total_rate = np.sum(np.abs(data_array) >= threshold) / data_len
    scatter_plot_data = []

    # 统计每个数值出现的次数
    counter = defaultdict(int)
    for val in data_array:
        rounded_val = float(truncate(val, num_precision))  # 保留6位小数
        counter[rounded_val] += 1

    # 转换成 D3.js 能用的结构
    scatter_plot_data = [{'x': k, 'y': v} for k, v in counter.items()]
    for i in range(data_len):
        if truncate(abs(data_array[i]), num_precision) >= threshold:
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
        'max': max_absvalue,
        'min': min_absvalue,
        'var': var_value,
        'average': average_absvalue,
        'rate_list': rate_list,
        'total_rate': total_rate,
        'chunk_size': chunk_size,
        'scatter_plot_data': scatter_plot_data
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
    threshold = request_data.get('threshold', 0.0001) 
    for file in filepath.glob('*.bin'):
        with file.open('rb') as f:
            shape = np.fromfile(f, dtype='<i4', count=1)
            data = np.fromfile(f, dtype='<f4', count=shape[0])
            processed_data = data_process(threshold, shape[0], data)
            result.append({
                'filename': file.name,
                'threshold': float(threshold),
                'shape': shape.tolist(),
                'max': float(processed_data['max']),
                'min': float(processed_data['min']),
                'var': float(processed_data['var']),
                'average': float(processed_data['average']),
                'rate_list': [float(x) for x in processed_data['rate_list']],
                'total_rate': float(processed_data['total_rate']),
                'chunk_size': int(processed_data['chunk_size']),
                'scatter_plot_data': processed_data['scatter_plot_data']
            })#must be float, otherwise jsonify will not work
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
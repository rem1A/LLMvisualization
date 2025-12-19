from flask import Flask, render_template, request, jsonify
from pathlib import Path
import numpy as np
import math
from collections import defaultdict
import os
import struct
import concurrent.futures
import json
from collections import defaultdict
import re


app = Flask(__name__, template_folder='templates', static_folder='static')

# 截断到小数点后 n 位，不四舍五入
data_cache = {}

def truncate_np(x, precision):
        factor = 10.0 ** precision
        return np.floor(x * factor) / factor

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def group_data_by_threshold(data_list):
    threshold_groups = defaultdict(list)
    for item in data_list:
        threshold = item.get('threshold')
        threshold_groups[threshold].append(item)
    
    # threshold 是 float，直接按数值升序
    sorted_thresholds = sorted(threshold_groups.keys())

    grouped_data = []
    for threshold in sorted_thresholds:
        group = sorted(threshold_groups[threshold], key=lambda x: natural_sort_key(x['filename']))
        grouped_data.append(group)
    
    return grouped_data

def data_process(threshold, bin_data):
    num_precision = 6
    chunks_num = 64

    data_array = bin_data.ravel()
    abs_array = np.abs(data_array)

    max_absvalue = np.max(abs_array)
    min_absvalue = np.min(abs_array)
    var_value = np.var(data_array)
    average_absvalue = np.mean(abs_array)
    total_rate = np.sum(abs_array >= threshold) / data_array.size

    # 散点图统计（更快的方式）
    rounded = truncate_np(data_array, num_precision)
    unique_vals, counts = np.unique(rounded, return_counts=True)
    scatter_plot_data = [{'x': float(x), 'y': int(y)} for x, y in zip(unique_vals, counts)]

    # 分 chunk 计算比例
    mask = truncate_np(abs_array, num_precision) >= threshold
    chunks = np.array_split(mask, chunks_num)
    rate_list = [np.count_nonzero(chunk) / len(chunk) for chunk in chunks]

    chunk_size = int(np.ceil(data_array.size / chunks_num))

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

executor = concurrent.futures.ProcessPoolExecutor(max_workers=8)

def process_file(file, threshold):
    try:
        with open(file, "rb") as f:
            file_size = os.fstat(f.fileno()).st_size

            ndim_bytes = f.read(4)
            if len(ndim_bytes) < 4:
                print(f"[WARNING] 跳过文件（无法读取维度数量）: {file.name}")
                return None

            ndim = struct.unpack('<i', ndim_bytes)[0]
            shape = np.fromfile(f, dtype='<i4', count=ndim)
            element_count = int(np.prod(shape))
            remaining_bytes = file_size - (1 + ndim) * 4

            if remaining_bytes == element_count * 4:
                data = np.fromfile(f, dtype='<f4', count=element_count)
                data = data.reshape(shape)
                dtype = 'float32'
            elif remaining_bytes == element_count * 2:
                raw = np.fromfile(f, dtype='<u2', count=element_count)
                data = (raw.astype(np.uint32) << 16).view('<f4')
                data = data.reshape(shape)
                dtype = 'bfloat16'
            else:
                print(f"[WARNING] 跳过无法识别格式的文件: {file.name}")
                return None

        processed_data = data_process(threshold, data)
        print(f"[DEBUG] process_file: {file.name} processed, dtype={dtype}, shape={shape.tolist()}, threshold={threshold}")
        return {
            'filename': file.name,
            'dtype': dtype,
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
        }

    except Exception as e:
        print(f"[ERROR] 文件 {file.name} 读取失败: {e}")
        return None
    
@app.route('/fetch_data', methods=['POST'])
def fetch_data():
    request_data = request.get_json()
    if not request_data:
        return jsonify({'error': 'No path provided'}), 400

    req_path = request_data.get('folder')
    threshold = request_data.get('threshold', 0.00001)
    # base_path = Path('/Users/huangxin/Desktop/LLMvisualization/Resnet-50/mnist/')
    base_path = Path('/Users/huangxin/Desktop/LLMvisualization/Qwen/')
    # base_path = Path('/Users/huangxin/Desktop/LLMvisualization/Llama3.2-safetensors-baseline-incremental')  # 指定存放 bin 文件的目录
    folder_path = base_path / req_path

    if not folder_path.exists():
        return jsonify({'error': 'Path does not exist'}), 404

    files = list(folder_path.glob('*.bin'))
    result = []

    # 使用多进程并行
    # with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
    futures = [executor.submit(process_file, file, threshold) for file in files]
    for future in concurrent.futures.as_completed(futures):
        res = future.result()
        if res:
            result.append(res)

    return {
            "data": result
        }

@app.route('/load_precomputed', methods=['POST'])
def load_precomputed():
    request_data = request.get_json()
    filename = request_data.get('filename')

    if not filename:
        return jsonify({'error': 'No filename provided'}), 400

    json_path = Path('/Users/huangxin/Desktop/LLMvisualization/precomputed') / filename  # 指定存放 json 的目录
    if not json_path.exists():
        return jsonify({'error': f'File {filename} not found'}), 404

    try:
        data = []
        with open(json_path, 'r') as f:
            for line in f:
                data.append(json.loads(line))
            print(f"Total {len(data)} records loaded from {json_path}")
        # 对数据按 threshold 分组
        data = group_data_by_threshold(data)
        return {
            "source": "precomputed",
            "data": data
        }
    except Exception as e:
        return jsonify({'error': f'Failed to read file: {str(e)}'}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=8001)
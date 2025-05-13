import { pubsub } from '../utils/pubsubscribe.js';
import { BasicView } from '../utils/basicview.js';

export class DetailView extends BasicView {
  constructor(container) {
    super(container);
    console.log('✅ DetailView constructor called');

    pubsub.subscribe('layerSelected', (topic, layer) => {
      console.log('📨 DetailView received layer:', layer);
      this.update(layer);
    });
  }

  init() {
    super.init();
    console.log('✅ DetailView.init() called');
    this.titleEl = this.container.getElement().find('.layer-title')[0];
    this.descEl = this.container.getElement().find('.layer-description')[0];
    this.canvas = this.container.getElement().find('#layer-canvas')[0];
  }

  async update(layer) {
    if (!layer || !layer.files || layer.files.length === 0) {
      console.warn('⚠️ update() received empty layer or no files');
      return;
    }

    console.log('🧪 First file object:', layer.files[0]);
    console.log('🧪 typeof =', typeof layer.files[0]);
    console.log('🧪 instanceof File:', layer.files[0] instanceof File);

    this.titleEl.textContent = layer.name;
    this.descEl.textContent = `文件：${layer.files.map(f => f.name).join(', ')}`;

    const tensors = await Promise.all(layer.files.map(file => this.readBin(file)));
    console.log('📊 tensors:', tensors);

    const combined = tensors.flat();
    console.log('✅ update(): combined tensor length =', combined.length);

    if (combined.length === 0) {
      console.warn('⚠️ combined data is empty, skip drawBar()');
      return;
    }

    this.drawBar(combined);
  }

  readBin(file) {
    console.log('📥 readBin() called for:', file);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log('🔍 FileReader loaded:', file.name);

        const buf = e.target.result;
        const int32View = new Int32Array(buf);

        let shapeBytes = 0;
        let shape = [];

        for (let i = 1; i <= 10; i++) {
          shape = Array.from(int32View.slice(0, i));
          const total = shape.reduce((a, b) => a * b, 1);
          if (4 * i + total * 4 === buf.byteLength) {
            shapeBytes = i * 4;
            console.log(`✅ Parsed shape for ${file.name}:`, shape);
            break;
          }
        }

        if (shapeBytes === 0) {
          alert(`❌ 无法解析 ${file.name}，shape 不匹配`);
          const fallback = new Float32Array(buf);
          console.warn(`🧪 fallback mode, float32 length: ${fallback.length}`);
          resolve(Array.from(fallback));
          return;
        }

        const data = new Float32Array(buf, shapeBytes);
        console.log(`✅ ${file.name} 读取成功，元素个数:`, data.length);
        resolve(Array.from(data));
      };

      reader.onerror = (e) => {
        console.error('❌ FileReader error:', e);
        reject(e);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  drawBar(data, maxDisplay = 64, threshold = 0.000001) {
    const ctx = this.canvas.getContext('2d');
    const width = this.canvas.offsetWidth || 800;
    this.canvas.width = width;
    const height = this.canvas.height = 80;

    console.log('📏 drawBar: canvas width =', width);

    const groupSize = Math.ceil(data.length / maxDisplay);
    const compressed = [];

    for (let i = 0; i < data.length; i += groupSize) {
      const chunk = data.slice(i, i + groupSize);
      const maxVal = chunk.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b);
      compressed.push(Math.abs(maxVal) < threshold ? 0 : maxVal);
    }

    const maxVal = Math.max(...compressed.map(Math.abs));
    ctx.clearRect(0, 0, width, height);

    // 1. 创建离屏 canvas 生成 colorbar 渐变
  const gradientCanvas = document.createElement('canvas');
  const gradientWidth = 256; // colorbar 的分辨率
  gradientCanvas.width = gradientWidth;
  gradientCanvas.height = 1;
  const gCtx = gradientCanvas.getContext('2d');

  // 设置渐变（你的 colorbar 样式）
  const gradient = gCtx.createLinearGradient(0, 0, gradientWidth, 0);
  gradient.addColorStop(0, '#e0f7ff');
  gradient.addColorStop(0.5, '#66ccff');
  gradient.addColorStop(1, '#0066cc');

  gCtx.fillStyle = gradient;
  gCtx.fillRect(0, 0, gradientWidth, 1);

  // 获取 colorbar 像素颜色数据
  const gradientData = gCtx.getImageData(0, 0, gradientWidth, 1).data;

  // 2. 使用 val/maxVal 映射到 gradient 中的颜色
  compressed.forEach((val, i) => {
    const ratio = maxVal ? val / maxVal : 0; // 范围 [0, 1]
    const x = Math.floor(ratio * (gradientWidth - 1)); // 映射到渐变条索引
    const idx = x * 4;

    const r = gradientData[idx];
    const g = gradientData[idx + 1];
    const b = gradientData[idx + 2];

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    const barW = width / compressed.length;
    ctx.fillRect(i * barW, 10, barW, 40);
  });
  }
}
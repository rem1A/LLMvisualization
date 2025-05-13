import { pubsub } from '../utils/pubsubscribe.js';
import { BasicView } from '../utils/basicview.js';

export class Overview extends BasicView {
  constructor(container) {
    super(container);
    this.fileList = [];
  }

  init() {
    super.init();

    this.svg = d3.select('#overview_svg')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g');

    this.margin.left = 50;
    this.margin.top = 130;

    const input = document.getElementById('binUpload');
    input.addEventListener('change', (e) => {
      const files = [...e.target.files];
      files.sort((a, b) => a.name.localeCompare(b.name));
      this.fileList = files;
      console.log('📁 Uploaded files:', files.map(f => f.name));
      this.draw();
    });
  }

  draw() {
    if (!this.fileList || this.fileList.length === 0) {
      console.warn('⚠️ No files to draw');
      return;
    }

    const blockWidth = 60;
    const blockHeight = 30;
    const spacing = 10;
    const g = this.svg;

    g.selectAll('*').remove();

    const tooltip = d3.select('#overview-tooltip');

    g.selectAll('rect')
      .data(this.fileList)
      .enter()
      .append('rect')
      .attr('x', (d, i) => this.margin.left + i * (blockWidth + spacing))
      .attr('y', this.margin.top)
      .attr('width', blockWidth)
      .attr('height', blockHeight)
      .attr('fill', '#66ccff')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        console.log('🧪 overview block clicked:', d);
        console.log('🧪 typeof:', typeof d);
        console.log('🧪 instanceof File:', d instanceof File);

        pubsub.publish('layerSelected', {
          name: d.name,
          files: [d] // ✅ 正确传递 File 对象
        });
      })
      .on('mouseover', function (event, d) {
        tooltip
          .style('left', event.pageX + 'px')
          .style('top', (event.pageY - 28) + 'px')
          .style('display', 'block')
          .text(d.name);
      })
      .on('mouseout', function () {
        tooltip.style('display', 'none');
      });

    g.selectAll('text')
      .data(this.fileList)
      .enter()
      .append('text')
      .attr('x', (d, i) => this.margin.left + i * (blockWidth + spacing) + blockWidth / 2)
      .attr('y', this.margin.top + blockHeight / 2 + 5)
      .attr('text-anchor', 'middle')
      .text((d, i) => `#${i}`)
      .attr('fill', '#fff');
  }
}
// import { BasicView } from '../utils/basicview.js';
// import { OverviewData } from './overviewData.js';
// import { subscribe } from '../utils/pubsubscribe.js';
class Overview extends BasicView
{
    constructor(container)
    {
        super(container);

        this.dataManager = new OverviewData();
        this.tooltip = null;
        
        subscribe('data', this.update.bind(this));//gpt: 让 update() 方法内部能正确使用 this
    }

    init()
    {
        super.init();

        this.margin.left = 50;
        this.margin.top = 50 ;

        if(!this.svg){
            this.svg = d3.select('#overview_svg')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height - 420)
            .append('g');
        }

        this.svg.selectAll('*').remove(); // 清空 svg 

        this.tooltip = d3.select('#overview_svg')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0.8)//透明度
            .style('position', 'absolute')//绝对定位 用于确定tooltip的位置
            .style('visibility', 'hidden')//设置tooltip的可见性 默认不显示 需要的时候再显示
            .style('background', 'white')//背景颜色
            .style('border', '1px solid black')
            .style('padding', '5px')//内边距
            .style('border-radius', '5px')//圆角
            .style('font-size', '12px')
            .style('pointer-events', 'none');//GPT: 禁止鼠标事件作用于 tooltip 本身。这样鼠标移到 tooltip 上时不会触发其他事件（如 tooltip 消失），避免干扰。
       
        // GPT: 添加事件监听器，监听 threshold 输入框的变化
        document.getElementById('threshold-input').addEventListener('change', (e) => {
        const threshold = parseFloat(e.target.value);
            if (!isNaN(threshold)) {
                // 发起新的数据请求，传入 threshold
                fetch_data({ folder: 'ckpt_test', threshold: threshold });
            }
        });
    }   

    draw(){
      
        this.init();

        const text = 'Test: Here shows the overview of the tensors, each block represents the difference between the corresponding tensors in the two checkpoints. Click the blocks to see the details of the tensors.';
        overview_view.WrapText(text, this.margin.left - 20, this.margin.top - 20, this.width - this.margin.left - this.margin.right, 1.2);
        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['#ffffff', '#87cefa']);

        const rectWidth = 20;
        const rectHeight = 20;
        const rectSpace = 5;

        this.svg.append('g').selectAll('.rect')
            .data(this.dataManager.data)
            .enter()
            .append('rect')
            .attr('class', 'rect')//gpt: 给每个矩形添加类名 rect 否则无法在后续操作中选择到它们
            .attr('x', (d, i)=>{
                return i * (rectWidth + rectSpace);
            }
            )
            .attr('y', this.margin.top - 20)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', d=> colorScale(d.total_rate))//gpt code: use colorScale to set the color
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)//平移
            .attr('stroke', 'black')//边框颜色
            .attr('stroke-width', 1)//边框宽度
            .on('mouseover', (event, d) => {
                this.tooltip.html(`Tensor Name: ${d.filename}<br>Tensor Size: ${d.shape[0]}<br>Tensor Rate: ${d.total_rate.toFixed(4)}`)
                    .style('visibility', 'visible');
                    console.log(d.filename);//test
            })
            .on('mousemove', (event, d) => {
                this.tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
                    console.log('mousemove');//test
            })//鼠标移动时tooltip跟随鼠标
            .on('mouseout', (event, d) => {
                this.tooltip.style('visibility', 'hidden');
                console.log('mouseout');//test
            })//鼠标移出时tooltip隐藏
            .on('click', (event, d) => {
                this.svg.selectAll('.rect')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);

                d3.select(event.currentTarget)
                    .attr('stroke', 'red')
                    .attr('stroke-width', 2);
                publish('overview_click', d);

                console.log('clicked! rate_list:', d.rate_list);//test
            });
    }

    update(msg, data)
    {
        this.dataManager.update(data);// data come back
        this.draw();
    }
    
}
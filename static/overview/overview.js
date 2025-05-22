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
        this.svg = d3.select('#overview_svg')
                    .append('svg')
                    .attr('width', this.width)
                    .attr('height', this.height)
                    .append('g');
        
        //update margin value
        this.margin.left = 50;
        this.margin.top = 50;

        this.tooltip = this.svg
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')//绝对定位 用于确定tooltip的位置
            .style('visibility', 'hidden')//设置tooltip的可见性 默认不显示 需要的时候再显示
            .style('background', 'white')//背景颜色
            .style('border', '1px solid black')
            .style('padding', '5px')//内边距
            .style('border-radius', '5px')//圆角
            .style('font-size', '12px')
            .style('pointer-events', 'none');//GPT: 禁止鼠标事件作用于 tooltip 本身。这样鼠标移到 tooltip 上时不会触发其他事件（如 tooltip 消失），避免干扰。

        
    }   

    draw(){
      
        this.init();

        //gpt's code: reinitialization
        this.svg.selectAll('*').remove();

        const text = 'Here shows the overview of the tensors, each block represents the difference between the corresponding tensors in the two checkpoints. Click the blocks to see the details of the tensors.';
        overview_view.WrapText(text, this.margin.left - 20, this.margin.top - 20, this.width - this.margin.left - this.margin.right, 1.2);
        const data = this.dataManager.data;
        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['#ffffff', '#87cefa']);
        this.svg.append('g').selectAll('.rect')
            .data(this.dataManager.data)
            .enter()
            .append('rect')
            .attr('x', (d, i)=>{
                return i * 30;
            }
            )
            .attr('y', this.margin.top - 20)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', d=> colorScale(d.total_rate))//gpt code: use colorScale to set the color
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)//平移
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
            });//鼠标移出时tooltip隐藏

    }

    update(msg, data)
    {
        this.dataManager.update(data);// data come back
        this.draw();
    }

}
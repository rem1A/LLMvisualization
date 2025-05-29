// import { BasicView } from '../utils/basicview.js';

class DetailView extends BasicView
{

    constructor(container) 
    {
        super(container);
        this.dataManager = new DetailViewData(); // Placeholder for data manager
        subscribe('overview_click', this.update.bind(this)); // Subscribe to overview click event
        
    }
    
    init()
    {
        super.init();

        this.margin.left = 50;
        this.margin.top = 50;

        if(!this.svg){
            this.svg = d3.select('#detailview_svg')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g');
        }

        this.svg.selectAll('*').remove(); // 清空 svg 

        this.tooltip = d3.select('#detailview_svg')
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
    }

    draw()
    {
        this.init();
        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['#ffffff', '#87cefa']);

        const rectWidth = 20;
        const rectHeight = 20;
        const rectSpace = 5;

        const data_object = this.dataManager.data[0];
        
        this.svg.append('g').selectAll('.rect')
            .data(data_object.rate_list)
            .enter()
            .append('rect')
            .attr('class', 'rect')
            .attr('x', (d, i)=>{
                return i * (rectWidth + rectSpace);
            })
            .attr('y', this.margin.top - 20)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', (d) => {
                return colorScale(d);
            })
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .on('mouseover', (event, d) => {
                this.tooltip.html(`Chunk Size: ${data_object.chunk_size}<br>Chunk Rate: ${d.toFixed(6)}`)
                    .style('visibility', 'visible');
            })
            .on('mousemove', (event, d) => {
                this.tooltip.style('top', (event.pageY + 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
                    console.log('mousemove');//test
            })//鼠标移动时tooltip跟随鼠标
            .on('mouseout', () => {
                this.tooltip.style('visibility', 'hidden');
            }); // 鼠标移出时隐藏tooltip




    }

    update(msg, data)
    {
        this.dataManager.update([data]);//If data is an object, wrap it in an array. Because .data(this.dataManager.data) expects an array.
        this.draw();
    }
}
// import { BasicView } from '../utils/basicview.js';
// import { OverviewData } from './overviewData.js';
// import { subscribe } from '../utils/pubsubscribe.js';
class Overview extends BasicView
{
    constructor(container)
    {
        super(container);

        this.dataManager = new OverviewData();


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
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);//平移
        
        // this.svg.append('g').selectAll('.rect')
        //     .data(this.dataManager.data)
        //     .enter()
        //     .append('rect')
        //     .attr('x', (d, i)=>{
        //         return i * 5;
        //     } )
        //     .attr('y', (d, i) =>{

        //         if(i % 5 == 0)
        //             return 0;
        //         else if(i % 5 == 1)
        //             return 50;
        //         else if(i % 5 == 2)
        //             return 100;
        //         else if(i % 5 == 3)
        //             return 150;
        //         else
        //             return 200;
        //     })
        //     .attr('width', 4)
        //     .attr('height', 4)
        //     .attr('fill', 'steelblue')
        //     .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    }

    update(msg, data)
    {
        this.dataManager.update(data);// data come back
        this.draw();
    }

}
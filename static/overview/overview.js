// import { BasicView } from '../utils/basicview.js';
// import { OverviewData } from './overviewData.js';
// import { subscribe } from '../utils/pubsubscribe.js';
class Overview extends BasicView
{
    constructor(container)
    {
        super(container);

        this.dataManager = new OverviewData();


        subscribe('data', this.update.bind(this));
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
        this.margin.top = 130;

    }

    draw(){
      
        this.init();
        this.svg.append('g').selectAll('.rect')
            .data(this.dataManager.data)
            .enter()
            .append('rect')
            .attr('x', (d, i)=>{
                return i * 5;
            } )
            .attr('y', (d, i) =>{

                if(i % 5 == 0)
                    return 0;
                else if(i % 5 == 1)
                    return 50;
                else if(i % 5 == 2)
                    return 100;
                else if(i % 5 == 3)
                    return 150;
                else
                    return 200;
            })
            .attr('width', 4)
            .attr('height', 4)
            .attr('fill', 'steelblue')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    }

    update(msg, data)
    {
        this.dataManager.update(data);// data come back
        this.draw();
    }

}
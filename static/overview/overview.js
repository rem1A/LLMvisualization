class Overview extends BasicView
{
    constructor(container)
    {
        super(container);

        this.dataManager = new OverviewData();

        
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
      
    }

}
// import { BasicView } from '../utils/basicview.js';

class DetailView extends BasicView
{

    constructor(container) 
    {
        super(container);
        this.dataManager = new DetailViewData(); // Placeholder for data manager
        this.dataList = []; // 存放最多两个 data 对象
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

    wrapRects(firstX, firstY, rectWidth, rectHeight, rectSpace) {
        let pairs = [];
        const columns = 8;
        for (let i = 0; i < 64; i++) {
            let x = firstX + (i % columns) * (rectWidth + rectSpace);
            let y = firstY + Math.floor(i / columns) * (rectHeight + rectSpace);
            pairs.push({ x, y });
        }
        return pairs;
    }

    truncate(num, digits) {
        const factor = Math.pow(10, digits);
        return Math.floor(num * factor) / factor;
    }

    drawColorBar(colorbarX, colorbarY, colorbarWidth, colorbarHeight)
    {
        const defs = this.svg.append("defs");

        const gradient = defs.append("linearGradient")
            .attr("id", "colorbar-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffff");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#87cefa");

        // draw colorbar rectangle
        this.svg.append("rect")
            .attr("x", colorbarX)
            .attr("y", colorbarY)
            .attr("width", colorbarWidth)
            .attr("height", colorbarHeight)
            .style("fill", "url(#colorbar-gradient)")
            .attr("stroke", "black");

        // add text labels for min and max values
        this.svg.append("text")
            .attr("x", colorbarX)
            .attr("y", colorbarY + 35)
            .attr("font-size", "12px")
            .text("0.0");

        this.svg.append("text")
            .attr("x", colorbarX + colorbarWidth - 20)
            .attr("y", colorbarY + 35)
            .attr("font-size", "12px")
            .text("1.0");

        this.svg.append("text")
            .attr("x", colorbarX)
            .attr("y", colorbarY - 10)
            .attr("font-size", "12px")
            .text("Chunk Rate Color Scale");
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

        //color bar parameters
        const colorbarX = this.margin.left;
        const colorbarY = this.margin.top - 15;
        const colorbarWidth = 240;
        const colorbarHeight = 20;
        this.drawColorBar(colorbarX, colorbarY, colorbarWidth, colorbarHeight);
 
        //add text description
        // let testText = 'Test text';
        // this.wrapText(testText, colorbarX + 220, colorbarY, this.width - this.margin.left - this.margin.right, 1.2);

        //threshold setting
        //X, Y of the first rectangle
        const baseX = this.margin.left - 20;
        const baseY = this.margin.top + 50;

        this.dataList.forEach((dataObject, idx) => {
            const offsetGrid = idx * 380; // 每个图之间间隔
            const offsetScatter = 400; // 散点图和矩阵图的间隔
            const rectLocs = this.wrapRects(baseX, baseY + offsetGrid, rectWidth, rectHeight, rectSpace);
            this.drawRects(dataObject, rectLocs, rectWidth, rectHeight, colorScale);
            this.svg.append('text')
                .attr('x', baseX)
                .attr('y', baseY + offsetGrid)
                .attr('font-size', '14px')
                .text(dataObject.filename);
            this.drawScatterPlot(dataObject, rectLocs[0].x + offsetScatter, rectLocs[0].y - 50, dataObject.threshold);
        });       
    }
    // GPT: 绘制分布曲线
    // d3.scaleLinear()
    // 创建一个线性比例尺，也就是输入输出成线性映射关系。
    //  .domain(d3.extent(scatter_plot_data, d => d.x))
	// •	domain 是输入值的范围（也叫数据空间）。
	// •	d3.extent() 会自动计算数组中 d.x 的最小值和最大值：
    // drawScatterPlot(data_object, positionX, positionY, threshold) {
    //     console.log('ScatterPlot positionX/Y:', positionX, positionY);
    //     const width = 350;
    //     const height = 300;
    //     const xScale = d3.scaleLinear()
    //         .domain(d3.extent(data_object.scatter_plot_data, d => d.x))
    //         .range([positionX, positionX + width]);
    //     const yScale = d3.scaleLinear()
    //         .domain(d3.extent(data_object.scatter_plot_data, d => d.y))
    //         .range([positionY + height, positionY]);

    //     // 绘制 X 轴
    //     this.svg.append('g')
    //         .attr('class', 'x-axis')
    //         .attr('transform', `translate(0, ${positionY + height})`)
    //         .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format(".1e")));
    //     // 绘制 Y 轴
    //     this.svg.append('g')
    //         .attr('class', 'y-axis')
    //         .attr('transform', `translate(${positionX}, 0)`)
    //         .call(d3.axisLeft(yScale).ticks(10));
    //     this.svg.selectAll('.dot')
    //         .data(data_object.scatter_plot_data)
    //         .enter()
    //         .append('circle')
    //         .attr('class', 'dot')
    //         .attr('cx', d => xScale(d.x))
    //         .attr('cy', d => yScale(d.y))
    //         .attr('r', d => {
    //             if (this.truncate(Math.abs(d.x), 6) >= threshold) {
    //                 return 5; // 大于阈值的点半径为5
    //             } else {
    //                 return 3; // 小于阈值的点半径为3
    //             }
    //         })
    //         .attr('fill', d => {
    //             if (this.truncate(Math.abs(d.x), 6) >= threshold) {
    //                 return 'red'; 
    //             }
    //             else {
    //                 return 'blue'; 
    //             }
                
    //         })
    //         .on('mouseover', (event, d) => {
    //             this.tooltip.html(`X: ${d.x.toFixed(6)}<br>Y: ${d.y.toFixed(0)}`)
    //                 .style('visibility', 'visible');
    //         })
    //         .on('mousemove', (event, d) => {
    //             this.tooltip.style('top', (event.pageY - this.height / 3 - 10) + 'px')
    //                 .style('left', (event.pageX + 10) + 'px');
    //         })
    //         .on('mouseout', () => {
    //             this.tooltip.style('visibility', 'hidden');
    //         });
    // }
    drawScatterPlot(data_object, positionX, positionY, threshold) {
        const width = 350;
        const height = 300;

        // 用文件名创建唯一 class 名
        const safeClassName = data_object.filename.replace(/[^\w-]/g, '');

        // 为每个 scatter plot 创建独立 <g> IMPORTANT！
        const group = this.svg.append('g')
            .attr('class', `scatter-group-${safeClassName}`);

        const xExtent = d3.extent(data_object.scatter_plot_data, d => d.x);
        const yExtent = d3.extent(data_object.scatter_plot_data, d => d.y);

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([positionX, positionX + width]);

        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([positionY + height, positionY]);

        // 绘制 X 轴
        group.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${positionY + height})`)
            .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format(".1e")));

        // 绘制 Y 轴
        group.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${positionX}, 0)`)
            .call(d3.axisLeft(yScale).ticks(10));

        // 绘制散点
        group.selectAll('circle')
            .data(data_object.scatter_plot_data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', d => Math.abs(d.x) >= threshold ? 4 : 3)
            .attr('fill', d => Math.abs(d.x) >= threshold ? 'red' : 'blue')
            .on('mouseover', (event, d) => {
                this.tooltip
                    .html(`X: ${d.x.toFixed(6)}<br>Y: ${d.y.toFixed(0)}`)
                    .style('visibility', 'visible');
            })
            .on('mousemove', (event) => {
                const scrollTop = document.getElementById('detailview_svg').scrollTop;
                this.tooltip
                    .style('top', (event.clientY + scrollTop + 10) + 'px')
                    .style('left', (event.clientX + 10) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.style('visibility', 'hidden');
            });
    }
    drawRects(data_object, pair, rectWidth, rectHeight, colorScale) {
        this.svg.append('g').selectAll('.rect')
            .data(data_object.rate_list)
            .enter()
            .append('rect')
            .attr('class', 'rect')
            .attr('x', (d, i) => {
                return pair[i].x;
            })
            .attr('y', (d, i) => {
                return pair[i].y;
            })
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', (d) => {
                return colorScale(d);
            })
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .attr('stroke', 'black') // 矩形边框颜色
            .attr('stroke-width', 1) // 矩形边框宽度
            .on('mouseover', (event, d) => {
                this.tooltip.html(`Chunk Size: ${data_object.chunk_size}<br>Chunk Rate: ${d.toFixed(6)}`)
                    .style('visibility', 'visible');
            })
            .on('mousemove', (event, d) => {
                // this.tooltip.style('top', (event.pageY - this.height / 3 - 10) + 'px')
                this.tooltip.style('top', (event.pageY - (this.height - 400)/ 3) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
                console.log('mousemove'); //test
            }) //鼠标移动时tooltip跟随鼠标
            .on('mouseout', () => {
                this.tooltip.style('visibility', 'hidden');
            });
    }

    update(msg, data) {
        // 如果已经存两个，就删除最早的一个
            this.dataList.unshift(data);
        
        if (this.dataList.length > 2) {
            this.dataList.pop(); // 加入新数据
        }
        
        this.draw();
    }
}
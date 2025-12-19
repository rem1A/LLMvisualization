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
            .attr('height', 3000) 
            // .attr('height', this.height * 0.45)
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
        // document.getElementById('threshold-input').addEventListener('change', (e) => {
        // const threshold = parseFloat(e.target.value);
        // const folder_name = document.getElementById('folder-input').value.trim();
        //     if (!isNaN(threshold)) {
        //         // 发起新的数据请求，传入 threshold
        //         fetch_data({ folder: folder_name, threshold: threshold });
        //     }
        // });
        // document.getElementById('folder-input').addEventListener('change', (e) => {
        // const folder_name = e.target.value.trim();
        // const threshold = parseFloat(document.getElementById('threshold-input').value);
        //     if (!isNaN(threshold)) {
        //         // 发起新的数据请求，传入 threshold
        //         fetch_data({ folder: folder_name, threshold: threshold });
        //     }
        // });

        document.getElementById('overview-confirm-btn').addEventListener('click', () => {
            const folder_name = document.getElementById('folder-input').value.trim();
            const threshold = parseFloat(document.getElementById('threshold-input').value);
            if (!isNaN(threshold)) {
                // 发起新的数据请求，传入 folder_name 和 threshold
                fetch_data({ folder: folder_name, threshold: threshold });
            }
        });
    }   

    WrapRects(dataList, firstX, firstY, rectWidth, rectHeight, rectSpace) {
        console.log("[DEBUG] WrapRects: 输入 dataList.length =", dataList.length);
        const rectLocs = [];
        let currentX = firstX;
        let currentY = firstY;
        let prevLayerNum = null;

        for (let i = 0; i < dataList.length; i++) {
            const filename = dataList[i].filename;
            const match = filename.match(/\d+/);
            const currentLayerNum = match ? parseInt(match[0]) : -1;

            if (currentLayerNum !== prevLayerNum) {
                // 新的一列
                if (prevLayerNum !== null) {
                    currentX += rectWidth + rectSpace; // 向右移动一列
                }
                currentY = firstY; // 新列，从顶部开始
                prevLayerNum = currentLayerNum;
            } else {
                // 同一列，向下排
                currentY += rectHeight + rectSpace;
            }

            rectLocs.push({ x: currentX, y: currentY });
        }

        return rectLocs;
    }
    draw(){

        this.init();

        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['#ffffff', '#87cefa']);

        const rectWidth = 20;
        const rectHeight = 20;
        const rectSpace = 5;
        const firstX = this.margin.left + 330;
        const firstY = this.margin.top + 30;
        const rectLocs = this.WrapRects(this.dataManager.data, firstX, firstY, rectWidth, rectHeight, rectSpace);
        const colorbarWidth = 240;
        const colorbarHeight = 20;  
        this.drawColorBar(this.margin.left, this.margin.top - 20, colorbarWidth, colorbarHeight);
        this.drawRects(this.dataManager.data, rectLocs, rectWidth, rectHeight, colorScale);
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

    //pairs: [{x: 0, y: 0}, {x: 20, y: 20}, ...] labels的位置
    drawLabels(dataList, pairs, rectWidth, rectHeight) {
        this.drawFileNameLables(dataList, pairs, rectWidth, rectHeight);
        this.drawIndexLabels(dataList, pairs, rectWidth, rectHeight);
    }
    
    drawFileNameLables(dataList, pairs, rectWidth, rectHeight) {
        this.svg.selectAll('.filename-label').remove(); // 清除之前的标签
        for (let i = 0; i < dataList.length; i++) {
            const pair = pairs[i];
            const label = dataList[i].filename.replace(/\d+/g, '*LayerNumber*'); // 替换数字部分为 LayerNumber
            this.svg.append('text')
                .attr('class', 'filename-label')
                .attr('x', pair.x - 380 + rectWidth / 2) // 矩形中心位置
                .attr('y', pair.y + 5 + rectHeight / 2) // 矩形下方
                .attr('text-anchor', 'right ') // 
                .attr('font-size', '12px') // 字体大小
                .text(label) // 显示文件名
                .on('click', (event, d) => {
                    const filename = dataList[i].filename.replace(/\d+/g, '*LayerNumber*'); // 替换数字部分为 LayerNumber
                    const selector = `[data-filename="${filename}"]`;
                    d3.selectAll(selector)
                        .each(function () {
                            const el = d3.select(this);
                            const visible = Number(el.attr('data-RowVisible'));  // 转成数字
                            const newVisible = -visible;  // 1 -> -1, -1 -> 1
                            el.attr('data-RowVisible', newVisible);  // 更新属性
                            el.style('display', newVisible === 1 ? 'block' : 'none');  // 控制显示
                        });
                }); // 点击标签时，切换对应矩形的显示状态

            //如果下一个文件名的数字部分与当前文件名的数字部分不同，则停止绘制标签
            const currentMatch = dataList[i].filename.match(/\d+/);
            const nextMatch = dataList[i + 1].filename.match(/\d+/);
            if (currentMatch && nextMatch && currentMatch[0] !== nextMatch[0]) {
                break;
            }
        }
    }

    drawIndexLabels(dataList, pairs, rectWidth, rectHeight) {
        this.svg.selectAll('.index-label').remove(); // 清除之前的索引标签
        const labelLocation = [];
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i].y == pairs[0].y) { // 确保不重复绘制同一列的标签
                labelLocation.push({ x: pairs[i].x + rectWidth / 2, y: pairs[i].y - 5})
                } 
        }
        this.svg.append('g').selectAll('.index-label')
            .data(labelLocation)
            .enter()
            .append('text')
            .attr('class', 'index-label')
            .attr('x', d => d.x) // 使用 pair 数组中的 x 坐标
            .attr('y', d => d.y) // 使用 pair 数组中的 y 坐标
            .attr('text-anchor', 'middle') // 文本居中
            .attr('font-size', '16px') // 字体大小
            .text((d, i) => i) // 显示索引，从 0 开始
            .on('click', (event, d) => { 
                // 点击索引标签时，切换对应矩形的显示状态
                const layerNumber = parseInt(event.target.textContent);
                const selector = `[data-layernumber="${layerNumber}"]`; // 使用 data-layernumber 属性选择
                d3.selectAll(selector)
                    .each(function () {
                        const el = d3.select(this);
                        const visible = Number(el.attr('data-ColVisible'));  // 转成数字
                        const newVisible = -visible;  // 1 -> -1, -1 -> 1
                        el.attr('data-ColVisible', newVisible);  // 更新属性
                        el.style('display', newVisible === 1 ? 'block' : 'none');  // 控制显示
                    });
            }); // 点击索引标签时，切换所有矩形的显示状态
    }
    drawRects(dataList, pairs, rectWidth, rectHeight, colorScale) {
        this.svg.selectAll('.rect').remove(); // 清除之前的矩形
        this.svg.append('g').selectAll('.rect')
            .data(dataList)
            .enter()
            .append('rect')
            .attr('class', 'rect') //gpt: 给每个矩形添加类名 rect 否则无法在后续操作中选择到它们
            .attr('data-filename', d =>{
                const filename = d.filename.replace(/\d+/g, '*LayerNumber*'); // 替换数字部分为 LayerNumber
                return filename; 
            })
            .attr('data-layernumber', d => {
                const match = d.filename.match(/\d+/);
                return match ? match[0] : 'unknown'; // 返回数字部分或 'unknown'
            })
            .attr('data-RowVisible', 1)
            .attr('data-ColVisible', 1) // 添加 data-ColVisible 属性，初始值为 1
            .style('display', 'block') // 默认显示所有矩形
            .attr('x', (d, i) => {
                
                return pairs[i].x; // 使用 pair 数组中的 x 坐标
            }
            )
            .attr('y', (d, i) => {
                return pairs[i].y; // 使用 pair 数组中的 y 坐标
            })
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', d => colorScale(d.total_rate)) //gpt code: use colorScale to set the color
            // .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`) //平移
            .attr('stroke', 'black') //边框颜色
            .attr('stroke-width', 1) //边框宽度
            .on('mouseover', (event, d) => {
                this.tooltip.html(`Tensor Name: ${d.filename}<br>Tensor Shape: ${d.shape}<br>Threshold: ${d.threshold}<br>Tensor Rate: ${d.total_rate.toFixed(4)}<br>Max value: ${d.max.toFixed(6)}<br>Average value: ${d.average.toFixed(6)}`)
                    .style('visibility', 'visible');
                console.log(d.filename); //test
            })
            .on('mousemove', (event) => {
                this.tooltip.style('top', (event.pageY - 20) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
                console.log('mousemove'); //test
            }) //鼠标移动时tooltip跟随鼠标
            .on('mouseout', (event, d) => {
                this.tooltip.style('visibility', 'hidden');
                console.log('mouseout'); //test
            }) //鼠标移出时tooltip隐藏
            .on('click', (event, d) => {
                this.svg.selectAll('.rect')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);

                d3.select(event.currentTarget)
                    .attr('stroke', 'red')
                    .attr('stroke-width', 2);
                publish('overview_click', d);

                console.log('clicked! rate_list:', d.rate_list);
            });
    }

    update(msg, input_data) {
        //GPT code: 对文件名排序
        const sortedData = [...input_data.data].sort((a, b) => {
            return a.filename.localeCompare(b.filename, undefined, { numeric: true });
        });
        this.dataManager.update(sortedData);
        this.draw();
    }
}
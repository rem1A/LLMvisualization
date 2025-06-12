class BasicView {

    constructor(container) {
      this.container = container;
      d3.select(this.container.getElement()[0]).style("overflow", "auto");
    }
  
    init() {
      this.width = this.container.getElement().width() + 400;
      this.height = this.container.getElement().height() + 400;
      this.margin = {
        "left": 20,
        "right": 20,
        "top": 20,
        "bottom": 20
      };
    }
    WrapText(text, x, y, maxWidth, lineHeight) {
        var words = text.split(" ");
        let line = [];
        const textElement = this.svg.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("font-size", "18px")
            .attr("fill", "black")
            .attr("font-family", "Arial");
        let tspan = textElement.append("tspan")
            .attr("x", x)
            .attr("dy", '0em');
        for (let i = 0; i < words.length; i++) {
            line.push(words[i]);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > maxWidth) {
                line.pop();//remove the last word
                tspan.text(line.join(" "));//restore the line
                line = [words[i]];
                tspan = textElement.append("tspan")
                    .attr("x", x)
                    .attr("dy", lineHeight + 'em')
                    .text(words[i]);
            }
        }
    }
  }
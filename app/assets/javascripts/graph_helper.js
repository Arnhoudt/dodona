import * as d3 from "d3";

function formatTitle(selection, width, exMap) {
    selection.each((datum, i, nodeList) => {
        const text = d3.select(nodeList[i]);
        const words = exMap[datum].split(" ").reverse();
        const padding = 5;
        let word = "";
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null)
            .append("tspan")
            .attr("x", -padding)
            .attr("y", y)
            .attr("dy", `${dy}em`);
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width-padding) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", -padding)
                    .attr("y", y)
                    .attr("dy", `${++lineNumber*lineHeight+dy}em`)
                    .text(word)
                    .attr("text-anchor", "end");
            }
        }
        const tSpans = text.selectAll("tspan");
        const breaks = tSpans.size();
        tSpans.attr("y", -7*(breaks-1)); // should change when changing font size
    });
}

export { formatTitle };

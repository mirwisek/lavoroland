
export function drawHistogramPlot(dataFile, containerId, chartWidth = 300, chartHeight = 100) {
    // set the dimensions and margins of the graph
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = chartWidth - margin.left - margin.right,
        height = chartHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select(containerId)
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // get the data
    d3.csv(dataFile, d => ({
        country: d.country,
        avgPrice: +d.average_price
    })).then( data => {


    // Get the min and max avgPrice values
    const [minAvgPrice, maxAvgPrice] = d3.extent(data, d => d.avgPrice);


        data.sort((a, b) => a.avgPrice - b.avgPrice);
        
        // X axis: scale and draw
        var x = d3.scaleBand()
            .range([0, width])
            .domain(data.map(function(d) { return d.country; })) // Assuming 'country' is the identifier
            .padding(0.1);
            

        // Y axis: scale and draw
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d.avgPrice; })])
            .range([height, 0]);

        const defaultSelection = x.range()


        // Append the bar rectangles to the svg element
        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.country); })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return y(d.avgPrice); })
            .attr("height", function(d) { return height - y(d.avgPrice); })
            .style("fill", "#3e84f5"); // tailwind blue 500

        // RANGE SLIDER

        const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        // .on("brush end", brushed)    // Brush gets called while it is still brushing, we need to wait until it's done
        .on("end", brushended); // Thus we call at the end

        const gb = svg.append("g")
        .attr("class", "brush-" + containerId.replace("#", ""))
        .call(brush)
        // .call(brush.move, defaultSelection);

        function scaleBandInvert(scale) {
            var domain = scale.domain();
            var paddingOuter = scale(domain[0]);
            var eachBand = scale.step();
            return function (value) {
                var index = Math.floor(((value - paddingOuter) / eachBand));
                return domain[Math.max(0,Math.min(index, domain.length-1))];
            }
        }

        function brushed(event) {
            const selection = event.selection;
            if (selection) {
                // Convert pixel values to data values
                // selectedRange = [start, end]
                const selectedRange = selection.map(scaleBandInvert(x));
                // console.log("Selected range: ", selectedRange);
                let values = []
                data.forEach(d => {
                    if (selectedRange.includes(d.country)) {
                        values.push(d.avgPrice);
                    }
                });

                const target = d3.select(containerId)

                // console.log(values)
                // parentSvg.property("values", values);
                // console.log(parentSvg);  // Print the svg element
                // // console.log(parentSvg.node());  // Print the actual DOM node
                // console.log("Tag Name:", parentSvg.node().tagName);  // Print the tag name of the svg element
                // console.log("ID:", parentSvg.attr("id"));  // Print the ID of the svg element
                // console.log("Classes:", parentSvg.attr("class"));  // Print the classes applied to the svg element

                target.attr("data-brushed", values);
                target.dispatch("input");  // Dispatch the event

            }
        }

        const target = d3.select(containerId)

        function brushended({selection}) {
            // If the user made a selection
            if(selection) {
                const selectedRange = selection.map(scaleBandInvert(x));
                // console.log("Selected range: ", selectedRange);
                let values = []
                data.forEach(d => {
                    if (selectedRange.includes(d.country)) {
                        values.push(d.avgPrice);
                    }
                });
                target.attr("data-brushed", values);

            } else {    // If the selection was cancelled
                // console.log("Resetting brush");
                // gb.call(brush.move, defaultSelection);
                // The defautl is needed for first time
                target.attr("data-brushed", [minAvgPrice, maxAvgPrice]);    // Send the extreme values on reset
                target.attr("data-default", [minAvgPrice, maxAvgPrice]);    // Send the extreme values on reset
            }
            target.dispatch("input");
        }

        brushended(false) // Reset the brush

        target.on('reset', function() {
            var brushElement = d3.select(".brush-" + containerId.replace("#", ""));
            brush.move(brushElement, null)
        });

        // Add interactive hints

        // Append a vertical line to the chart
        var verticalLine = svg.append("line")
            .attr("opacity", 0) // Initially hidden
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        // Append a tooltip div to the body
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // target.on("mousemove.tooltip", function(event) {
        //     console.log("Mouse move event");
        //     var x0 = d3.pointer(event, this)[0]; // Get the x position of the cursor
        //     var y0 = d3.pointer(event, this)[1]; // Get the y position of the cursor
            
        //     // Update the vertical line position
        //     verticalLine.attr("opacity", 1)
        //         .attr("transform", `translate(${x0},0)`);
    
        //     // Get the corresponding y value for the x position
        //     var yValue = 30
    
        //     // Update the tooltip content and position
        //     tooltip.html("Value: " + yValue)
        //         .style("opacity", 1)
        //         .style("left", (x0 > width / 2 ? (event.pageX - 100) : (event.pageX + 10)) + "px")
        //         .style("top", (event.pageY - 28) + "px");
        // })
        // .on("mouseout.tooltip", function() {
        //     // Hide the line and tooltip when not hovering
        //     verticalLine.attr("opacity", 0);
        //     tooltip.style("opacity", 0);
        // });

    }).catch(error => {
        console.error("Error:", error);
    });
}


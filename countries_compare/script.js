// Parse the Data
// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 130, left: 50},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

var data_link = "https://raw.githubusercontent.com/SYusupov/DecisionModelling_CS/main/insurance_proportion.csv"

d3.csv(data_link, function(data) {

    var filteredData = data.filter(function(d) 
    { 

            if( (d["name"] == "Germany") || (d["name"]=="France"))
            { 
                return d;
            } 

    })

    var subgroups = data.columns.slice(1)
    createMarimekkoChart(filteredData, subgroups)

    // Get unique country names
    var uniqueNames = d3.map(data, function(d) {
        return d.name;
      }).keys();

    // Populate the dropdown menus with country options
    var select1 = document.getElementById("country1");
    var select2 = document.getElementById("country2");

    for(i = 0; i < uniqueNames.length; i++) {
        var opt = uniqueNames[i];

        var el1 = document.createElement("option");
        el1.textContent = opt;
        el1.value = opt;
        select1.appendChild(el1);

        var el2 = document.createElement("option");
        el2.textContent = opt;
        el2.value = opt;
        select2.appendChild(el2);
    }
})

function updateChart(data) {

    d3.csv(data_link, function(data) {    
    
        var c1 = document.getElementById("country1");
        var c2 = document.getElementById("country2");
        var c1_txt = c1.options[c1.selectedIndex].text;
        var c2_txt = c2.options[c2.selectedIndex].text;

        // Clear existing chart
        d3.select("#my_dataviz").selectAll("*").remove();

        // Filter the data for selected countries
        var filteredData = data.filter(function(d) 
        { 

                if( (d["name"] == c1_txt) || (d["name"]==c2_txt))
                { 
                    return d;
                } 

        })

        var subgroups = data.columns.slice(1)
        createMarimekkoChart(filteredData, subgroups)
    });
}

const createMarimekkoChart = (filteredData, subgroups) => {

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    // List of subgroups = header of the csv files = soil condition here
    // var subgroups = filteredData.columns.slice(1)

    // List of groups = species here = value of the first column called group -> I show them on the X axis
    var groups = d3.map(filteredData, function(d){return(d.name)}).keys()
    
    // Add X axis
    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2])
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([ height, 0 ]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Adding Y axis label
    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("% of insurance cost");

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#003049','#D62828','#F77F00', 'FCBF49', 'EAE2B7'])
        
    // Normalize the data -> sum of each group must be 100!
    filteredDataNormalized = []
    filteredData.forEach(function(d){
        // Compute the total
        tot = 0
        for (i in subgroups){ name=subgroups[i] ; tot += +d[name] }
        // Now normalize
        for (i in subgroups){ name=subgroups[i] ; d[name] = d[name] / tot * 100}
    })

    subgroups1 = ["others", "by_public", "private", "by_employer"];

    // Add one dot in the legend for each name.
    svg.selectAll("mydots")
    .data(subgroups1)
    .enter()
    .append("circle")
    .attr("cx", 10)
    .attr("cy", function(d,i){ return 280 + i*20}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("r", 7)
    .style("fill", function(d){ return color(d)})

    // console.log("subgroups", subgroups)

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
    .data(subgroups1)
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", function(d,i){ return 280 + i*20}) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function(d){ return color(d)})
    .text(function(d){ return d})
    .attr("text-anchor", "left")
    .style("font-size", "12px")
    .style("alignment-baseline", "middle")
    
    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
        .keys(subgroups)
        (filteredData)

    // Show the bars
    svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter().append("g")
        .attr("fill", function(d) { return color(d.key); })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d) { return d; })
        .enter().append("rect")
            .attr("x", function(d) { return x(d.data.name); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width",x.bandwidth())
}
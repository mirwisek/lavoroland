// Parse the Data
// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 20, left: 50},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

d3.csv("https://raw.githubusercontent.com/SYusupov/DecisionModelling_CS/main/insurance_proportion_all.csv", function(data) {

    // console.log("here", data)
    var filteredData = data.filter(function(d) 
    { 

            if( (d["name"] == "Germany") || (d["name"]=="France"))
            { 
                return d;
            } 

        })
    // header = data.columns;
    // var filteredData = [header].concat(filteredData);
    // console.log('filteredData', filteredData.name)
    var subgroups = data.columns.slice(1)
    createMarimekkoChart(filteredData, subgroups)

    // // Get unique country pairs
    // const countryPairs = data.flatMap(d => data.map(e => [d.country, e.country]))
    //                         .filter(pair => pair[0] !== pair[1]);
    // console.log(countryPairs)

    // // Populate the dropdown menu with options
    // const select = d3.select("#countryPairs");

    // select.selectAll("option")
    //     .data(countryPairs)
    //     .enter()
    //     .append("option")
    //     .text(pair => `${pair[0]} - ${pair[1]}`)
    //     .attr("value", pair => pair.join(',')); // Combine pairs into a single value

    // // Listen for changes in the dropdown menu
    // select.on("change", function() {
    //     const selectedCountries = Array.from(this.selectedOptions, option => option.value.split(','));
    //     updateChart(selectedCountries, data);
    // });
    })

function updateChart(selectedCountries, data) {
    // Clear existing chart
    d3.select("#my_dataviz").selectAll("*").remove();

    // Filter the data for selected countries
    const filteredData = data.filter(d => selectedCountries.flat().includes(d.name));
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

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#e41a1c','#377eb8','#4daf4a'])
        
    // Normalize the data -> sum of each group must be 100!
    // console.log(data)
    filteredDataNormalized = []
    filteredData.forEach(function(d){
        // Compute the total
        tot = 0
        for (i in subgroups){ name=subgroups[i] ; tot += +d[name] }
        // Now normalize
        for (i in subgroups){ name=subgroups[i] ; d[name] = d[name] / tot * 100}
    })
    console.log('here',filteredData[0].name)
    console.log(subgroups)
    
    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
        .keys(subgroups)
        (filteredData)

        console.log("Number of groups:", stackedData.length);
        console.log("Number of bars in the first group:", stackedData[1].length)

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
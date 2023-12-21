let pricesMap = new Map();
let indicesMap = new Map();
let countriesData = [];
let minInputSalary, maxInputSalary, minInputRent, maxInputRent;

// Function to initialize the grid of countries
async function initCountryGrid() {
    try {
        // Load CSV files
        const [countriesData, pricesData, indicesData] = await Promise.all([
            d3.csv("./data/countries.csv"),
            d3.csv("./data/country_prices.csv"),
            d3.csv("./data/country_indices.csv")
        ]);

        // Map prices data to country names for easy lookup
        pricesData.forEach(d => {
            if (!pricesMap.has(d.country)) pricesMap.set(d.country, {});
            pricesMap.get(d.country)[d.item_name] = d.average_price;
        });

        // Map indices data to country names for easy lookup
        indicesData.forEach(d => {
            indicesMap.set(d.country, d);
        });

        // Create initial grid with countries
        createCountryGrid(countriesData);
    } catch (error) {
        console.error("Error loading CSV data: ", error);
    }
}

function createCountryGrid(countries) {
    const container = d3.select("#countries-grid").html("");

    countries.forEach((countryData, index) => {
        const delay = index * 50;

        const countryDiv = container.append("div")
            .datum(countryData)
            .attr("class", "country")
            .style("animation-delay", `${delay}ms`);

        const countryCircle = countryDiv.append("div")
            .attr("class", "country-circle")
            .style("background-image", `url('${countryData.flag}')`);

        countryCircle.on("mouseover", event => showTooltip(event, countryData));
        countryCircle.on("mouseout", () => hideTooltip());

        countryDiv.append("div")
            .attr("class", "country-name")
            .text(countryData.country);
        
        // sayyor's code
        countryDiv.append("input")
        .attr("type", "checkbox")
        .attr("class", "country-checkbox");
    });
}

function showTooltip(event, countryData) {
    const prices = pricesMap.get(countryData.country);
    const indices = indicesMap.get(countryData.country);
    const salary = prices ? `${parseFloat(prices["Average Monthly Net Salary (After Tax), Salaries And Financing"]).toFixed(2)}` : "N/A";
    const rent = prices ? `${parseFloat(prices["Apartment (1 bedroom) in City Centre, Rent Per Month"]).toFixed(2)}` : "N/A";
    const radarChartHtml = indices ? createRadarChart(indices) : "<div>No data available</div>";

    const tooltipHtml = `
        <div>
            <div>
                <div><strong>${countryData.country}</strong></div>
                <div class="tooltip-info">Average monthly net salary: <strong>${salary}€</strong></div>
                <div class="tooltip-info">Average monthly rent price in city center: <strong>${rent}€</strong></div>
            </div>
            <div>${radarChartHtml}</div>
        </div>
    `;

    d3.select("#tooltip")
        .style("opacity", 1)
        .html(tooltipHtml)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

// Function to create a radar chart
function createRadarChart(countryData) {
    const indices = [
        "quality_of_life_index",
        "purchasing_power_incl_rent_index",
        "rent_index",
        "health_care_index",
        "safety_index"
    ];

    const indexLabels = {
        "quality_of_life_index": "quality of life",
        "purchasing_power_incl_rent_index": "purchasing power",
        "rent_index": "rent price",
        "health_care_index": "health care",
        "safety_index": "safety"
    }

    // Reference: https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=5
    const indexColors = {
        "quality_of_life_index": "#e41a1c",
        "purchasing_power_incl_rent_index": "#377eb8",
        "rent_index": "#4daf4a",
        "health_care_index": "#984ea3",
        "safety_index": "#ff7f00"
    };

    // Dimensions and radius of the radar chart
    const width = 400, height = 200, radius = 70;
    const angleSlice = Math.PI * 2 / indices.length;

    // Create SVG element
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "auto");

    // Add group element to hold radar chart
    const radarGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create scale for the radius
    const radiusScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, radius]);

    drawGridCircles(radarGroup, radiusScale);
    drawScaleText(radarGroup, radiusScale);
    drawAxes(radarGroup, indices, radiusScale, angleSlice, indexLabels, indexColors);
    drawRadarLine(radarGroup, indices, countryData, radiusScale, angleSlice, indexColors);

    return svg.node().outerHTML;
}

function drawGridCircles(radarGroup, radiusScale) {
    radarGroup.selectAll(".grid-circle")
        .data(d3.range(0, 5))
        .enter()
        .append("circle")
        .attr("class", "grid-circle")
        .attr("r", d => radiusScale(d * 25));
}

function drawScaleText(radarGroup, radiusScale) {
    radarGroup.selectAll(".grid-scale")
        .data(d3.range(0, 5))
        .enter()
        .append("text")
        .attr("class", "grid-scale")
        .attr("x", 0)
        .attr("y", d => -radiusScale(d * 25))
        .attr("dy", "0.4em")
        .attr("text-anchor", "middle")
        .text(d => d * 25);
}

function drawAxes(radarGroup, indices, radiusScale, angleSlice, indexLabels, indexColors) {
    const axis = radarGroup.selectAll(".axis")
        .data(indices)
        .enter().append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (_, i) => radiusScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (_, i) => radiusScale(100) * Math.sin(angleSlice * i - Math.PI / 2));

    axis.append("text")
        .attr("class", "axis-label")
        .attr("x", (_, i) => radiusScale(110) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (_, i) => radiusScale(110) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => indexLabels[d])
        .style("fill", d => indexColors[d]);
}

function drawRadarLine(radarGroup, indices, countryData, radiusScale, angleSlice, indexColors) {
    // Create data structure for plotting
    const data = indices.map(key => ({
        axis: key,
        value: countryData[key]
    }));

    const lineGenerator = d3.lineRadial()
        .radius(d => radiusScale(d.value))
        .angle((_, i) => i * angleSlice)
        .curve(d3.curveCardinalClosed);

    radarGroup.append("path")
        .datum(data)
        .attr("d", lineGenerator)
        .attr("class", "radar-line");

    radarGroup.selectAll(".radar-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "radar-point")
        .attr("cx", (d, i) => radiusScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => radiusScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("r", 3)
        .style("fill", d => indexColors[d.axis]);
}

function applyFilter() {
    const minSalary = parseInt(minInputSalary.value);
    const maxSalary = parseInt(maxInputSalary.value);
    const minRent = parseInt(minInputRent.value);
    const maxRent = parseInt(maxInputRent.value);

    const countries = Array.from(d3.selectAll(".country").nodes());

    const [filteredCountries, nonFilteredCountries] = countries.reduce((acc, countryElement) => {
        const countryData = pricesMap.get(d3.select(countryElement).datum().country);
        const salary = countryData ? parseFloat(countryData["Average Monthly Net Salary (After Tax), Salaries And Financing"]) : 0;
        const rent = countryData ? parseFloat(countryData["Apartment (1 bedroom) in City Centre, Rent Per Month"]) : 0;

        const isWithinSalaryRange = salary >= minSalary && salary <= maxSalary;
        const isWithinRentRange = rent >= minRent && rent <= maxRent;

        if (isWithinSalaryRange && isWithinRentRange) {
            d3.select(countryElement).classed("grey-filter", false);
            acc[0].push(countryElement);
        } else {
            d3.select(countryElement).classed("grey-filter", true);
            acc[1].push(countryElement);
        }

        return acc;
    }, [[], []]);

    const sortCountries = (a, b) => {
        const countryA = d3.select(a).datum().country;
        const countryB = d3.select(b).datum().country;
        return countryA.localeCompare(countryB);
    };

    // Order filteredCountries and nonFilteredCountries alphabetically
    filteredCountries.sort(sortCountries);
    nonFilteredCountries.sort(sortCountries);

    // Reorder countries based on filter
    const countriesGrid = d3.select("#countries-grid").node();
    [...filteredCountries, ...nonFilteredCountries].forEach(country => {
        countriesGrid.appendChild(country);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Event listeners and slider initialization
    const minSliderSalary = document.getElementById("salary-range-min");
    const maxSliderSalary = document.getElementById("salary-range-max");
    const minSliderRent = document.getElementById("rent-range-min");
    const maxSliderRent = document.getElementById("rent-range-max");

    // Initialize input elements
    minInputSalary = document.getElementById("salary-input-min");
    maxInputSalary = document.getElementById("salary-input-max");
    minInputRent = document.getElementById("rent-input-min");
    maxInputRent = document.getElementById("rent-input-max");


    function setSliderTrack(minSlider, maxSlider, trackId) {
        const min = Math.min(parseInt(minSlider.value), parseInt(maxSlider.value));
        const max = Math.max(parseInt(minSlider.value), parseInt(maxSlider.value));
        const percentMin = (min / maxSlider.max) * 100;
        const percentMax = (max / maxSlider.max) * 100;
        const track = document.getElementById(trackId);
        track.style.background = `linear-gradient(to right, #ddd ${percentMin}% , #04339c ${percentMin}% , #04339c ${percentMax}%, #ddd ${percentMax}%)`;
    }

    // Salary Range Event Listeners
    minSliderSalary.addEventListener("input", function() {
        if (parseInt(minSliderSalary.value) > parseInt(maxSliderSalary.value)) {
            minSliderSalary.value = maxSliderSalary.value;
        }
        minInputSalary.value = minSliderSalary.value;
        setSliderTrack(minSliderSalary, maxSliderSalary, "slider-track-salary");
    });

    maxSliderSalary.addEventListener("input", function() {
        if (parseInt(maxSliderSalary.value) < parseInt(minSliderSalary.value)) {
            maxSliderSalary.value = minSliderSalary.value;
        }
        maxInputSalary.value = maxSliderSalary.value;
        setSliderTrack(minSliderSalary, maxSliderSalary, "slider-track-salary");
    });

    // Rent Range Event Listeners
    minSliderRent.addEventListener("input", function() {
        if (parseInt(minSliderRent.value) > parseInt(maxSliderRent.value)) {
            minSliderRent.value = maxSliderRent.value;
        }
        minInputRent.value = minSliderRent.value;
        setSliderTrack(minSliderRent, maxSliderRent, "slider-track-rent");
    });

    maxSliderRent.addEventListener("input", function() {
        if (parseInt(maxSliderRent.value) < parseInt(minSliderRent.value)) {
            maxSliderRent.value = minSliderRent.value;
        }
        maxInputRent.value = maxSliderRent.value;
        setSliderTrack(minSliderRent, maxSliderRent, "slider-track-rent");
    });

    // Update sliders when input values change
    minInputSalary.addEventListener("input", function() {
        if (parseInt(minInputSalary.value) > parseInt(maxInputSalary.value)) {
            minInputSalary.value = maxInputSalary.value;
        }
        minSliderSalary.value = minInputSalary.value; 
        setSliderTrack(minSliderSalary, maxSliderSalary, "slider-track-salary");
    });

    maxInputSalary.addEventListener("input", function() {
        if (parseInt(maxInputSalary.value) < parseInt(minInputSalary.value)) {
            maxInputSalary.value = minInputSalary.value;
        }
        maxSliderSalary.value = maxInputSalary.value; 
        setSliderTrack(minSliderSalary, maxSliderSalary, "slider-track-salary");
    });

    minInputRent.addEventListener("input", function() {
        if (parseInt(minInputRent.value) > parseInt(maxInputRent.value)) {
            minInputRent.value = maxInputRent.value;
        }
        minSliderRent.value = minInputRent.value; 
        setSliderTrack(minSliderRent, maxSliderRent, "slider-track-rent");
    });

    maxInputRent.addEventListener("input", function() {
        if (parseInt(maxInputRent.value) < parseInt(minInputRent.value)) {
            maxInputRent.value = minInputRent.value;
        }
        maxSliderRent.value = maxInputRent.value; 
        setSliderTrack(minSliderRent, maxSliderRent, "slider-track-rent");
    });

    document.getElementById("apply-filter-btn").addEventListener("click", function() {
        applyFilter();
    });

    // Initialize the slider tracks
    setSliderTrack(minSliderSalary, maxSliderSalary, "slider-track-salary");
    setSliderTrack(minSliderRent, maxSliderRent, "slider-track-rent");
});

// Call function to initialize
initCountryGrid();

// Sayyor - Insurance Data Stacked Bar Chart

// Parse the Data
// set the dimensions and margins of the graph

function getCheckedCountries() {
    const checkboxes = d3.selectAll(".country-checkbox");
    const checkedCountries = [];

    checkboxes.each(function () {
        const checkbox = d3.select(this);
        if (checkbox.property("checked")) {
            const countryName = checkbox.node().parentNode.querySelector(".country-name").textContent;
            checkedCountries.push(countryName);
        }
    });
    
    // console.log("Checked countries: ", checkedCountries);
    
    plot_health(checkedCountries);
}

const button = d3.select("#compare-btn");
button.on("click", getCheckedCountries);

var margin = {top: 20, right: 20, bottom: 130, left: 50},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

async function plot_health(checkedCountries) {
    try {
        // Load CSV files
        const [data] = await Promise.all([
            d3.csv("./data/insurance_proportion.csv")
        ]);

        // console.log("data", data);

        // console.log("checkedCountries", checkedCountries);

        var filteredData = data.filter(function(d) 
        {
            if( (checkedCountries.findIndex(element => element.includes(d["name"]))) != -1)
            {
                return d;
            }
        });
        // console.log("filteredData", filteredData);

        var subgroups = data.columns.slice(1);
        
        // console.log("subgroups", subgroups);
        // console.log("filteredData", filteredData);

        // Plot the Health section on the tab
        createMarimekkoChart(filteredData, subgroups)

        // Get unique country names
        var uniqueNames = d3.map(data, function(d) {
            return d.name;
        });

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
    } catch (error) {
        console.error("Error loading CSV data: ", error);
    }
}

async function updateChart(data) {
    // Update the Marimekko Chart based on the new selection
    try {
        // Load CSV files
        const [data] = await Promise.all([
            d3.csv("./data/insurance_proportion.csv")
        ]);

        var c1 = document.getElementById("country1");
        var c2 = document.getElementById("country2");
        var c1_txt = c1.options[c1.selectedIndex].text;
        var c2_txt = c2.options[c2.selectedIndex].text;

        // Clear existing chart
        d3.select("#stacked-bar-chart").selectAll("*").remove();

        // Filter the data for selected countries
        var filteredData = data.filter(function(d) 
        { 
                if( (d["name"] == c1_txt) || (d["name"]==c2_txt))
                { 
                    return d;
                } 
        })

        var subgroups = data.columns.slice(1)
        createMarimekkoChart(filteredData, subgroups);
    
    } catch (error) {
        console.error("Error loading CSV data: ", error);
    }
}

const createMarimekkoChart = (filteredData, subgroups) => {
    // Plot the Marimekko Chart

    // append the svg object to the body of the page
    var svg = d3.select("#stacked-bar-chart")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // console.log("filteredData", filteredData);
    // console.log("subgroups", subgroups);

    // List of subgroups = header of the csv files = soil condition here
    // var subgroups = filteredData.columns.slice(1)

    // List of groups = species here = value of the first column called group -> I show them on the X axis
    var groups = d3.map(filteredData, function(d){return(d.name)});
    // console.log("groups", groups)
    
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
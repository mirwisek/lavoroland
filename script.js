// Function to initialize the grid of countries
function initCountryGrid() {

    // Load CSV file for countries
    const countriesPromise = d3.csv("./data/countries.csv");
    // Load CSV file for country prices
    const pricesPromise = d3.csv("./data/country_prices.csv");
    // Load CSV file for country indices
    const indicesPromise = d3.csv("./data/country_indices.csv");

    // When both files are loaded
    Promise.all([countriesPromise, pricesPromise, indicesPromise]).then(function(values) {
        const countriesData = values[0];
        const pricesData = values[1];
        const indicesData = values[2];

        // Map prices data to country names for easy lookup
        const pricesMap = new Map();
        pricesData.forEach(d => {
            if (!pricesMap.has(d.country)) pricesMap.set(d.country, {});
            pricesMap.get(d.country)[d.item_name] = d.average_price;
        });

        // Map indices data to country names for easy lookup
        const indicesMap = new Map();
        indicesData.forEach(d => {
            indicesMap.set(d.country, d);
        });

        // Select container for the grid
        const container = d3.select("#countries-grid");

        // Create a div for each country
        const country = container.selectAll(".country")
            .data(countriesData)
            .enter()
            .append("div")
            .attr("class", "country");

        // Append the flag circle and event handlers to each country div
        country.append("div")
            .attr("class", "country-circle")
            .style("background-image", d => `url('${d.flag}')`)
            .on("mouseover", function(event, d) {
                // Show tooltip on mouseover
                const prices = pricesMap.get(d.country);
                const indices = indicesMap.get(d.country);
                const salary = prices ? `${parseFloat(prices["Average Monthly Net Salary (After Tax), Salaries And Financing"]).toFixed(2)}` : "N/A";
                const rent = prices ? `${parseFloat(prices["Apartment (1 bedroom) in City Centre, Rent Per Month"]).toFixed(2)}` : "N/A";
                const radarChartHtml = indices ? createRadarChart(indices) : "<div>No data available</div>";

                const tooltipHtml = `
                <div>
                    <div>
                        <div><strong>${d.country}</strong></div>
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
            })
            .on("mouseout", function() {
                // Hide tooltip on mouseout
                d3.select("#tooltip").style("opacity", 0);
            });

        // Append the country name to each country div
        country.append("div")
            .attr("class", "country-name")
            .text(d => d.country);
    });
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
    const width = 200, height = 200, radius = 70;
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

    // Draw circular grid
    radarGroup.selectAll(".grid-circle")
        .data(d3.range(1, 4))  // Number of circles
        .enter()
        .append("circle")
        .attr("class", "grid-circle")
        .attr("r", d => radiusScale(d * 25));  // Scale each circle (25, 50, 75, 100)

    // Draw axis lines
    const axis = radarGroup.selectAll(".axis")
        .data(indices)
        .enter().append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (_, i) => radiusScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (_, i) => radiusScale(100) * Math.sin(angleSlice * i - Math.PI / 2));

    // Draw axis labels
    axis.append("text")
        .attr("class", "axis-label")
        .attr("x", (_, i) => radiusScale(110) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (_, i) => radiusScale(110) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => indexLabels[d])
        .style("fill", d => indexColors[d]);

    // Create data structure for plotting
    const data = indices.map(key => ({
        axis: key,
        value: countryData[key]
    }));

    // Draw radar line
    const lineGenerator = d3.lineRadial()
        .radius(d => radiusScale(d.value))
        .angle((_, i) => i * angleSlice)
        .curve(d3.curveCardinalClosed);

    radarGroup.append("path")
        .datum(data)
        .attr("d", lineGenerator)
        .attr("class", "radar-line");

    // Draw radar points
    radarGroup.selectAll(".radar-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "radar-point")
        .attr("cx", (d, i) => radiusScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => radiusScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("r", 3)  // Radius of the points
        .style("fill", d => indexColors[d.axis])

    return svg.node().outerHTML;

}

// Call function to initialize
initCountryGrid();

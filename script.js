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
            d3.csv("./data/country_indices.csv"),
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
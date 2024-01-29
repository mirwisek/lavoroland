let pricesMap = new Map();
let indicesMap = new Map();
let countriesData = [];
let minSalaryLabel, maxSalaryLabel, minRentInCityLabel, maxRentInCityLabel, minRentOutsideCityLabel, maxRentOutsideCityLabel;

// Reference: https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=5
const indexColors = {
    "quality_of_life_index": "#e41a1c",
    "purchasing_power_incl_rent_index": "#377eb8",
    "rent_index": "#4daf4a",
    "health_care_index": "#984ea3",
    "safety_index": "#ff7f00"
};

// Function to create a weight bar for a given indicator
function createWeightBar(indicator) {
    const container = d3.select(`#${indicator}`);
    const segments = container.selectAll(".bar-segment");

    // Initialize all segments to grey
    segments.style("background-color", "rgb(156 163 175)");

    // Color only the first segment of each bar
    const firstSegment = container.select(".bar-segment:first-child");
    firstSegment.style("background-color", indexColors[indicator]);

    // Add click event listener to each segment
    segments.each(function(_, i) {
        d3.select(this).on("click", function() {
            // On click, color the clicked segment and all previous segments with the original color and the next ones to grey
            segments.each(function(_, j) {
                d3.select(this).style("background-color", j <= i ? indexColors[indicator] : "rgb(156 163 175)");
            });
            applyFilters();
        });
    });
}

// Function to initialize the bars with only the first segment colored
function initializeWeightBars() {
    createWeightBar("quality_of_life_index");
    createWeightBar("purchasing_power_incl_rent_index");
    createWeightBar("rent_index");
    createWeightBar("health_care_index");
    createWeightBar("safety_index");
    applyFilters();
}

// Function to get the weights of each indicator
function getWeights() {
    const weights = {};
    d3.selectAll(".indicator").each(function() {
        const indicator = this.querySelector("label").getAttribute("for");
        const coloredSegments = d3.select(this).selectAll(".bar-segment")
            .filter(function() { return d3.select(this).style("background-color") !== "grey"; })
            .size();
        weights[indicator] = coloredSegments;
    });
    return weights;
}

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

        // Apply filters to the grid
        applyFilters();

        // scentedWidgets(pricesData);

    } catch (error) {
        console.error("Error loading CSV data: ", error);
    }
}

function scentedWidgets(pricesData) {
    const countrySalaries = pricesData.filter(item => item.item_name === "Average Monthly Net Salary (After Tax), Salaries And Financing");
    console.log(countrySalaries)

    var countrySalaries_cf = crossfilter(countrySalaries),
        salary = countrySalaries_cf.dimension(function(d) {return d.average_price});
    console.log('test',salary)

    var charts = [
        barChart()
        .dimension(hour)
        .group(hours)
      .x(d3.scale.linear()
        .domain([0, 24])
        .rangeRound([0, 10 * 24]))
    ];
}

function createCountryGrid(countries) {
    const container = d3.select("#countries-grid").html("");

    countries.forEach((countryData, index) => {
        const delay = index * 50;

        const countryDiv = container.append("div")
            .datum(countryData)
            .attr("class", "country")
            .style("animation-delay", `${delay}ms`)
            .style("background-image", `url('${countryData.flag}')`);

        /*const countryCircle = countryDiv.append("div")
            .attr("class", "country-circle")
            .style("background-image", `url('${countryData.flag}')`);*/

        countryDiv.on("mouseover", event => showTooltip(event, countryData));
        countryDiv.on("mouseout", () => hideTooltip());

        countryDiv.append("div")
            .attr("class", "country-name")
            .text(countryData.country);

        // Append radar chart for each country
        const indices = indicesMap.get(countryData.country);
        if (indices) {
            const radarChartSvg = createRadarChart(indices);
            //radarChartSvg.classList.add('radar-chart-svg');
            countryDiv.node().appendChild(radarChartSvg);
        }
        
        // Append checkbox
        countryDiv.append("input")
        .attr("type", "checkbox")
        .attr("class", "country-checkbox");

        // Add click event listener to toggle checkbox when the div is clicked
        countryDiv.on("click", function(event) {
            // If the clicked element is not the checkbox, toggle the checkbox state
            if (event.target.type !== "checkbox") {
                const checkbox = d3.select(this).select(".country-checkbox").node();
                checkbox.checked = !checkbox.checked;
            }
        });
    });
}

function showTooltip(event, countryData) {
    const prices = pricesMap.get(countryData.country);
    const indices = indicesMap.get(countryData.country);
    const salary = prices ? `${parseFloat(prices["Average Monthly Net Salary (After Tax), Salaries And Financing"]).toFixed(2)}` : "N/A";
    const rent = prices ? `${parseFloat(prices["Apartment (1 bedroom) in City Centre, Rent Per Month"]).toFixed(2)}` : "N/A";
    const rent_outside = prices ? `${parseFloat(prices["Apartment (1 bedroom) Outside of Centre, Rent Per Month"]).toFixed(2)}` : "N/A";

    const tooltipHtml = `
        <div>
            <div>
                <div><strong>${countryData.country}</strong></div>
                <div class="tooltip-info">Average monthly net salary (after tax): <strong>${salary}€</strong></div>
                <div class="tooltip-info">Average monthly rent in city center (1 bedroom): <strong>${rent}€</strong></div>
                <div class="tooltip-info">Average monthly rent outside of city center (1 bedroom): <strong>${rent_outside}€</strong></div>
            </div>
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


function createRadarChart(countryData, delayAfterFilter = false) {
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

    // Dimensions and radius of the radar chart
    const width = 90, height = 90, radius = 50;
    const angleSlice = Math.PI * 2 / indices.length;

    // Create SVG element
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "radar-chart-svg")
        .attr("viewBox", `-10 -10 120 120`);

    // Add group element to hold radar chart
    const radarGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create scale for the radius
    const radiusScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, radius]);

    drawGridCircles(radarGroup, radiusScale);
    drawScaleText(radarGroup, radiusScale);
    drawAxes(radarGroup, indices, radiusScale, angleSlice, indexLabels);
    drawRadarLine(radarGroup, indices, countryData, radiusScale, angleSlice, delayAfterFilter);

    return svg.node();
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

function drawAxes(radarGroup, indices, radiusScale, angleSlice, indexLabels) {
    const axis = radarGroup.selectAll(".axis")
        //.data(indices)
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

function drawRadarLine(radarGroup, indices, countryData, radiusScale, angleSlice, delayAfterFilter = false) {
    // Create data structure for plotting
    const data = indices.map(key => ({
        axis: key,
        value: countryData[key]
    }));

    const lineGenerator = d3.lineRadial()
        .radius(d => radiusScale(d.value))
        .angle((_, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    radarGroup.append("path")
        .datum(data)
        .attr("d", lineGenerator)
        .attr("class", "radar-area")
        .transition() 
        .duration(1000) 
        .delay(delayAfterFilter ? 200 : 0) 
        .attrTween("d", function(d) { 
            const interpolate = d3.interpolate(0, 1); 
            return function(t) {
                return lineGenerator(d.map((d, i) => ({
                    axis: d.axis,
                    value: interpolate(t) * d.value
                })));
            };
        });

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

// Function to calculate the score of a country based on the weights of the indicators
function calculateScore(countryData, weights) {
    let score = 0;
    // I'm skipping the first element because it's the country name
    for (const [indicator, value] of Object.entries(countryData).slice(1)) {
        const weight = weights[indicator];
        score += (weight || 0) * parseFloat(value);
    }
    return score;
}

function updateWinner() {
    // Remove the winner class and the image from all countries
    d3.selectAll(".country").classed("winner", false);
    d3.selectAll(".country .winner-image").remove();

    // Add the winner class to the first country
    const firstCountry = d3.select(".country");
    firstCountry.classed("winner", true);
    firstCountry.append("img")
                .attr("src", "./img/winner.png")
                .attr("class", "winner-image");
}

function applyFilters() {
    const weights = getWeights();
    let minSalary, maxSalary, minRentIn, maxRentIn, minRentOut, maxRentOut;

    try {
        minSalary = Math.floor(parseFloat(minSalaryLabel.innerHTML)) || 0;
        maxSalary = Math.floor(parseFloat(maxSalaryLabel.innerHTML)) || Infinity;
        minRentIn = Math.floor(parseFloat(minRentInCityLabel.innerHTML)) || 0;
        maxRentIn = Math.floor(parseFloat(maxRentInCityLabel.innerHTML)) || Infinity;
        minRentOut = Math.floor(parseFloat(minRentOutsideCityLabel.innerHTML)) || 0;
        maxRentOut = Math.floor(parseFloat(maxRentOutsideCityLabel.innerHTML)) || Infinity;
    } catch (error) {
        // Handle the error when innerHTML is not accessible
        minSalary = 0;
        maxSalary = Infinity;
        minRentIn = 0;
        maxRentIn = Infinity;
        minRentOut = 0;
        maxRentOut = Infinity;
    }

    const countries = Array.from(d3.selectAll(".country").nodes());

    // Get references to the two grids
    const matchingCountriesGrid = d3.select("#countries-grid");
    const nonMatchingCountriesGrid = d3.select("#countries-grid-grey");

    countries.forEach(countryElement => {
        const countryName = d3.select(countryElement).datum().country;
        const countryData = indicesMap.get(countryName);
        const score = calculateScore(countryData, weights);
        d3.select(countryElement).datum().score = score; // Assign score to each country
    });

    const [filteredCountries, nonFilteredCountries] = countries.reduce((acc, countryElement) => {
        const countryData = pricesMap.get(d3.select(countryElement).datum().country);

        const salary = countryData ? Math.floor(parseFloat(countryData["Average Monthly Net Salary (After Tax), Salaries And Financing"])) : 0;
        const rent = countryData ? Math.floor(parseFloat(countryData["Apartment (1 bedroom) in City Centre, Rent Per Month"])) : 0;
        const rentOutside = countryData ? Math.floor(parseFloat(countryData["Apartment (1 bedroom) Outside of Centre, Rent Per Month"])) : 0;

        
        const isWithinSalaryRange = salary >= minSalary && salary <= maxSalary;
        const isWithinRentRange = rent >= minRentIn && rent <= maxRentIn;
        const isWithinRentOutsideRange = rentOutside >= minRentOut && rentOutside <= maxRentOut;

        if (isWithinSalaryRange && isWithinRentRange && isWithinRentOutsideRange) {
            d3.select(countryElement).classed("grey-filter", false);
            matchingCountriesGrid.node().appendChild(countryElement);
            acc[0].push(countryElement);
        } else {
            d3.select(countryElement).classed("grey-filter", true);
            nonMatchingCountriesGrid.node().appendChild(countryElement);
            acc[1].push(countryElement);
        }

        return acc;
    }, [[], []]);

    const sortCountries = (a, b) => {
        return d3.select(b).datum().score - d3.select(a).datum().score; 
    };

    // Order filteredCountries and nonFilteredCountries by their final score
    filteredCountries.sort(sortCountries);
    nonFilteredCountries.sort(sortCountries);

    // Previously filtered countries are added to the matching grid
    filteredCountries.forEach(countryElement => {
        matchingCountriesGrid.node().appendChild(countryElement);
    });

    // Previously non-filtered countries are added to the non-matching grid
    nonFilteredCountries.forEach(countryElement => {
        nonMatchingCountriesGrid.node().appendChild(countryElement);
    });

    updateRadarCharts(filteredCountries);
    updateRadarCharts(nonFilteredCountries);

    // Update the golden background for the first country
    updateWinner();
}

function updateRadarCharts(countries) {
    // Loop through countries
    countries.forEach((countryElement) => {
        const countryData = d3.select(countryElement).datum();
        const countryName = countryData.country;

        // Remove existing radar chart
        d3.select(countryElement).select("svg").remove();

        // Re-create radar chart with animation
        const indices = indicesMap.get(countryName);
        if (indices) {
            const radarChartSvg = createRadarChart(indices, true); // Pass true to animate
            countryElement.appendChild(radarChartSvg);
        }
    });
}

const defaultValues = {
    minSalary: 0,
    maxSalary: Infinity,
    minRent: 0,
    maxRent: Infinity,
    minRentOutside: 0,
    maxRentOutside: Infinity
};

function parseAttributeValues(id, minLabel, maxLabel) {
    let histogram = document.getElementById(id);
    salaries = histogram.getAttribute("data-default").split(",")
    minLabel.innerHTML = parseInt(salaries[0])
    maxLabel.innerHTML = parseInt(salaries[1])
}

function resetFilters() {
    // Reset sliders

    // Reset number boxes
    // parseAttributeValues('avgNetSalaryHistogram', minSalaryLabel, maxSalaryLabel)
    // parseAttributeValues('rentInCityHistogram', minRentInCityLabel, maxRentInCityLabel)
    // parseAttributeValues('rentOutsideCityHistogram', minRentOutsideCityLabel, maxRentOutsideCityLabel)

    salaryHistogram.dispatchEvent(new Event("reset"));
    rentInCityHistogram.dispatchEvent(new Event("reset"));
    rentOutsideCityHistogram.dispatchEvent(new Event("reset"));

    applyFilters();
}

function parseAndAssignValuesHistogram(histogram, minLabel, maxLabel) {
    let values = histogram.getAttribute("data-brushed");
        // Sometimes a use can select a single bar, so we get single value instead of a range
        // In that case we assign the same value to min and max
        let [min, max] = values.split(",").map(value => parseInt(value.trim()));
        if (isNaN(min)) {
            min = max;
        }
        if (isNaN(max)) {
            max = min;
        }
        
        minLabel.innerHTML = min;
        maxLabel.innerHTML = max;
}

document.addEventListener("DOMContentLoaded", function() {
    // Event listeners and slider initialization
    minSalaryLabel = document.getElementById("minSalaryLabel");
    maxSalaryLabel = document.getElementById("maxSalaryLabel");
    minRentInCityLabel = document.getElementById("minRentInCityLabel");
    maxRentInCityLabel = document.getElementById("maxRentInCityLabel");
    minRentOutsideCityLabel = document.getElementById("minRentOutsideCityLabel");
    maxRentOutsideCityLabel = document.getElementById("maxRentOutsideCityLabel");

    // Initialize input elements
    salaryHistogram = document.getElementById("avgNetSalaryHistogram");
    rentInCityHistogram = document.getElementById("rentInCityHistogram");
    rentOutsideCityHistogram = document.getElementById("rentOutsideCityHistogram");

    // Initialize the weight bars with only the first segment colored
    initializeWeightBars();

    // Salary Range Event Listeners
    salaryHistogram.addEventListener("input", function() {
        parseAndAssignValuesHistogram(salaryHistogram, minSalaryLabel, maxSalaryLabel)
        applyFilters();
    });

    // Rent in city Range Event Listeners
    rentInCityHistogram.addEventListener("input", function() {
        parseAndAssignValuesHistogram(rentInCityHistogram, minRentInCityLabel, maxRentInCityLabel)
        applyFilters();
    });

    // Rent outside city Range Event Listeners
    rentOutsideCityHistogram.addEventListener("input", function() {
        parseAndAssignValuesHistogram(rentOutsideCityHistogram, minRentOutsideCityLabel, maxRentOutsideCityLabel)
        applyFilters();
    });
    

    document.getElementById("reset-filter-btn").addEventListener("click", resetFilters);
    document.getElementById("reset-weights-btn").addEventListener("click", initializeWeightBars);

    // Get all number input elements within elements with class 'range-values'
    const numberInputs = document.querySelectorAll('.range-values input[type=number]');

    // Add event listeners to each number input
    numberInputs.forEach(input => {
        input.addEventListener('change', applyFilters);
    });
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
    plot_sankey_compensation(checkedCountries);
}

const button = d3.select("#fabToggle");
button.on("click", getCheckedCountries);

async function plot_sankey_compensation(checkedCountries) {

    import('./sankey-compensation/sankey.js').then(d => {
        console.log("checkedCountries", checkedCountries);
        d.createSankeyChart(checkedCountries)
    });
}

async function plot_health(checkedCountries) {
    try {
        // Load CSV files
        const [insurance_data, indexes, countries, prices] = await Promise.all([
            d3.csv("./data/insurance_proportion.csv"),
            d3.csv("./data/health_indexes.csv"),
            d3.csv("./data/countries.csv"),
            d3.csv("./data/country_prices1.csv")
        ]);

        console.log("prices", prices);
        console.log("checkedCountries", checkedCountries);

        // plot Health Insurance Sources as Stacked Bar Chart
        var filteredInsurance = insurance_data.filter(function(d) 
        {
            if( (checkedCountries.findIndex(element => element.includes(d["name"]))) != -1)
            {
                return d;
            }
        });

        var subgroups = insurance_data.columns.slice(1);

        var textFontSize = "18px";

        createMarimekkoChart(filteredInsurance, subgroups, countries, textFontSize);

        // Plot Particular Expenses for the selected countries as Grouped Bar Chart
        // Leave only the data for expenses and for the chosen countries
        console.log("prices", prices);
        var filteredPrices = prices.filter(function(d) {
            if ((checkedCountries.findIndex(element => element.includes(d["country"])) !== -1) && !["105.0","26.0","27.0","18.0"].includes(d.item_id)) {
                return d;
            }
        });

        // Get unique expenses names
        var itemNames = d3.map(filteredPrices, function(d) {
            return d.item_name;
        });
        var itemNames = Array.from(new Set(itemNames.filter(function(item) {
            return item !== null && item !== undefined;
        })));

        // Create array of arrays of items, with group:item_name, country1:value, etc.
        let groupedData = [];
        filteredPrices.forEach(d => {
            // check if the current group is already created
            let existingGroup = groupedData.find(group => group.group === d.item_name && group[d.country] === undefined);
            if (!existingGroup) {
                existingGroup = { group: d.item_name };
                groupedData.push(existingGroup);
            }
            existingGroup[d.country] = d.average_price;
        });
        let result = Object.values(groupedData);

        createGroupedBarChart(checkedCountries, itemNames, groupedData, textFontSize);
        addCheckboxes(checkedCountries, itemNames, groupedData, textFontSize);

        // // // FOR PARALLEL COORDINATES
        // var filteredIndexes = insurance_data.filter(function(d) 
        // {
        //     if( (checkedCountries.findIndex(element => element.includes(d["name"]))) != -1)
        //     {
        //         return d;
        //     }
        // });
        // var subgroups = indexes.columns.slice(1);
        // createParallelCoordinates(filteredIndexes, subgroups);
    } catch (error) {
        console.error("Error loading CSV data: ", error);
    }
}

const addCheckboxes = (subgroups, groups, data) => {
    var checkboxesDiv = d3.select("#expenses-checkboxes");

    groups.forEach((group, index) => {
        if (index % 3 === 0) {
            row = checkboxesDiv.append("div")
                .attr("class", "flex gap-2"); // Flex container for the row
        }

        var checkboxContainer = row.append("div")
            .attr("class", "relative grid select-none items-center whitespace-nowrap rounded-lg bg-green-500/20 py-1.5 px-3 font-sans text-xs font-bold uppercase text-green-900");

        var innerDiv = checkboxContainer.append("div")
            .attr("class", "absolute top-2/4 left-1.5 h-5 w-5 -translate-y-2/4");

        var label = innerDiv.append("label")
            .attr("class", "relative flex items-center p-0 rounded-full cursor-pointer")
            .attr("for", group.replace(/\s+/g, '-').toLowerCase());

        label.append("input")
            .attr("type", "checkbox")
            .attr("checked", true)
            .attr("value", group)
            .attr("class", "before:content[''] peer relative -ml-px h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-green-900 transition-all before:absolute before:top-2/4 before:left-2/4 before:hidden before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-green-900 checked:bg-green-900 checked:before:bg-green-500 hover:before:opacity-10")
            .on("change", () => updateChart(subgroups, data));

        label.append("span")
            .attr("class", "absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100")
            .html('<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>');

        checkboxContainer.append("span")
            .attr("class", "ml-[18px]")
            .text(group);
    });
};

function updateChart(subgroups, data) {
    console.log("updateChart data", data);
    var activeGroups = [];
    d3.selectAll("#expenses-checkboxes input[type='checkbox']").each(function() {
        cb = d3.select(this);
        grp = cb.property("value");

        if(cb.property("checked")){
            activeGroups.push(grp);
        }
    });
    // data = data.filter(d => activeGroups.includes(d.group));

    console.log("data active", activeGroups);
    createGroupedBarChart(subgroups, activeGroups, data)
}

const createGroupedBarChart = (subgroups, groups, data, textFontSize) => {
    // Remove existing bars before redrawing
    d3.select("#grouped-bar-chart").selectAll("svg").remove();

    data = data.filter(d => groups.includes(d.group));

    var margin = { top: 10, right: 10, bottom: 50, left: 150 },
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

    legendWidth = 150
    // append the svg object to the body of the page
    var svg = d3.select("#grouped-bar-chart")
                .append("svg")
                    .attr("width", width + margin.left + margin.right + legendWidth)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

    console.log("subgroups", subgroups);
    console.log("groups", groups);
    console.log("data", data);

    // Sort the groups from highest to lowest
    let groupValues = {};
    data.forEach(d => {
        subgroups.forEach(subgroup => {
            groupValues[d.group] = Math.max(groupValues[d.group] || 0, d[subgroup]);
        });
    });
    groups.sort((a, b) => groupValues[b] - groupValues[a]);

    // find max Y value
    let maxValue = 0;
    data.forEach(d => {
        subgroups.forEach(subgroup => {
            let currentValue = parseFloat(d[subgroup]);
            if (currentValue > maxValue) {
                maxValue = currentValue;
            }
        });
    });

    // console.log('maxValue',maxValue)

    // Add X axis (for values)
    var x = d3.scaleLinear()
        .domain([0, maxValue+20])
        .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", textFontSize);

    // Add Y axis (for categories)
    var y = d3.scaleBand()
        .domain(groups)
        .range([0, height])
        .padding([0.2]);
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", textFontSize);

    // Another scale for subgroup position
    var ySubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, y.bandwidth()])
        .padding([0.05])

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#19bbac', '#186edd', '#d86855', '#fcb71b', '#9b59b6', '#2ecc71', '#e74c3c', '#f39c12', '#27ae60'])

    // Show the bars
    svg.append("g")
        .attr("class", "bar-group")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d) { return "translate(0," + y(d.group) + ")"; })
        .selectAll("rect")
        .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
        .enter().append("rect")
            .attr("y", function(d) { return ySubgroup(d.key); })
            .attr("x", 0)
            .attr("height", ySubgroup.bandwidth())
            .attr("width", function(d) { return x(d.value); })
            .attr("fill", function(d) { return color(d.key); })
            // Add tooltip
            .on("mouseover", function(event, d) {
                let value = parseFloat(d.value);
                console.log("stacked d: ", `${d.key}: <strong>\u20AC${(value).toFixed(2)}</strong>`);
                d3.select("#tooltip-grouped")
                    .style("opacity", 1)
                    .html(`${d.key}: <strong>\u20AC${(value).toFixed(2)}</strong>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px")
                    .style("font-size", textFontSize);
            })
            .on("mouseout", function() {
                console.log("Mouseout event triggered.");
                d3.select("#tooltip-grouped").style("opacity", 0);
            });
    
    // draw the legend
    var legend = svg.append("g")
        .attr("transform", "translate(" + (width + margin.right) + ", 0)");
    
    subgroups.forEach((subgroup, index) => {
        var legendRow = legend.append("g")
            .attr("transform", "translate(0, " + (index * 20) + ")");
    
        legendRow.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", color(subgroup));
    
        legendRow.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .style("font-size", textFontSize)
            .text(subgroup);});
}

/**
 * Function to create a Marimekko Chart using D3.js
 * @param {Array} filteredInsurance - Data of only the countries to plot
 * @param {Array} subgroups - column names
 */
const createMarimekkoChart = (filteredInsurance, subgroups, countries, textFontSize) => {
    var margin = { top: 10, right: 190, bottom: 50, left: 50 },
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#stacked-bar-chart")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // console.log("filteredInsurance", filteredInsurance);
    // console.log("subgroups", subgroups);

    // Extract groups for X-axis from the dataset
    var groups = d3.map(filteredInsurance, function(d){return(d.name)});
    
    // X-axis scale
    let x = d3.scaleBand()
              .domain(groups)
              .range([0, width])
              .padding(0.2);

    svg.append("g")
       .attr("transform", `translate(0, ${height})`)
       .call(d3.axisBottom(x).tickSizeOuter(0))
       .selectAll("text")
       .style("font-size", textFontSize);;

    // Y-axis scale
    let y = d3.scaleLinear()
                .domain([0, 100])
                .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", textFontSize);

    // Y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("% of Insurance Cost")
        .style("font-size", textFontSize);

    // Color palette for subgroups
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#19bbac', '#186edd', '#d86855', '#fcb71b'])
        
    // Normalize the data -> sum of each group must be 100!
    filteredInsurance.forEach(d => {
        let total = subgroups.reduce((acc, subgroup) => acc + +d[subgroup], 0);
        subgroups.forEach(subgroup => {
            d[subgroup] = (d[subgroup] / total) * 100;
        });
    });
    console.log('subgroups', subgroups);

    // Define more readable text for labels
    let keyToLegendLabel = {
        "percentage_insurance_employer":"Insured by Employer",
        "percentage_insurance_private":"Private Insurance",
        "percentage_insurance_public":"Public Insurance",
        "percentage_insurance_none":"Other Insurances"
    };

    // Sort subgroups by the value of the first country
    let subgroupSums = subgroups.map(subgroup => {
        return {
            subgroup: subgroup,
            total: filteredInsurance[0][subgroup]
        };
    });
    
    subgroupSums.sort((a, b) => b.total - a.total);
    console.log('subgroupSums', subgroupSums);
    subgroups = subgroupSums.map(d => d.subgroup);

    // Stack the data by subgroups
    let stackedData = d3.stack()
                        .keys(subgroups)(filteredInsurance);
    // Create the bars
    svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
            .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d.map(item => ({ ...item, key: d.key })))
        .enter().append("rect")
            .attr("x", d => x(d.data.name))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            // Add tooltip
            .on("mouseover", function(event, d) {
                console.log("marimekko d: ", d);
                d3.select("#tooltip-stacked")
                  .style("opacity", 1)
                  .html(`${keyToLegendLabel[d.key]}:  <strong>${(d[1] - d[0]).toFixed(2)}%</strong>`)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px")
                  .style("font-size", textFontSize);
            })
            .on("mouseout", function() {
                d3.select("#tooltip-stacked").style("opacity", 0);});
    
    const countryNames = new Set(filteredInsurance.map(d => d.name));
    const relevantCountries = countries.filter(country => countryNames.has(country.country));

    const flagSize = 45;
    const flagYPosition = height + margin.bottom - flagSize - 60;
    svg.append("g").selectAll("image")
                    .data(relevantCountries)
                    .enter()
                    .append("image")
                        .attr("xlink:href", d => d.flag)
                        .attr("x", d => x(d.country) + x.bandwidth() / 2 - flagSize / 2) // Center the flag under each bar
                        .attr("y", flagYPosition) // Adjust this to position the flags below the x-axis
                        .attr("width", flagSize)
                        .attr("height", flagSize);

    let reversedSubgroups = [...subgroups].reverse();
    
    const legendXStart = width + margin.left - 50;
    const legendYStart = 10;

    // Legend circles
    svg.selectAll(".legend-dots")
       .data(reversedSubgroups)
       .enter()
       .append("circle")
           .attr("cx", legendXStart)
           .attr("cy", (d, i) => legendYStart + i * 20)
           .attr("r", 7)
           .style("fill", color);
    
    // Legend labels
    svg.selectAll(".legend-labels")
        .data(reversedSubgroups)
        .enter()
        .append("text")
            .attr("x", legendXStart + 20)
            .attr("y", (d, i) => legendYStart + i * 20)
            .style("fill", color)
            .text(d => keyToLegendLabel[d])
            .attr("text-anchor", "left")
            .style("font-size", textFontSize)
            .style("alignment-baseline", "middle");
}

const createParallelCoordinates = (data, dimensions) => {

    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 10, bottom: 10, left: 0},
    width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#stacked-bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
    // dimensions = d3.keys(data[0]).filter(function(d) { return d != "Species" })

    // For each dimension, I build a linear scale. I store all in a y object
    var y = {}
    for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
        .domain( d3.extent(data, function(d) { return +d[name]; }) )
        .range([height, 0])
    }

    // Build the X scale -> it find the best position for each Y axis
    x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    svg
    .selectAll("myPath")
    .data(data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

    // Draw the axis:
    svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black")
}


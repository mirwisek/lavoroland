// Group by 'country' and take the average for 'compTotal'
const groupByCountry = (data, devType) => {
  return d3.group(data.filter(d => d.devType === devType), d => d.country);
};

// Calculate the average for 'compTotal'
const averageCompTotal = (groupedData) => {
  return Array.from(groupedData, ([country, values]) => ({
    country,
    compTotal: d3.mean(values, d => d.compTotal)
  }));
};

const colorsYellow = ['#d79422', '#fec32d']
// colorsBlue = ['#0b436f', '#0e5892']
// colorsBlue = ['#1a5fa5', '#1f74c9']
const colorsBlue = ['#1a5fa5', '#2784e2']

function appendGradientDef(svg, id, positions, colors) {
  // Define a linear gradient
  const gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", id)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", positions[0][0]).attr("y1", positions[0][1])
    .attr("x2", positions[1][0]).attr("y2", positions[1][1])

  gradient.append("stop").attr("offset", "0%").attr("stop-color", colors[1])

  gradient.append("stop").attr("offset", "100%").attr("stop-color", colors[0])

  return gradient;
}


/* Load the dataset and formatting variables
Ref: https://www.d3indepth.com/requests/ */

export function createTheMultiBarChart() {
    d3.csv("./data/jobs_stackoverflow.csv", d => ({
      compTotal: !isNaN(d.CompTotal) ? +d.CompTotal : 0, // Convert to numeric, replace NaN with 0
      devType: d.DevType,
      country: d.Country
    })).then(data => {
      console.log(data)
  
      /**
       * Some filtering, followed by average-calcualation for salaries, followed by sorting
       */
      // List of EU countries
      const euCountries = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Republic of Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'];
  
      const filteredData = data.filter(d => euCountries.includes(d.country));
  
      const groupedDataDA = groupByCountry(filteredData, 'Data or business analyst');
      const groupedDataML = groupByCountry(filteredData, 'Data scientist or machine learning specialist');
  
      // Filter out countries with compTotal === 0 from dataML and dataDA
      const dataDA = averageCompTotal(groupedDataDA).filter(d => d.compTotal !== 0)
      const dataML = averageCompTotal(groupedDataML).filter(d => d.compTotal !== 0)

      
      console.log("dataDA:", dataDA);
      console.log("dataML:", dataML);
  
      // Extract unique countries from dataML and dataDA
      const countriesML = new Set(dataML.map(d => d.country));
      const countriesDA = new Set(dataDA.map(d => d.country));
  
      // Filter out items from dataML for which there is no corresponding entry in dataDA
      const filteredDataDA = dataDA.filter(d => countriesML.has(d.country));
      const filteredDataML = dataML.filter(d => countriesDA.has(d.country));
  
      // Sort dataML in descending order by compTotal
      filteredDataML.sort((a, b) => b.compTotal - a.compTotal);
  
      // Sort dataDA to correspond to the order of countries in dataML
      filteredDataDA.sort((a, b) => {
        const indexA = filteredDataML.findIndex(d => d.country === a.country);
        const indexB = filteredDataML.findIndex(d => d.country === b.country);
        return indexA - indexB;
      });
  
      // Move the color scale here to share with both charts
      const countries = data.map(d => d.country);
      const colors = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.quantize(d3.interpolateRainbow, countries.length));
  
      // Plot the bar chart
      createBarChart(filteredDataDA, filteredDataML, colors);
  });
}

const createBarChart = (dataDA, dataML, colors) => {

  // Specify the chart’s dimensions
  const marginTop = 60;
  const marginRight = 60;
  const marginBottom = 10;
  const marginLeft = 120;
  const radius = 10;
  const width = 800; // Specify your desired width
  const height = 350 + marginTop + marginBottom;
  // Some views get clipped just as the line's rounded corner, so we need some extra padding
  // Since our layout is relative i.e. changing height would scale up therefore we can't simply increase height
  const extraHeight = height + 80

  const maxDA = d3.max(dataDA, d => d.compTotal)
  const maxML = d3.max(dataML, d => d.compTotal)

  const positiveMax = Math.max(maxDA, maxML)
  const extent = [-positiveMax, positiveMax]

  

  console.log("dataDA:", dataDA);
  console.log("dataML:", dataML);
  console.log("positiveMax:", positiveMax);
  console.log("extent:", extent);

  // Create the positional scales.
  const x = d3.scaleLinear()
    .domain(extent)
    .rangeRound([marginLeft, width - marginRight])

  const y = d3.scaleBand()
    .domain(dataML.map(d => d.country))
    .rangeRound([marginTop, height - marginBottom])
    .paddingInner(0.3)

  // Create the SVG container.
  const svg = d3.select("#multi-bar-chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, extraHeight])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  /**
   * Plotting the x and y axis
   */

  // Y-axis labels

  let yAxis = d3.axisLeft(y).offset(2)

  const yGroup = svg.append('g')
    .attr('transform', `translate(${marginLeft - 30}, 0)`)
    .attr("class", "y-axis-labels")
    .call(yAxis.tickSize(0))  // Set tickSize to 0 to hide ticks
    .call(g => g.select('.domain').remove())

  // X-axis labels

  let xAxis = d3.axisBottom(x)
  // Calculate the quartile positions to place the dotted scale on
  const noOfQuartiles = 4
  let step = extent[1] / noOfQuartiles
  let xAxisValues = []
  let start = extent[1]
  for (let i = 0; i != noOfQuartiles * 2 + 1; i++, start -= step) {
    xAxisValues.push(start)
  }

  const xAxisPadding = 30
  const xGroup = svg.append('g')
    .attr('transform', `translate(0, ${height - marginBottom + xAxisPadding})`)
    .attr("class", "x-axis-labels")
    .call(xAxis.tickSize(0).tickFormat(d => d < 0 ? d3.format('.2s')(-d) : d3.format('.2s')(d)).tickValues(xAxisValues))
    .call(g => g.select('.domain').remove())


  // It's a fix to format 0.0 on x-axis to 0
  svg.selectAll(".x-axis-labels .tick text").each(function () {
    const textElement = d3.select(this);
    if (textElement.text() === "0.0") { textElement.text("0"); }
  });

  const currencyLabel = svg.append("text")
  .attr("x", x(0))
  .attr("y", y.range()[1] + y.bandwidth() * 3.5)
  .attr("font-size", 12)
  .attr("font-family", "Montserrat, sans-serif")
  .attr("fill", colorsBlue[1])    
  .text("Per year compensation in €");

  // Get the bounding box of the text
  const currencyTextBoundingBox = currencyLabel.node().getBBox();
  currencyLabel.attr("x", x(0) - currencyTextBoundingBox.width / 2)

  // Disclaimer text for justifying missing countries
  // const disclaimerLabel = svg.append("text")
  // .attr("x", 5)
  // .attr("y", y.range()[1] + y.bandwidth() * 3.5)
  // .attr("font-size", 7)
  // .attr("font-family", "Montserrat, sans-serif")
  // .attr("fill", colorsBlue[1])
  // .attr("style", "font-style: italic")
  // .text("Disclaimer: Any EU country not displayed is because of the non-availability of data");

  const gap = y.bandwidth() / 2

  xAxisValues.forEach(i => {
    if (i != 0) { // Skip the center i.e. 0 index, since we'll draw another straight line on top of bars
      console.log(`For ${i} the value of x: ${x(i)}`)
      // Dotted Quartile Line
      svg.append("line")
        .attr("x1", x(i))
        .attr("y1", y(dataML[0].country) - gap)
        .attr("x2", x(i))
        .attr("y2", y(dataML[dataML.length - 1].country) + y.bandwidth() + gap)
        .attr("stroke", colorsBlue[1])
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .style("stroke-linecap", "round")
    }
  })

  /**
   * Data Analyst - Section
   */

  // Add a rect for each data point.
  let barDA = svg.append("g")
    .selectAll()
    .data(dataDA)
    .join("path")
    // .attr("fill", "url(#gradient)")
    .attr("d", d => {
      const gradientId = `DA-gradient-${d.country}`
      const gPositions = [[0, y(d.country)], [0, y(d.country) + y.bandwidth()]]
      appendGradientDef(svg, gradientId, gPositions, colorsBlue)
      return rightRoundedRect(x(Math.min(d.compTotal, 0)), y(d.country), Math.abs(x(d.compTotal) - x(0)), y.bandwidth(), radius)
    })
    .style("fill", d => {
      const gradientId = `DA-gradient-${d.country}`;
      return `url(#${gradientId})`;
    })
    .classed("bar-with-shadow", true)

  // Show tooltip for exact value
  const formatValue = d3.format(".0s"); // Format to K format with 0.s decimal places
  barDA.append('title').text(d => `${d.country}: ${Number.isInteger(d.compTotal) ? d.compTotal : d.compTotal.toFixed(2)}€`);
  // barDA.append('title').text(d => `${d.country}: ${formatValue(Math.abs(d.compTotal))}€`);

  /**
   * Machine Learning Engineer - Section
   */

  let barML = svg.append("g")
    .selectAll()
    .data(dataML)
    .join("path")
    .attr("d", d => {
      const gradientId = `ML-gradient-${d.country}`
      const gPositions = [[0, y(d.country)], [0, y(d.country) + y.bandwidth()]]
      appendGradientDef(svg, gradientId, gPositions, colorsYellow)
      return leftRoundedRect(x(Math.min(-d.compTotal, 0)), y(d.country), Math.abs(x(d.compTotal) - x(0)), y.bandwidth(), radius)
    })
    .style("fill", d => {
      const gradientId = `ML-gradient-${d.country}`;
      return `url(#${gradientId})`;
    })
    .classed("bar-with-shadow", true)

  // Show tooltip for exact value
  barML.append('title').text(d => `${d.country}: ${formatValue(Math.abs(d.compTotal))}€`);

  // Base line 
  svg.append("line")
    .attr("x1", x(0))
    .attr("y1", y(dataML[0].country) - gap)
    .attr("x2", x(0))
    .attr("y2", y(dataML[dataML.length - 1].country) + y.bandwidth() + gap)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .style("stroke-linecap", "round")
    .classed("shadow-right", true)

  // Add legends for left bars and right bars
  const posDA = extent[0] / 2
  addLegendLabel(svg, x, "Data Analyst", posDA, "DA-gradient-Legend", colorsYellow[1])
  addLegendLabel(svg, x, "Data Scientists/Engineers", -posDA, "ML-gradient-Legend", colorsBlue[1])

}

/**
 * Add a legend to describe the data section
 */
function addLegendLabel(svg, x, text, posDA, gradientId, textColor) {

  const boxPadding = [20, 30] // v, h
  const topMarginLegend = 2

  console.log('POS DA: ', x(posDA))
  // console.log('POS DA: ', x(posDS))

  const legendDABox = svg.append("rect")
    .attr("x", 275)
    // .attr("x", x(posDA))
    .attr("y", topMarginLegend)
    .attr("width", 180)
    .attr("height", 80)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("fill", "rgba(255, 255, 255, 0.1)")
    .attr("stroke", colorsBlue[1])
    .attr("stroke-width", 1);

    console.log(legendDABox)

  // Add text inside the rectangle
  const fontSize = 12;

  const legendDALabel = svg.append("text")
    .attr("x", 275)
    .attr("y", topMarginLegend)
    .attr("font-size", fontSize)
    .attr("font-family", "Montserrat, sans-serif")
    .attr("fill", textColor)
    .text(text);

  /**
   * Dynamically adjust the size of the box based on text size
   */
  // Get the bounding box of the text
  const textBoundingBox = legendDALabel.node().getBBox();

  // Calculate the width of the rectangle based on text size
  const boxWidth = textBoundingBox.width + boxPadding[1]
  const boxHeight = textBoundingBox.height + boxPadding[0]
  legendDABox.attr("width", boxWidth)
  legendDABox.attr("height", boxHeight)
  legendDABox.attr("x", textBoundingBox.x - boxWidth / 2)

  legendDALabel.attr("x", textBoundingBox.x - textBoundingBox.width / 2)
  legendDALabel.attr("y", topMarginLegend + boxHeight / 2 + textBoundingBox.height / 4)

  const positions = [[textBoundingBox.x, textBoundingBox.y], [textBoundingBox.x + textBoundingBox.width, textBoundingBox.y + textBoundingBox.height]]
  appendGradientDef(svg, gradientId, positions, ["#8f8672", "#f4efe6"])
}

/**
 * Make the corners of a rect rounded, right and left accordingly
 */
function rightRoundedRect(x, y, width, height, radius) {
  return "M" + x + "," + y
    + "h" + (width - radius)
    + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
    + "v" + (height - 2 * radius)
    + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
    + "h" + (radius - width)
    + "z";
}

function leftRoundedRect(x, y, width, height, radius) {
  return "M" + (x + radius) + "," + y
    + "h" + (width - radius)
    + "v" + height
    + "h" + (radius - width)
    + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + -radius
    + "v" + (2 * radius - height)
    + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + -radius
    + "z";
}
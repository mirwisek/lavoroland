import "./sankey_setup.js";

// Helper function to generate a unique identifier
function generateUID() {
    return Math.random().toString(36).substr(2, 9);
}

// set the dimensions and margins of the graph
// const legendWidth = 200;
const absoluteWidth = 1000;
var margin = { top: 10, right: 10, bottom: 10, left: 10 },
width = absoluteWidth - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;
// chartEnd = absoluteWidth - legendWidth;

// format variables
var formatNumber = d3.format(",.0f"),    // zero decimal places
format = function (d) { return formatNumber(d) + " €"; },
color = d3.scaleOrdinal(d3.schemeCategory10);

// append the svg object to the body of the page
// const svg = d3.select("#sankey-compensation-chart").append("svg")
// .attr("width", width + margin.left + margin.right)
// .attr("height", height + margin.top + margin.bottom)
// .append("g")
// .attr("transform",
// "translate(" + margin.left + "," + margin.top + ")");


// .attr("viewBox", [0, 0, width, extraHeight])
// .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

// Set the sankey diagram properties
var sankey = d3.sankey()
.nodeWidth(36)
.nodePadding(40)
.size([width, height]);

console.log(d3.sankey())

var path = sankey.link();

var csvData = null;
var svg = null;


export function createSankeyChart(filtered_countries) {
    console.log("Creating Sankey chart");
    // Check if SVG already exists, if not create one
    const svgContainer = d3.select("#sankey-compensation-chart");
    svg = svgContainer.select("svg");
    if (svg.empty()) {
        console.log("empty Sankey chart");
        svg = svgContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    } else {
        console.log("***");
        // Clear the existing content in the SVG
        svg.selectAll("*").remove();
    }
    
    if (csvData == null) {
        // Load data once
        d3.csv("./data/compensation-sankey.csv").then(data => {
            csvData = data; // Store the loaded data
            drawSankeyChart(csvData, filtered_countries); // Initial set of countries
        });
    }
    else 
        drawSankeyChart(csvData, filtered_countries);
}

// load the data
function drawSankeyChart(data, filtered_countries) {
    
    //set up graph in same style as original example but empty
    let graph = { "nodes": [], "links": [] };
    
    console.log(data)
    
    // data = data.filter(d => ["France", "Spain", "Finland", "Germany"].includes(d.Country));
    data = data.filter(d => filtered_countries.includes(d.Country));
    data = data.slice(0, 70);
    
    // Create nodes and links for the Sankey diagram
    data.forEach(d => {
        // const stages = [d.Country, d.Employment, d.EdLevel, d.DevCategory, d.DevType, d.CompRange];
        const stages = [d.Country, d.Employment, d.EdLevel, d.CompRange];
        stages.forEach((stage, i) => {
            if (i < stages.length - 1) {
                graph.nodes.push({ "name": stage });
                graph.nodes.push({ "name": stages[i + 1] });
                graph.links.push({
                    "source": stage,
                    "target": stages[i + 1],
                    "value": +d.CompTotal / (stages.length - 1) // Distribute value across links
                });
            }
        });
    });
    
    // Deduplicate nodes
    let nodeMap = new Map();
    graph.nodes.forEach(node => nodeMap.set(node.name, node));
    graph.nodes = Array.from(nodeMap.values());
    
    // Replace node names in links with node objects
    graph.links.forEach(link => {
        link.source = graph.nodes.find(n => n.name === link.source);
        link.target = graph.nodes.find(n => n.name === link.target);
    });
    
    // Set up and configure Sankey layout
    sankey
    .nodes(graph.nodes)
    .links(graph.links)
    .layout(32);
    
    // Creates the paths that represent the links.
    const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(graph.links)
    // .enter().append("g")
    .join("g")
    .style("mix-blend-mode", "multiply");
    
    
    // Create gradients for the links
    link.append("linearGradient")
    .attr("id", d => {
        d.uid = generateUID("");
        return d.uid;
    })
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", d => d.source.x1)
    .attr("x2", d => d.target.x0)
    .each(function(d) {
        const gradient = d3.select(this);
        gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d => color(d.source.name));
        gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d => color(d.target.name));
    });
    
    link.append("path")
    .attr("d", path)
    .attr("class", "link")
    // .attr("stroke", d => `#000`)
    .attr("stroke", d => `url(#${d.uid})`)
    .style("stroke-width", function (d) { return Math.max(1, d.dy); }) // Ensure non-negative stroke width
    .sort(function (a, b) { return b.dy - a.dy; });
    
    
    // Add titles to links
    link.append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);
    
    
    // Add nodes
    var node = svg.append("g").selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .call(d3.drag()
    .subject(d => d)
    .on("start", function() { this.parentNode.appendChild(this); })
    .on("drag", dragmove));
    
    // Add rectangles for the nodes
    node.append("rect")
    .attr("height", d => Math.max(1, d.dy))
    .attr("width", sankey.nodeWidth())
    .style("fill", d => color(d.name.replace(/ .*/, "")))
    .style("stroke", d => d3.rgb(color(d.name.replace(/ .*/, ""))).darker(2))
    .append("title")
    .text(d => `${d.name}\n${format(d.value)}`);
    
    
    // add in the title for the nodes
    node.append("text")
    .attr("x", -6)
    .attr("y", function (d) { return d.dy / 2; })
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("transform", null)
    .text(function (d) { return d.name; })
    .filter(function (d) { return d.x < width / 2; })
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start");

    // Add compensation label at the end

    // const legendDALabel = svg.append("text")
    // .attr("x", chartEnd)
    // .attr("y", height / 2)
    // .attr("font-size", 10)
    // .attr("font-family", "Montserrat, sans-serif")
    // .attr("fill", "#000")
    // .text("Compensation in €");
    
    // the function for moving the nodes
    
    function dragmove(event, d) {
        // console.log(link)
        d3.select(this)
        .attr("transform",
        "translate("
        + d.x + ","
        + (d.y = Math.max(
            0, Math.min(height - d.dy, event.y))
            ) + ")");
            sankey.relayout();
            svg.selectAll("path")
            .attr("d", path);
    }
        
}
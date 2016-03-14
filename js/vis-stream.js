var years = [
	"2005",
	"2006",
	"2007",
	"2008",
	"2009",
	"2010",
	"2011",
	"2012",
	"2013"
];

var margin = {top: 20, right: 40, bottom: 60, left: 60};
var width = 800 - margin.left - margin.right,
	height = 400 - margin.top - margin.bottom;

var SVG = d3.select("#stream-holder").append("svg")
	.attr("class", "viz-holder")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var formatDate = d3.time.format("%Y");

// Scale initialization
var xScale = d3.scale.ordinal()
	.domain(years)
	.rangeRoundPoints([0, width]);

var yScale = d3.scale.linear()
	.domain([0, 2600])
	.range([height, 0]);

var colorScale = d3.scale.category10();

// Axis initialization
var xAxis = d3.svg.axis()
	.scale(xScale)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(yScale)
	.orient("left");

var xAxisGroup = SVG.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0," + height + ")");

xAxisGroup.append("text")
	.attr("class", "axis-title")
	.attr("x", 0.5 * width)
	.attr("y", "3em")
	.style("text-anchor", "middle")
	.text("Year");

var yAxisGroup = SVG.append("g")
	.attr("class", "axis");

yAxisGroup.append("text")
	.attr("class", "axis-title")
	.attr("transform", "rotate(-90)")
	.attr("x", -0.5 * height)
	.attr("y", -50)
	.style("text-anchor", "middle")
	.text("Funding (Million USD)");


// Stack Function
var stack = d3.layout.stack()
	.offset("zero")
	.values(function(d) {return d.funds;})
	.x(function(d) {return d.year;})
	.y(function(d) {return d.fund;});

// Initialize line chart
var areaFunction = d3.svg.area()
	.x(function(d) {
		return xScale(d.year);
	})
	.y0(function(d) {
		return yScale(d.y0);
	})
	.y1(function(d) {
		return yScale(d.y0 + d.y);
	})
	.interpolate("cardinal");


// Tooltip
var tooltip = d3.tip().attr("class", "d3-tip")
	.html(function(d) {
		return  "<div class='tooltip-title'><p>" + d.source + "</p></div>";
	});
SVG.call(tooltip);


loadData();

var layers;


// Load CSV file
function loadData() {
	d3.csv("data/global-funding.csv", function(error, csv) {
		filteredCSV = csv.slice(0, csv.length - 1);
		colorScale.domain(filteredCSV.map(function(d) {
			return d.Source;
		}));
		var globalFunding = [];
		filteredCSV.forEach(function(d) {
			var funds = [];
			years.forEach(function(y) {
				if (d[y] == "--") d[y] = 0;
				else d[y] = +d[y];
				funds.push({year: y, fund: d[y]});
			});
			globalFunding.push({source: d.Source, funds: funds});
		});
		layers = stack(globalFunding);
		console.log(layers);

		updateVisualization();
	});
}

// Render visualization
function updateVisualization() {
	SVG.selectAll(".layer")
		.data(layers)
		.enter().append("path")
		.attr("class", "layer")
		.attr("d", function(d) {
			return areaFunction(d.funds);
		})
		.style("fill", function(d, i) {
			return colorScale(d.source);
		})
		.on("mouseover", function(d, i) {
			SVG.selectAll(".layer")
				.transition().duration(250)
				.attr("opacity", function(d, j) {
					return j != i ? 0.5 : 1;
				});
			tooltip.show(d);
		})
		.on("mouseout", function(d, i) {
			SVG.selectAll(".layer")
				.transition().duration(250)
				.attr("opacity", "1");
			tooltip.hide(d);
		});

	xAxisGroup.call(xAxis);
	yAxisGroup.call(yAxis);
}

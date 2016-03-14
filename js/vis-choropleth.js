
var width = 960,
	height = 600;

var colors = [
	"#ffffb2",
	"#fecc5c",
	"#fd8d3c",
	"#f03b20",
	"#bd0026",
];

var quantizeScale = d3.scale.quantize()
	.range(d3.range(5).map(function(i) {return colors[i];}));

var projection = d3.geo.mercator()
	.translate([width/2, height/2])
	.scale(400);

var path = d3.geo.path()
	.projection(projection);

var data = {};
var geomap;

// --> CREATE SVG DRAWING AREA
var svg = d3.select("#choropleth-holder").append("svg")
	.attr("width", width)
	.attr("height", height);

d3.select("#choropleth-data").on("change", updateChoropleth);

// Initialize tooltip
var tip = d3.tip().attr("class", "d3-tip");
svg.call(tip);

// Initialize legend
var keyheight = 20,
	keywidth = 20,
	boxwidth = 100,
	boxmargin = 10;

var ranges = quantizeScale.range().length;

var legend = svg.append("g")
	.attr("transform", "translate(200, 400)")
	.attr("class", "legend");

var lb = legend.append("rect")
	.attr("class", "legend-box")
	.attr("width", boxwidth)
	.attr("height", ranges * keyheight + 2 * boxmargin);

var li = legend.append("g")
	.attr("transform", "translate(8, " + boxmargin + ")")
	.attr("class", "legend-items");

li.selectAll("rect")
	.data(quantizeScale.range().map(function(color) {
		var d = quantizeScale.invertExtent(color);
		return d[0];
	}))
	.enter().append("rect")
	.attr("y", function(d, i) {
		return i * keyheight;
	})
	.attr("width", keywidth)
	.attr("height", keyheight)
	.style("fill", function(d) {
		return quantizeScale(d);
	});

var legendLabelGroup = legend.append("g")
	.attr("transform", "translate(" + (keywidth + 1.5 * boxmargin) + ", 0)");


// Use the Queue.js library to read two files

queue()
	.defer(d3.json, "data/africa.topo.json")
	.defer(d3.csv, "data/global-malaria-2015.csv")
	.await(function(error, mapTopJson, malariaDataCsv){
	
	// --> PROCESS DATA
	// Process GeoData
	var geodata = topojson.feature(mapTopJson, mapTopJson.objects.collection).features;
	// console.log(geodata);

	// Draw Map
	geomap = svg.selectAll("path")
		.data(geodata)
		.enter()
		.append("path")
		.attr("d", path)
		.style("stroke", "black")
		.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut);

	// console.log(geomap);

	// Process Data
	data = malariaDataCsv.filter(function(d) {
		return (d.WHO_region == "African");
	});
	data.forEach(function(d) {
		stringToNumber(d, "UN_population");
		stringToNumber(d, "At_risk");
		stringToNumber(d, "At_high_risk");
		stringToNumber(d, "Suspected_malaria_cases");
		stringToNumber(d, "Malaria_cases");
	});
	// console.log(data);

	// Update choropleth
	updateChoropleth();
	});


function updateChoropleth() {
	var selected = d3.select("#choropleth-data").property("value");
	var selectedText = $("#choropleth-data option:selected").text();
	quantizeScale.domain([0, d3.max(data, function(d) {
		return d[selected];
	})]);
	var newdata = {};
	data.forEach(function(d) {
		if (d[selected] >= 0) {
			var country_id = d.Code;
			newdata[country_id] = d[selected];
		}
	});
	// --> Choropleth implementation
	geomap.attr("fill", function(d) {
		if (newdata.hasOwnProperty(d.properties.adm0_a3_is)) {
			return quantizeScale(newdata[d.properties.adm0_a3_is]);
		}
		else {
			return "rgba(221, 221, 221, 0.3)";
		}
	});

	tip.html(function(d) {
		var country_name = d.properties.name;
		var country_stat;
		if (newdata.hasOwnProperty(d.properties.adm0_a3_is)) {
			country_stat = newdata[d.properties.adm0_a3_is];
			if (selected == "At_risk" || selected == "At_high_risk") {
				country_stat = d3.format("%")(country_stat/100);
			}
			else {
				country_stat = d3.format(",")(country_stat);
			}
		}
		else {
			country_stat = "Unknown";
		}

		return "<div class='tooltip-title'><p>" + country_name + "</p><p>" +
			selectedText + ": " + country_stat + "</p></div>";
	});

	var labels = quantizeScale.range().map(function(color) {
		var d = quantizeScale.invertExtent(color);
		return d[0];
	});
	labels.push(quantizeScale.domain()[1]);

	// console.log(labels);

	var legend_labels = legendLabelGroup.selectAll("text")
		.data(labels);

	legend_labels.exit().remove();

	legend_labels.enter().append("text")
		.attr("y", function(d, i) {
			return (i * keyheight);
		})
		.attr("dy", 15)
		.style("font-size", 10);

	legend_labels
		.text(function(d) {
			var threshold;
			if (selected == "At_risk" || selected == "At_high_risk") {
				threshold = d3.format("%")(d/100);
			}
			else {
				threshold = d3.format(",")(Math.round(d));
			}
			return threshold;
		});


}

function stringToNumber(obj, attr) {
	if (obj[attr] == "N/A") {
		obj[attr] = -1;
	}
	else {
		obj[attr] = +obj[attr];
	}
}

function handleMouseOver(d) {
	tip.show(d);
	d3.select(this)
		.style("stroke-width", 3);
}

function handleMouseOut(d) {
	tip.hide(d);
	d3.select(this)
		.style("stroke-width", 1);
}
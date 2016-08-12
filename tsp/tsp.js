/*
The MIT License (MIT)

Copyright (c) 2014 Jerry Gamble

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


var metadata = {
    "graphHeight": 0, "graphWidth": 0
}

function parseInputText(data){

	//clear data
    metadata = {
        "graphHeight": 0, "graphWidth": 0
    }

	data = data.trim();
	
	var lines = data.split(REGEX_NEWLINE);
	var nbPoints = parseInt(lines[0]);
	
	if(lines.length != nbPoints+1){
		reportError("input did not match input format");
		cleanViz();
		return null;
	}
	
	//console.log(nbPoints);
	var minX = Infinity;
	var maxX = -Infinity;
	var minY = Infinity;
	var maxY = -Infinity;
	
	var points = [];
	for(var i=1; i<(nbPoints+1); i++){
	
		var parts = lines[i].split(REGEX_WHITESPACE);
		var point = {'x':parseFloat(parts[0]), 'y':parseFloat(parts[1]), "index" : i-1};

		minX = Math.min(minX, point['x']);
		maxX = Math.max(maxX, point['x']);
		minY = Math.min(minY, point['y']);
		maxY = Math.max(maxY, point['y']);
		
		points = points.concat(point);
	}
	
	points['size'] = nbPoints;
	points['x_min'] = minX;
	points['x_max'] = maxX;
	points['x_span'] = maxX - minX;
	points['y_min'] = minY;
	points['y_max'] = maxY;
	points['y_span'] = maxY - minY;
	
	//benchmark summary
	var metadataStr = "";
    d3.selectAll("#problemTable tbody *").remove();
	d3.selectAll("#solutionTable tbody *").remove();

    metadataStr += "<tr><td colspan='2' class='metaSectionTitle'>Problem</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Customers</td><td class='metaValue'>" + points['size'] + "</td></tr>";
	
    d3.select("#problemTable tbody").html(metadataStr);

	return points;
	
}

function parseSolutionText(data, size){
	console.log("loading data");
	
	data = data.trim();
	
	var lines = data.split(REGEX_NEWLINE);
	var seq = lines[1].split(REGEX_WHITESPACE);
	
	for (var i=0; i < seq.length; i++){
		seq[i] = parseInt(seq[i]);
	}

  //solution details
    var metadataStr = "";
    var obj = roundNumber(lines[0].split(REGEX_WHITESPACE)[0], 4)

    d3.selectAll("#solutionTable tbody *").remove();
	
    metadataStr += "<tr><td colspan='2' class='metaSectionTitle'>Your Solution</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Objective Value</td><td class='metaValue'>" + obj + "</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Optimal?</td><td class='metaValue'>" + lines[0].split(REGEX_WHITESPACE)[1] + "</td></tr>";
	
	d3.select("#solutionTable tbody").html(metadataStr);	
	
	if (checkValidity(seq, obj)) {
    	return seq;
    } else {
        return null;
    }
}

function cleanViz(){
	var svg = d3.select("#viz svg").data([]).exit().remove();
}

function vizBenchmark(benchmark){

	try {
	
		//if (benchmark.length > 10000) {
			//d3.select("body")
			//	.append("div")
			//	.attr("class", "waiting")
			//	.style("opacity", 1)
			//	.html("CALCULATING...");
		//}
	
		//chart width based on available space
		metadata.graphWidth = DEFAULT_GRAPH_WIDTH;

		//chart width
		try {
			metadata.graphWidth = d3.select("#viz")[0][0].clientWidth;
		} catch (ex) {
			reportError(ex);
		}

		//chart height based on available space
		metadata.graphHeight = DEFAULT_GRAPH_HEIGHT;

		try {
			metadata.graphHeight = window.innerHeight - d3.select("#data")[0][0].offsetTop - X_AXIS_PAD;

			if (metadata.graphHeight < 1) {
				metadata.graphHeight = DEFAULT_GRAPH_HEIGHT;
			}

		} catch (ex) {
			reportError(ex);
		}

		constraintProportions(benchmark, metadata.graphWidth, metadata.graphHeight)

		var circleSize = Math.min(Math.max(1, metadata.graphWidth / benchmark['size']),5);
		benchmark['circle_size'] = circleSize
		
		var xScale = d3.scale.linear()
			.domain([benchmark['x_min'], benchmark['x_max']])
			.range([Y_AXIS_PAD + PAD_ADJUST, metadata.graphWidth - PAD_ADJUST]);
		
		var yScale = d3.scale.linear()
			.domain([benchmark['y_min'], benchmark['y_max']])
			.range([metadata.graphHeight - PAD_ADJUST - X_AXIS_PAD, PAD_ADJUST]);
		
		benchmark['x_scale'] = xScale
		benchmark['y_scale'] = yScale

		cleanViz();
		
		var svg = d3.select("#viz")
			.append("svg")
			.attr("class", "svgMain")
			.attr("width", metadata.graphWidth)
			.attr("height", metadata.graphHeight);

		//parent group for nodes and links
		svg.append("g").attr("id", "links");
		svg.append("g").attr("id", "nodes");
		
		var xAxisLabel = "X Coordinate"
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(Math.round(metadata.graphWidth/100)+1);
		
		
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + (metadata.graphHeight - X_AXIS_PAD) + ")")
			.call(xAxis)
			.append("text")
				.attr("class", "axis axis_label")
				.attr("text-anchor", "middle")
				.attr("x", (metadata.graphWidth-Y_AXIS_PAD)/2+Y_AXIS_PAD)
				.attr("y", X_AXIS_PAD-5)
				.text(xAxisLabel);
		
		
		var yAxisLabel = "Y Coordinate"
		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(Math.round(metadata.graphHeight/100)+1);
		
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(" + Y_AXIS_PAD + ",0)")
			.call(yAxis)
			.append("text")
				.attr("class", "axis axis_label")
				.attr("text-anchor", "middle")
				.attr("x", -(metadata.graphHeight-X_AXIS_PAD)/2)
				.attr("y", -Y_AXIS_PAD+10)
				.attr("transform", "rotate(-90)")
				.text(yAxisLabel);
		
		//tool tips for circles
		d3.selectAll("div.tooltip").remove();
		var div = d3.select("body")
			.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);
		
		svg.select("#nodes").selectAll("circle")
			.data(benchmark)
			.enter()
			.append("circle")
			.attr("fill", NODE_COLOR)
			.attr("cx", function(d) {return xScale(d['x']);})
			.attr("cy", function(d) {return yScale(d['y']);})
			.attr("r", circleSize)
			.on("mouseover", function (d) {

				//prevent tool tip from falling off page
				var left = d3.event.pageX;
				if ((left + div[0][0].clientWidth) > window.innerWidth) {
					left = left - div[0][0].clientWidth;
				}
				
				div.transition()
					.duration(200)
					.style("opacity", .85)
					.style("left", (left) + "px")
					.style("top", (d3.event.pageY - 25) + "px");
				div.html("#" + d.index + " (X:" + d.x + ", Y:" + d.y + ")");
			})
			.on("mouseout", function (d) {
				div.transition()
					.duration(500)
					.style("opacity", 0);
			});
			
	} catch (fx) {
		reportError(fx);
	} finally {
	}
		
}

function vizSolution(solution){

	var edges = [];
	for (var i=0; i < solution.length-1; i++){
		var edge = {'from':benchmark[solution[i]], 'to':benchmark[solution[i+1]]};
		//console.log(edge)
		edges = edges.concat(edge);
	}
	edges = edges.concat({'from':benchmark[solution[solution.length-1]], 'to':benchmark[solution[0]]});
	console.log(edges)
	
	var xScale = benchmark['x_scale'];
	var yScale = benchmark['y_scale'];
	var svg = d3.select("#viz svg");
	
	svg.selectAll("line").data([]).exit().remove();
	
	svg.select("#links").selectAll(".line")
		.data(edges)
		.enter()
		.append("line")
		.attr("x1", function(d) {return xScale(d['from']['x']);})
		.attr("y1", function(d) {return yScale(d['from']['y']);})
		.attr("x2", function(d) {return xScale(d['to']['x']);})
		.attr("y2", function(d) {return yScale(d['to']['y']);})
		.attr("stroke", LINE_COLOR)
		.attr("stroke-opacity", "0.5")
		.attr("stroke-width", benchmark['circle_size'] / 2);
		
	svg.select("#nodes").selectAll("circle")
        .attr("fill", function(d) {return d.error ? ERROR_NODE_COLOR : NODE_COLOR;})
		.attr("r", function(d) {return d.error ? benchmark['circle_size'] + 2 : 
		                                         benchmark['circle_size'] ;});
		
}

function loadBenchmark(text){
	console.log("loading data");
	console.log(text);
	benchmark = parseInputText(text)
	if(benchmark != null){
		vizBenchmark(benchmark)
	}
}

function loadSolution(text){
	console.log("loading solution");
	console.log(text);
	if(typeof benchmark === 'undefined' || benchmark == null){
		reportError("cannot load a solution before a benchmark")
		return
	}
	solution = parseSolutionText(text)
	if(solution != null){
		vizSolution(solution)
	}
}

function checkValidity(solution, obj) {
    // check validity and report errors.
    // Return value indicates whether rendering should be attempted. 

    var errors = [];
	if(solution.length != benchmark.size){
		errors.push("Expected " + benchmark.size + " nodes in solution but found " 
		            + solution.length + ".");
	}
	var visited = [];
	for (var i = 0; i < benchmark.length; i++) { 
	    visited[i] = 0 
	}
	for (var i = 0; i < solution.length; i++) {
        if (solution[i] < 0 || solution[i] >= benchmark.length) {
            reportError("Solution includes bad node number: " + solution[i]);
            return false;
        }
        visited[solution[i]] += 1 
    }
    
    var length = roundNumber(solution.reduce(function(x, n, i, sol) {
        return x + dist(benchmark[sol[i]], benchmark[sol[(i+1) % sol.length]]);
        }, 0), 4);
    if (length != obj) {
        errors.push("Solution reports length as " + obj + ", but actual length is " 
                    + length + ".");
    }
            
    revisited = []
    unvisited = []
    for (var i = 0; i < benchmark.length; i++) {
        if (visited[i] == 0) {
            unvisited.push(i);
            benchmark[i].error = true;
        } else if (visited[i] > 1) {
            revisited.push(i);
            benchmark[i].error = true;
        }
    }
    
    if (unvisited.length > 0) {
        errors.push(errorMessage(unvisited, "not visited", "Node"));
    }
    
    if (revisited.length > 0) {
        errors.push(errorMessage(revisited, "visited more than once", "Node"));
    }
    
    reportError(errors.join(" "));
    return true;
}    
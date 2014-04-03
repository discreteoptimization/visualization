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

"use strict";

var metadata = {
    "graphHeight": 0, "graphWidth": 0, "circleSize": 0, "centerX": 0, "centerY": 0, "xScale": null, "yScale": null, "lineScale": null
}

var edges;
var nodes;
var colors;
var colorAssignments;
var nodeCt = 0;
var edgeCt = 0;

function parseInputText(data){

	//clear data
    metadata = {
        "graphHeight": 0, "graphWidth": 0
    }

	data = data.trim();
	
	var lines = data.split(REGEX_NEWLINE);
	nodeCt = parseInt(lines[0].split(REGEX_WHITESPACE)[0]);
    edgeCt = parseInt(lines[0].split(REGEX_WHITESPACE)[1]);
	
	if(lines.length != edgeCt+1){
		reportError("input did not match input format");
		cleanViz();
		return null;
	}
    
    //parse nodes
    nodes = new Array();
    for (var i = 0; i < nodeCt; i++) {
        nodes.push ({index: i, colorIndx: 0, color: NODE_COLOR, fixed: false});
    }
    
    //parse edges
    edges = new Array();
    var n1;
    var n2;
    
	for(var i=1; i<(edgeCt+1); i++){
	
		var parts = lines[i].split(REGEX_WHITESPACE);
		n1 = parseFloat(parts[0]), 
        n2 = parseFloat(parts[1]);

        edges.push ({source : n1, target : n2});
        
	}
	
	//benchmark summary
	var metadataStr = "";
    d3.selectAll("#problemTable tbody *").remove();
	d3.selectAll("#solutionTable tbody *").remove();

    metadataStr += "<tr><td colspan='2' class='metaSectionTitle'>Problem</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Nodes</td><td class='metaValue'>" + nodeCt + "</td></tr>";
	metadataStr += "<tr><td class='metaElement'>Edges</td><td class='metaValue'>" + edgeCt + "</td></tr>";
    
    var degree = calcDegree(nodes, edges);
    
    metadataStr += "<tr><td class='metaElement'>Min. Degree</td><td class='metaValue'>" + degree[0] + "</td></tr>";
	metadataStr += "<tr><td class='metaElement'>Max. Degree</td><td class='metaValue'>" + degree[1] + "</td></tr>";
	metadataStr += "<tr><td class='metaSeperator' colspan='2'></td></tr>";
	metadataStr += "<tr><td class='metaGraphElement' colspan='2'><p class='title'>DEGREE DISTRIBUTION</p><div id='degreeHistogram'></div></td></tr>";
    
    d3.select("#problemTable tbody").html(metadataStr);
    
    //plot the distribution of degrees
    d3.select("#degreeHistogram svg").data([]).exit().remove();
    d3.select("#degreeHistogram svg").remove();
    plotDegrees(degree[0], degree[1], degree[2]);
    
    vizBenchmark();

}

function plotDegrees(minDegree, maxDegree, degreeCts) {

    // A formatter for counts.
    var formatCount = d3.format(",.0f");
    var width = d3.select("#degreeHistogram")[0][0].clientWidth;
    var height = d3.select("#degreeHistogram")[0][0].clientHeight;
    var axisZone = 21;
    
    var x = d3.scale.linear()
        .domain([Math.max(1, minDegree - 1), maxDegree + 1])
        .range([0, width]);
    
    var data = d3.layout.histogram()
        .bins(20)
        .range([minDegree, maxDegree])
        (degreeCts);  
        
    //count the number of non-empty bins
    var count = 1;
    for (var i = 0; i < data.length; i ++) {
        if (data[i].length > 0) {
            count ++;
        }
    }
    
    //if there were less than 20 bins redo the histogram layout
    if (count < 20) {
    
        data = d3.layout.histogram()
        .bins(x.ticks(count))
        .range([minDegree, maxDegree])
        (degreeCts);  
    
    }
    
    var barWidth = (width/ count) - 2;
       
    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([0, height - axisZone]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(count);

    var svg = d3.select("#degreeHistogram").append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", "0 0 " + width + " " +height)
        .attr("preserveAspectRatio","none")
        .append("g");

    var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { 
            return "translate(" + x(d.x) + "," + (height - y(d.y) - axisZone) + ")"; 
        });

    bar.append("rect")
        .attr("x", 1)
        .style("stroke", LINE_COLOR)
        .style("fill", LINE_COLOR)
        .style("stroke-width", 1)
        .attr("width", barWidth)
        .attr("height", function(d) { 
            return y(d.y);
        });

    bar.append("text")
        .style("fill", function(d) { 
            
            if (y(d.y) < axisZone) {
                return "#777";
            } else {
                return "white";
            }

        })
        .style("z-index", 10)
        .style("font-size", "65%")
        .style("font-family", "Abel, sans-serif")
        .attr("dy", ".75em")
        .attr("y", function(d) { 
            
            if (y(d.y) < axisZone) {
                return -12;
            } else {
                return 6;
            }

        })
        .attr("x", (barWidth / 2) + 1)
        .attr("text-anchor", "middle")
        .text(function(d) { 
            return formatCount(d.y); 
        });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - axisZone) + ")")
        .call(xAxis);
        
}

function parseSolutionText(data){

	data = data.trim();
    
	var lines = data.split(REGEX_NEWLINE);
	var colorAssignments = lines[1].split(REGEX_WHITESPACE).map(Number);
    var colorsUsed =  roundNumber(lines[0].split(REGEX_WHITESPACE)[0], 4);
    var isOptimal = lines[0].split(REGEX_WHITESPACE)[1];
    var errors = []
	
    //grab a color for each used
    colors = makeColorGradient(colorsUsed);
    
	if(colorAssignments.length != nodeCt){
		reportError("Solution size does not match benchmark size");
		return null;
	}
	
	var sortedColors = colorAssignments.slice().sort();
	var normalizedColors = [];
	var colorsAssigned = 0;
	sortedColors.forEach(function(color) {
	    if (typeof normalizedColors[color] === 'undefined') {
	        normalizedColors[color] = colorsAssigned++;
	    }
	});
	
	if (colorsAssigned != colorsUsed) {
	    errors.push("Solution claims to use " + colorsUsed + 
	                " colors, but uses " + colorsAssigned + ".");
	}

    nodes.forEach (function (node, i) {
        node.colorIndx = colorAssignments[i];
        node.color = colors[normalizedColors[colorAssignments[i]]];
    });
        
    // Check for bad edges
    var badEdgeStrings = [];
    var badEdges = [];
    edges.forEach( function(edge) {
        if (edge.source.colorIndx == edge.target.colorIndx) {
            badEdgeStrings.push('('+edge.source.index+', '+edge.target.index + ')');
            badEdges.push(edge);
        }
    });
    
    if (badEdges.length > 0) {
        errors.push(errorMessage(badEdgeStrings, "", "Bad edge"));
    }
    
    if (errors.length > 0) {
        reportError(errors.join(" "));
    }
    
    //solution details
    var metadataStr = "";

    d3.selectAll("#solutionTable tbody *").remove();
	
    metadataStr += "<tr><td colspan='2' class='metaSectionTitle'>Your Solution</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Colors Used</td><td class='metaValue'>" + colorsUsed + "</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Optimal?</td><td class='metaValue'>" + isOptimal + "</td></tr>";
	
	d3.select("#solutionTable tbody").html(metadataStr);	

    vizSolution(badEdges);
}

function vizSolution(badEdges) {
    var svg = d3.select("#viz svg");
    svg.select("#nodes").selectAll(".node")
        .attr("fill", function(d) {return d.color;})
        
    var canvas = document.getElementById('badEdgeCanvas');
    canvas.height = metadata.graphHeight;
    canvas.width = metadata.graphWidth;
    
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = "rgba(200,0,0," + 1 + ")";
    ctx.lineWidth = 2;

    badEdges.forEach ( function (edge) {
        console.log(edge.source.colorIndx+ ", " + edge.target.colorIndx);
        ctx.beginPath();
        ctx.moveTo(metadata.xScale(edge.source.x), metadata.yScale(edge.source.y));
        ctx.lineTo(metadata.xScale(edge.target.x), metadata.yScale(edge.target.y));
        ctx.stroke();
        ctx.closePath();
    });
}

function cleanViz(){

    d3.select("#viz svg").data([]).exit().remove();
    d3.select("#viz svg").remove();
    
    var canvas = document.getElementById('edgeCanvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    canvas = document.getElementById('badEdgeCanvas');
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
}

function vizBenchmark(){

    cleanViz();

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
    
    metadata.centerX = metadata.graphWidth  / 2;
    metadata.centerX = metadata.graph  / 2;
    metadata.circleSize = Math.min(Math.max(1, metadata.graphWidth / (nodeCt/4)),10);
    
    //scaler for line width
    metadata.lineScale = d3.scale.linear()
        .domain([0, 50000, 500000])
        .range([.25, .05, .01]);
    
    var svg = d3.select("#viz")
        .append("svg")
        .attr("class", "svgMain")
        .attr("width", metadata.graphWidth)
        .attr("height", metadata.graphHeight);
        
    var borderPath = svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", metadata.graphHeight)
      .attr("width", metadata.graphWidth)
      .style("stroke", VERTICES_COLOR)
      .style("fill", "none")
      .style("stroke-width", 1);

    //parent group for nodes and links
    svg.append("g").attr("id", "nodes");
    
    //tool tips for circles
    d3.selectAll("div.tooltip").remove();
    var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    //force simulation
    displayStatus("Setting up visualization...<br\>please wait");
    var force = d3.layout.force()
        .nodes(nodes)
        .links(edges)
        .size([metadata.graphWidth, metadata.graphHeight]);

    
    //todo: need a better model for exponentially decreasing force parameters
    //this is a temp work around
    if (nodeCt < 100) {
        force.linkStrength(2);
        force.charge(-390);
        force.linkDistance(60);
    } else { 
        force.linkStrength(.5);
        force.charge(-90);
        force.linkDistance(60);
    }
    
    force.start();
        
    force.on("end", function(e) {

        var min_vals = findMinMaxCoords (nodes);
        
        metadata.xScale = d3.scale.linear()
            .domain([min_vals.minX, min_vals.maxX])
            .range([PAD_ADJUST * 4, metadata.graphWidth - (PAD_ADJUST * 4)]);
        
        metadata.yScale = d3.scale.linear()
            .domain([min_vals.minY, min_vals.maxY])
            .range([PAD_ADJUST * 4, metadata.graphHeight - (PAD_ADJUST * 4)]);
      
        //draw edges on canvas rather than in SVG for performance
        var canvas = document.getElementById('edgeCanvas');
        canvas.height = metadata.graphHeight;
        canvas.width = metadata.graphWidth;
        
        var ctx = canvas.getContext('2d');
        ctx.strokeStyle = "rgba(0,0,0," + metadata.lineScale(edgeCt) + ")";

        edges.forEach ( function (edge) {
            ctx.beginPath();
            ctx.moveTo(metadata.xScale(edge.source.x), metadata.yScale(edge.source.y));
            ctx.lineTo(metadata.xScale(edge.target.x), metadata.yScale(edge.target.y));
            ctx.stroke();
            ctx.closePath();
        });
      
        //draw nodes
        svg.select("#nodes").selectAll(".node")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("fill", function(d) {return d.color;})
            .attr("cx", function(d) {return metadata.xScale(d.x);})
            .attr("cy", function(d) {return metadata.yScale(d.y);})
            .attr("r", metadata.circleSize)
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
                div.html("#" + d.index + " (Color:" + d.colorIndx + ")");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
               
        removeStatus();
      
    });     

}

function calcDegree(nodes, edges) {

    var degree = Array.apply(null, new Array(nodes.length)).map(Number.prototype.valueOf,0);
    var minDegree = 0;
    var maxDegree = 0;

    edges.forEach (function(edge) {
        degree[edge.source]++;
        degree[edge.target]++;
    });
    
    minDegree = degree[0];
    
    degree.forEach (function(degree) {
        minDegree = Math.min(degree, minDegree);
        maxDegree = Math.max(degree, maxDegree);
    });  
    
    return [minDegree, maxDegree, degree];

} 

function displayStatus (message) {

    //status message
    d3.selectAll("div.status").remove();
    var div = d3.select("body")
        .append("div")
        .attr("class", "status")
        .style("opacity", 1)
        .html(message);

}

function removeStatus () {
    d3.selectAll("div.status").remove();
}

function findMinMaxCoords (nodes) {

    var response = {minX: 0, minY: 0, maxX: 0, maxY: 0};

    response.minX = nodes[0].x;
    response.minY = nodes[0].y;
    response.maxX = nodes[0].x;
    response.maxY = nodes[0].y;
    
    nodes.forEach (function(node) {
        response.minX = Math.min (response.minX, node.x);
        response.minY = Math.min (response.minY, node.y);
        response.maxX = Math.max (response.maxX, node.x);
        response.maxY = Math.max (response.maxY, node.y);   
    });
    
    return response;

}

function loadBenchmark(text){
    parseInputText(text);
}

function loadSolution(text){
	parseSolutionText(text);
}
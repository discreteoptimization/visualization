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
    "isOptimal": 0, "objectiveVal": 0, "itemCount": 0, "setCount": 0,
    "graphHeight": 0, "graphWidth": 0, "circleSize": 0
}
var sets = [];
var items = [];
var colors = [];
var links = [];
var nodes;
var lines;
var force;

function parseInputText(data) {

    //clear data
    metadata = {
    "isOptimal": 0, "objectiveVal": 0, "itemCount": 0, "setCount": 0, 
    };
	

    data = data.trim();
        
    var lines = data.split(REGEX_NEWLINE);
    var params = lines[0].split(REGEX_WHITESPACE);

    metadata['itemCount'] = parseInt(params[0]);
    metadata['setCount'] = parseInt(params[1]);
    
    var expectedLines = metadata.setCount + 1;
    if (lines.length != expectedLines) {
        reportError("Input format incorrect: should have " + expectedLines 
                     + " lines but has " + lines.length + ".");
        return false;
    }
        
    items = [];
    for (var i = 0; i < metadata.itemCount; i++) {
      items[i] = { i: i, coveredBy: [] }
    }
    
	  sets = [];
	  links = [];
    var parts, theSet;
    for (var i = 1; i < metadata.setCount + 1; i++) {

        parts = lines[i].trim().split(REGEX_WHITESPACE);

        theSet = { 'i': i-1, 'cost':parseFloat(parts[0])}
        theSet.items = parts.slice(1).map(function(el) { return parseInt(el); });
        sets[i - 1] = theSet;
        for (var j = 0; j < theSet.items.length; j++) {
          items[theSet.items[j]].coveredBy.push(i-1);
          links.push({source:theSet, target:items[theSet.items[j]]});
        }
    }
    

    
    return true;
}
    
function parseSolutionText(data, size) {
  
    data = data.trim();
        
    var lines = data.split(REGEX_NEWLINE);

    //solution params
    var params = lines[0].split(REGEX_WHITESPACE);
    metadata.objectiveVal = parseFloat(params[0]);
    metadata.isOptimal = parseInt(params[1]);

    //facility assignments
    var assignments = lines[1].split(REGEX_WHITESPACE);
    
    for (var i = 0; i < facilities.length; i++) {
        facilities[i].capacityUsed = 0;
    }
    
    for (var i = 0; i < customers.length; i++) {
        if (i >= assignments.length || assignments[i] < 0 || 
                                       assignments[i] >= facilities.length) {
            customers[i].facility = null;
        } else {
    	    facilities[assignments[i]].capacityUsed += customers[i].demand;
	        customers[i].facility = facilities[Number(assignments[i])];
	    }
    }
    
    return checkValidity();
}
    
function cleanViz(){
    var svg = d3.select("#viz svg").data([]).exit().remove();
}
    
function vizBenchmark() {
    
    var itemX = 10;
    var itemDeltaY = 2;
    
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
    var nodeCt = metadata.itemCount + metadata.setCount;
    metadata.circleSize = Math.min(Math.max(1, metadata.graphWidth / (nodeCt/4)),10);
    
    //data
    var metadataStr = "";
    d3.selectAll("#problemTable tbody *").remove();
	  d3.selectAll("#solutionTable tbody *").remove();

    metadataStr += "<tr><td colspan='2' class='metaSectionTitle'>Problem</td></tr>";
    metadataStr += "<tr><td class='metaElement'><img src='images/square.png'> Sets</td><td class='metaValue'>" + metadata.setCount + "</td></tr>";
    metadataStr += "<tr><td class='metaElement'><img src='images/circle.png'> Items</td><td class='metaValue'>" + metadata.itemCount + "</td></tr>";

    d3.select("#problemTable tbody").html(metadataStr);
    //tool tips for circles
	  d3.selectAll("div.tooltip").remove();
    var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
	
	  //unique colors for each set
	  colors = makeColorGradient(metadata.setCount);
    
   	force = d3.layout.force()
        .gravity(1)
        .linkDistance(50)
        .linkStrength(.5)
        .charge(-500)
        .size([metadata.graphWidth, metadata.graphHeight])
        .nodes(sets.concat(items))
        .links(links);
	  
	  var drag = force.drag()
        .on("dragstart", function(d) { d.fixed = true; });
	  		  
		var svg = d3.select("#viz")
        .append("svg")
        .attr("class", "svgMain")
		
    //parent groups for sets, items, and links
    svg.append("g").attr("id", "links");
    svg.append("g").attr("id", "sets");
    svg.append("g").attr("id", "items");
		  
	  //sets
    var squares = svg.select("#sets").selectAll("rect")
        .data(sets)
        .enter()
        .append("rect")
        .attr("id", function (d) { return "setPnt" + d.i; })
		    .attr("fill", function(d) {return colors[d.i];})
		    .style("opacity", 1)
        .call(force.drag)
        .on("dblclick", function(d) { d.fixed = false; })
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
          div.html("Set " + d.i);
          svg.selectAll(".set"+d.i)
//               .transition()
//               .duration(20)
              .classed("highlighted", true);

          })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
            svg.selectAll(".set"+d.i)
//                 .transition()
//                 .duration(20)
                .classed("highlighted", false);
        });
		
  	//items
    var circles = svg.select("#items").selectAll("circle")
        .data(items)
        .enter()
        .append("circle")
        .attr("id", function (d) { return "itemPnt" + d.i; })
        .attr("class", function(d) {
            var classes = "item"+d.i
            for (var i = 0; i < d.coveredBy.length; i++) {
              classes = classes + " set"+d.coveredBy[i];
            }
            return classes; 
            })
		    .attr("fill", NODE_COLOR)
		    .style("opacity", 1)
        .call(force.drag)        
        .on("dblclick", function(d) { d.fixed = false; })
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
          div.html("Item " + d.i);
        })
        .on("mouseout", function (d) {
            div.transition()
               .duration(500)
               .style("opacity", 0);
        });

    //links
    lines = svg.select("#links").selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("id", function (d) { return "set" + d.source.i + "item"+d.target.i; })
        .attr("class", function(d) { return "set"+d.source.i +" item"+d.target.i; })
        .style("opacity", .5)
        .attr("stroke", "#888888");
   	
		force.on("tick", function() {
		  lines.attr("x1", function(d) { return d.source.x; })
           .attr("y1", function(d) { return d.source.y; })
           .attr("x2", function(d) { return d.target.x; })
           .attr("y2", function(d) { return d.target.y; });
      squares.attr("x", function(d) { return (d.x - metadata.circleSize); } );
      squares.attr("y", function(d) { return (d.y - metadata.circleSize); } );
      circles.attr("cx", function(d) { return d.x; } );
      circles.attr("cy", function(d) { return d.y; } );
    });
    
    selectViz(document.getElementById("vizType").value)
}

function selectViz(option) {
    switch (option) {
        case "forceGraph":
            vizForce();
            break;
        case "bipartiteGraph":
            vizBipartite();
            break;
        case "matrix":
            vizMatrix();
            break;
    }
}

function vizMatrix() {
    force.stop();
    var svg = d3.select("#viz .svgMain");
    svg.selectAll("circle, rect").each(function(d) { d.fixed = true; });
    var inc = Math.min(metadata.graphHeight/(sets.length+1), 
                       metadata.graphWidth/(items.length+1));
    if (inc < 8) inc = 8;
    
    // make sure svg is large enough
    var minHeight = inc * (sets.length + 1);
    var minWidth = inc * (items.length + 1);
    if (minHeight > svg[0][0].clientHeight) svg.style("height", minHeight);
    if (minWidth > svg[0][0].clientWidth) svg.style("width", minWidth);
    
    var circleSize = Math.min(inc*.45, metadata.circleSize);
    for (var i = 0; i < sets.length; i++) {
        sets[i].x = sets[i].px = .5*inc;
        sets[i].y = sets[i].py = (i+1.5)*inc;
    }
    for (var i = 0; i < items.length; i++) {
        items[i].x = items[i].px = (i+1.5)*inc;
        items[i].y = items[i].py = .5*inc;
    }
    svg.selectAll("circle")
      .transition()
      .duration(500)
      .attr("cx", function(d) { return d.x })
      .attr("cy", function(d) { return d.y })
      .attr("r", circleSize);
    svg.selectAll("rect")
      .transition()
      .duration(500)
      .attr("x", function(d) { return d.x  - circleSize})
      .attr("y", function(d) { return d.y  - circleSize})
      .attr("width", circleSize*2)
      .attr("height", circleSize*2);
    svg.selectAll("line")
      .transition()
      .duration(500)
      .attr("x1", function(d) { return d.target.x-circleSize; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x+circleSize; })
      .attr("y2", function(d) { return d.source.y; })
      .attr("stroke-width", circleSize*2);
    svg.classed("matrix",true);
    svg.classed("graph",false);
}   

function vizForce() {
    var svg = d3.select("#viz .svgMain");
    svg.selectAll("circle, rect").each(function(d) { d.fixed = false; });
    svg.selectAll("line")
      .attr("stroke-width", 1);
    svg.selectAll("circle")
      .attr("r", metadata.circleSize);
    svg.selectAll("rect")
      .attr("width", metadata.circleSize*2)
      .attr("height", metadata.circleSize*2)
    force.start();
    svg.classed("matrix",false);
    svg.classed("graph",true);
}

function vizBipartite() {
    force.stop();
    var svg = d3.select("#viz .svgMain");
    svg.selectAll("line")
      .attr("stroke-width", 1)
    svg.selectAll("circle, rect").each(function(d) { d.fixed = true; });
    
    var inc = (metadata.graphHeight-2*metadata.circleSize)/sets.length;
    var cols = Math.ceil(3*metadata.circleSize/inc);
    for (var i = 0; i < sets.length; i++) {
        sets[i].x = sets[i].px = metadata.graphWidth/6 + 3 * metadata.circleSize * (i % cols);
        sets[i].y = sets[i].py = metadata.circleSize + i*inc;
    }
    inc = (metadata.graphHeight-2*metadata.circleSize)/items.length;
    cols = Math.ceil(3*metadata.circleSize/inc);
    for (var i = 0; i < items.length; i++) {
        items[i].x = items[i].px = metadata.graphWidth*5/6 - 3 * metadata.circleSize * (i % cols);
        items[i].y = items[i].py = metadata.circleSize + i*inc;
    }
    svg.selectAll("circle")
      .transition()
      .duration(500)
      .attr("r", metadata.circleSize)
      .attr("cx", function(d) { return d.x })
      .attr("cy", function(d) { return d.y });
    svg.selectAll("rect")
      .transition()
      .duration(500)
      .attr("width", metadata.circleSize*2)
      .attr("height", metadata.circleSize*2)
      .attr("x", function(d) { return d.x  - metadata.circleSize})
      .attr("y", function(d) { return d.y  - metadata.circleSize});
    svg.selectAll("line")
      .transition()
      .duration(500)
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
    svg.classed("matrix",false);
    svg.classed("graph",true);
}
    
    
function vizSolution() {

    //solution details
	d3.selectAll("#solutionTable tbody *").remove();
	
    var metadataStr = "";
    metadataStr += "<tr><td colspan='2' class='metaSectionTitle'>Your Solution</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Objective Value</td><td class='metaValue'>" + roundNumber(metadata["objectiveVal"], 4) + "</td></tr>";
    metadataStr += "<tr><td class='metaElement'>Optimal?</td><td class='metaValue'>" + metadata.isOptimal + "</td></tr>";

    d3.select("#solutionTable tbody").html(d3.select("#solutionTable tbody").html() + metadataStr);

    var line_width = metadata.circle_size / 2;
        
    var xScale = d3.scale.linear()
        .domain([metadata.x_min, metadata.x_max])
        .range([Y_AXIS_PAD + PAD_ADJUST, metadata.graphWidth - PAD_ADJUST]);

    var yScale = d3.scale.linear()
        .domain([metadata.y_min, metadata.y_max])
        .range([metadata.graphHeight - PAD_ADJUST - X_AXIS_PAD, PAD_ADJUST]);

    var svg = d3.select("#viz svg");
   
    //assign colors to customers to match assigned facility
	svg.select("#customers").selectAll("circle")
		.attr("fill", function(d) {
		    if (d.facility == null) {
		        return NODE_COLOR;
			} else {
			    return colors[d.facility.i];
	        }
		}
	);

	//draw connecting lines
// 	svg.select("#links").selectAll("line").data([]).exit().remove();
	
	for (var i = 0; i < customers.length; i++) {
	    if (customers[i].facility == null) {
	        continue;
	    }
	
		svg.select("#links")
			.append("line")
			.attr("id", function (d) { return "assignLine" + (i + 1); })
			.attr("x1", function(d) {
				var cust = customers[i];
				return xScale(cust.x);
			})
			.attr("y1", function(d) {
				var cust = customers[i];
				return yScale(cust.y);
			})
			.attr("x2", function(d) {
				var fac = customers[i].facility;
				return xScale(fac.x);
			})
			.attr("y2", function(d) {
				var fac = customers[i].facility;
				return yScale(fac.y);
			})
			.attr("stroke-width", metadata.circle_size)
			.attr("stroke", function(d) {
				var fac = customers[i].facility;
				return colors[fac.i];
			})
			.style("opacity", .5);;
	
	}

}
    
function loadBenchmark(text){
    if (parseInputText(text));
    vizBenchmark();
}
    
function loadSolution(text){
    var valid = parseSolutionText(text)
    if (valid) {
        vizSolution();
    }
}

function checkValidity() {
	var errors = [];
	var cost = 0;
	var unassigned = []
	customers.forEach(function(cust) {
	    if (cust.facility === null) {
	        unassigned.push(cust.index)
	    } else {
    	    cost += dist(cust, cust.facility);
    	}
	});
	if (unassigned.length > 0) {
	     errors.push(errorMessage(unassigned, "not assigned to a valid facility",
	                              "Customer"));
	}
	
	var overCapacity = [];
	facilities.forEach(function(fac) {
	    if (fac.capacityUsed > fac.capacity) {
	        overCapacity.push(fac.index) ;  
	    }
	    if (fac.capacityUsed > 0) {
	        cost += fac.cost;
	    }
	});
	if (overCapacity.length > 0) {
	    errors.push(errorMessage(overCapacity, "over capacity", 
	                             "Facility", "Facilities"));
	}
	if (Math.abs(cost - metadata.objectiveVal) > .01) {
	    errors.push("Solution reports cost as " + roundNumber(metadata.objectiveVal,4) 
	                + ", but actual cost is " + roundNumber(cost,4) 
	                + ".");
	}
    
    reportError(errors.join(" "));
    return true;
}
    
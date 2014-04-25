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

var LINK_COLOR = "#888888";
var SET_COLOR = "#aaaaaa";
var COVERED_ITEM_COLOR = "#00aa00";
var HIGHLIGHTED_LINK_COLOR = "#4488ff";
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
      items[i] = { i: i, sets: [], covered: false }
    }
    
	  sets = [];
	  links = [];
    var parts, theSet;
    for (var i = 1; i < metadata.setCount + 1; i++) {

        parts = lines[i].trim().split(REGEX_WHITESPACE);

        theSet = { 'i': i-1, 'cost':parseFloat(parts[0]), 'chosen': false}
        theSet.items = parts.slice(1).map(function(el) { return parseInt(el); });
        sets[i - 1] = theSet;
        for (var j = 0; j < theSet.items.length; j++) {
          items[theSet.items[j]].sets.push(i-1);
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

    //set choices
    var choices = lines[1].trim().split(REGEX_WHITESPACE);
    
    for (var i = 0; i < items.length; i++) {
        items[i].covered = false;
    }    
    
    for (var i = 0; i < sets.length; i++) {
        if (i >= choices.length || choices[i] == 0) {
            sets[i].chosen = false;
        } else {
            sets[i].chosen = true;
            for (var j = 0; j < sets[i].items.length; j++) {
                items[sets[i].items[j]].covered = true;
            }
	    }
    }
    
    return true;  
//     return checkValidity();
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
		    .attr("fill", SET_COLOR)        
		    .attr("class", function(d) {
            var classes = "set"+d.i
            for (var i = 0; i < d.items.length; i++) {
              classes = classes + " item"+d.items[i];
            }
            return classes; 
            })
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
          div.html("Set " + d.i + ". Cost: " + d.cost);
          
          svg.selectAll(".set"+d.i)
              .classed("highlighted", true);
          var connectors = svg.append("g")
                .attr("id", "set"+d.i+"g")
                .style("pointer-events", "none");
          for (var i = 0; i < d.items.length; i++) {
              var item = items[d.items[i]];
              var link = svg.select("line#set"+d.i+"item"+item.i);
              var linkX = (parseFloat(link.attr("x1")) + parseFloat(link.attr("x2")))/2;
              var linkY = (parseFloat(link.attr("y1")) + parseFloat(link.attr("y2")))/2;
              connectors.append("line")
                        .attr("stroke", d.chosen ? 
                              colors[d.i] : LINK_COLOR)
                        .attr("stroke-width", 4)
                        .attr("x1", d.x)
                        .attr("y1", d.y)
                        .attr("x2", linkX)
                        .attr("y2", linkY);
              connectors.append("line")
                        .attr("stroke", d.chosen ? 
                              colors[d.i] : LINK_COLOR)
                        .attr("stroke-width", 4)
                        .attr("x1", item.x)
                        .attr("y1", item.y)
                        .attr("x2", linkX)
                        .attr("y2", linkY);         
            }
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
            svg.selectAll(".set"+d.i)
                .classed("highlighted", false);
            svg.selectAll("g#set"+d.i+"g")
                .transition()
                .duration(100)
                .style("opacity",0)
                .remove();
        });
		
  	//items
    var circles = svg.select("#items").selectAll("circle")
        .data(items)
        .enter()
        .append("circle")
        .attr("id", function (d) { return "itemPnt" + d.i; })
        .attr("class", function(d) {
            var classes = "item"+d.i
            for (var i = 0; i < d.sets.length; i++) {
                classes = classes + " set"+d.sets[i];
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
          
          svg.selectAll(".item"+d.i)
              .classed("highlighted", true);
          var connectors = svg.append("g")
                .attr("id", "item"+d.i+"g")
                .style("pointer-events", "none");
          for (var i = 0; i < d.sets.length; i++) {
              var theSet = sets[d.sets[i]];
              var link = svg.select("line#set"+theSet.i+"item"+d.i);
              var linkX = (parseFloat(link.attr("x1")) + parseFloat(link.attr("x2")))/2;
              var linkY = (parseFloat(link.attr("y1")) + parseFloat(link.attr("y2")))/2;
              connectors.append("line")
                        .attr("stroke", theSet.chosen ? 
                              colors[theSet.i] : LINK_COLOR)
                        .attr("stroke-width", 4)
                        .attr("x1", d.x)
                        .attr("y1", d.y)
                        .attr("x2", linkX)
                        .attr("y2", linkY);
              connectors.append("line")
                        .attr("stroke", theSet.chosen ? 
                              colors[theSet.i] : LINK_COLOR)
                        .attr("stroke-width", 4)
                        .attr("x1", theSet.x)
                        .attr("y1", theSet.y)
                        .attr("x2", linkX)
                        .attr("y2", linkY);         
            }
        })
        .on("mouseout", function (d) {
            div.transition()
               .duration(500)
               .style("opacity", 0);
            svg.selectAll(".item"+d.i)
                .classed("highlighted", false);
            svg.selectAll("g#item"+d.i+"g")
                .transition()
                .duration(100)
                .style("opacity",0)
                .remove();
        });

    //links
    lines = svg.select("#links").selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("id", function (d) { return "set" + d.source.i + "item"+d.target.i; })
        .attr("class", function(d) { return "set"+d.source.i +" item"+d.target.i; })
        .style("opacity", .5)
        .attr("stroke", LINK_COLOR);
   	
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
      .attr("stroke-width", function(d) { return d.source.chosen ? 2 : 1; });
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
      .attr("stroke-width", function(d) { return d.source.chosen ? 2 : 1; })
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

    var svg = d3.select("#viz svg");
   
    //assign colors to customers to match assigned facility
	svg.select("#items").selectAll("circle")
		.classed("covered", function(d) { return d.covered } );

	//draw connecting lines
// 	svg.select("#links").selectAll("line").data([]).exit().remove();
	
    svg.select("#links").selectAll("line")
        .attr("stroke", function(d) {
            if (d.source.chosen) {
                return colors[d.source.i];
            } else {
                return NODE_COLOR;
            } 
        })
        .attr("stroke-width", function(d) { return d.source.chosen ? 2 : 1; });
    svg.select("#sets").selectAll("rect")
        .attr("fill", function(d) {
            if (d.chosen) {
                return colors[d.i];
            } else {
                return NODE_COLOR;
            } 
        });
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
    
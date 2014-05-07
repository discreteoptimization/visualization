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
var metadata = {
    "isOptimal": 0, "objectiveVal": 0, "itemCount": 0, "setCount": 0,
    "graphHeight": 0, "graphWidth": 0
}
var sets = [];
var items = [];
var colors = [];
var links = [];

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

}
    
function cleanViz(){
    var svg = d3.select("#viz svg").data([]).exit().remove();
}

function setGraphSize(minWidth, minHeight) {
    // set graph size to largest of:
    //      default size
    //      available space in window
    //      minimum size for current visualization (passed as arguments)
    
    var availableWidth = 0, 
        availableHeight = 0;
    try {
        availableWidth = d3.select("#viz")[0][0].clientWidth;
        availableHeight = window.innerHeight - 
                          d3.select("#data")[0][0].offsetTop - X_AXIS_PAD;
    } catch (ex) {
        reportError(ex);
    }

    metadata.graphWidth = Math.max(availableWidth, DEFAULT_GRAPH_WIDTH, minWidth);
    metadata.graphHeight = Math.max(availableHeight, DEFAULT_GRAPH_HEIGHT, minHeight);
    
    d3.select("#viz svg")
        .attr("width", metadata.graphWidth)
        .style("width", metadata.graphWidth)
        .attr("height", metadata.graphHeight)
        .style("height", metadata.graphHeight);
}   

function vizBenchmark() {
    
    cleanViz();
    
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
	  	  
    var svg = d3.select("#viz")
        .append("svg")
        .attr("class", "svgMain");
		
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
          if (svg.classed("matrix")) {
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
          if (svg.classed("matrix")) {
              for (var i = 0; i < d.sets.length; i++) {
                  var theSet = sets[d.sets[i]];
                  var link = svg.select("line#set"+theSet.i+"item"+d.i);
                  var linkX = (parseFloat(link.attr("x1")) + parseFloat(link.attr("x2")))/2;
                  var linkY = (parseFloat(link.attr("y1")) + parseFloat(link.attr("y2")))/2;
                  connectors.append("line")
                            .attr("stroke", LINK_COLOR)
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
    svg.select("#links").selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("id", function (d) { return "set" + d.source.i + "item"+d.target.i; })
        .attr("class", function(d) { return "set"+d.source.i +" item"+d.target.i; })
        .style("opacity", .5)
        .attr("stroke", LINK_COLOR);
        
    selectViz(document.getElementById("vizType").value)
}

function selectViz(option) {
    switch (option) {
        case "bipartiteGraph":
            vizBipartite();
            break;
        case "matrix":
            vizMatrix();
            break;
    }
}

function vizMatrix() {
    var svg = d3.select("#viz .svgMain");
    setGraphSize(0,0); // set size based on visible size or default
    var inc = Math.min(metadata.graphHeight/(sets.length+1), 
                       metadata.graphWidth/(items.length+1));
    if (inc < 5) {
        inc = 5;
        setGraphSize(inc * (items.length + 1), inc * (sets.length + 1));
    }
    
    var circleSize = inc*.45;
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

function vizBipartite() {
    var svg = d3.select("#viz .svgMain");

    svg.selectAll("line")
      .attr("stroke-width", function(d) { return d.source.chosen ? 2 : 1; })
    
    setGraphSize(0,0); // set size based on visible size or default
    var setInc = Math.max(metadata.graphHeight/(sets.length + 1),5);
    var itemInc = Math.max(metadata.graphHeight/(items.length + 1),5);
    var circleSize = Math.min(.45 * setInc, .45 * itemInc, 10);
    
    var cols = Math.ceil(setInc * (sets.length+1) / metadata.graphHeight);
    for (var i = 0; i < sets.length; i++) {
        sets[i].x = sets[i].px = metadata.graphWidth/6 + 3 * circleSize * (i % cols);
        sets[i].y = sets[i].py = circleSize + i*setInc/cols;
    }
    
    var cols = Math.ceil(itemInc * (items.length+1) / metadata.graphHeight);
    for (var i = 0; i < items.length; i++) {
        items[i].x = items[i].px = metadata.graphWidth*5/6 - 3 * circleSize * (i % cols);
        items[i].y = items[i].py = circleSize + i*itemInc/cols;
    }
    svg.selectAll("circle")
      .transition()
      .duration(500)
      .attr("r", circleSize)
      .attr("cx", function(d) { return d.x })
      .attr("cy", function(d) { return d.y });
    svg.selectAll("rect")
      .transition()
      .duration(500)
      .attr("width", circleSize*2)
      .attr("height", circleSize*2)
      .attr("x", function(d) { return d.x  - circleSize})
      .attr("y", function(d) { return d.y  - circleSize});
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

    // solution details
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
	
    var lines = svg.select("#links").selectAll("line")
        .attr("stroke", function(d) {
            if (d.source.chosen) {
                return colors[d.source.i];
            } else {
                return NODE_COLOR;
            } 
        })
    if (svg.classed("graph")) {
        lines.attr("stroke-width", function(d) { return d.source.chosen ? 2 : 1; });
    }
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
    
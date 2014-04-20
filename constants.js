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


var REGEX_WHITESPACE = /\s+/;
var REGEX_NEWLINE = /\r?\n/;
var REGEX_TRAILING_WHITESPACE = /\s+$/;
var DEBUG = true;
var DEFAULT_GRAPH_HEIGHT = 500;
var DEFAULT_GRAPH_WIDTH = 500;
var X_AXIS_PAD = 45;
var Y_AXIS_PAD = 45;
var PAD_ADJUST = 15;
var NODE_COLOR = "#777";
var ERROR_NODE_COLOR = "#C00";
var START_NODE_COLOR = "red";
var LINE_COLOR = "#2ba0d0";
var VERTICES_COLOR = "#777";
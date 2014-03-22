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


function roundNumber(number, digits) {
	var multiple = Math.pow(10, digits);
	var rndedNum = Math.round(number * multiple) / multiple;
	return rndedNum;
}

//Returns specified number of unique colors
function makeColorGradient(len) {

	var frequency = 1.665;
	var center = 128;
	var width = 100;
	var colors = [];

	if (len == undefined) {len = 50};
	
    for (var i = 0; i < len; ++i) {
       var red = Math.sin(frequency*i) * width + center;
       var grn = Math.sin(frequency*i + 2) * width + center;
       var blu = Math.sin(frequency*i + 4) * width + center;
       colors[i] = RGB2Color(red,grn,blu);
    }
	
	return colors;
	
}

function RGB2Color(r,g,b) {
    return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

function byte2Hex(n) {
    var nybHexString = "0123456789ABCDEF";
    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}
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

function reportError(msg) {
    document.getElementById("feedback").innerHTML=msg;
}

function clearError() {
    document.getElementById("feedback").innerHTML="";
}

function handleDragStart(e) {
    clearError();  // this / e.target is the source node.
}

function handleDragOver(e) {
    clearError()

    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }

    e.dataTransfer.dropEffect = 'copy';  // See the section on the DataTransfer object.

    return false;
}

function handleDragEnter(e) {
    // this / e.target is the current hover target.
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');  // this / e.target is previous target element.
}

function handleDragEnd(e) {
    //this.classList.remove('over');
    // this/e.target is the source node.
    var cols = document.querySelectorAll('.drop_zone');
    [].forEach.call(cols, function (col) {
        col.classList.remove('over');
    });
}


function getFiles(e) {
    var files = e.dataTransfer.files;
    if(files.length <= 0){
        reportError("please drop a file(s)")
        return [];
    }
    if(files.length > 2){
        reportError("please drop at most two files")
        return [];
    }
    return files
}

function readFilesAndLoad(files, loader) {
    if (!window.FileReader) {
        reportError('your browser does not have the necessary file reader API.');
        return;
    }
    
    var left = files.length
    var texts = []

    for (var i = 0; i < files.length; i++) {
        var reader = new FileReader();

        reader.onload = function(e) {
            //document.getElementById('debug').innerHTML = e.target.result;
            texts.push(e.target.result)
            if (--left == 0) loader(texts)
        }

        reader.onerror = function(e) {
            console.log(e.target);
            if (--left == 0) loader(texts)
        }

        reader.readAsText(files[i]);
    }
}

function loadFiles(texts){
    for (var i = 0; i < texts.length; i++) {
        if (isBenchmark(texts[i])) loadBenchmark(texts[i])
    }
    for (var i = 0; i < texts.length; i++) {
        if (!isBenchmark(texts[i])) loadSolution(texts[i])
    }
}

function handleDrop(e) {
    // this / e.target is current target element.
    e.stopPropagation(); // stops the browser from redirecting.
    e.preventDefault();

    var cols = document.querySelectorAll('.drop_zone');
    [].forEach.call(cols, function (col) {
        col.classList.remove('over');
    });
    
    // See the section on the DataTransfer object.
    files = getFiles(e)
    if(!files){
        return false;
    }

    //document.getElementById('debug').innerHTML = file; 
    readFilesAndLoad(files, loadFiles);
    return false;
}

/***
 *** Setup Handelers
 ***/
function setup() {

	var cols = document.querySelectorAll('.drop_zone');
	[].forEach.call(cols, function(col) {
		col.addEventListener('dragstart', handleDragStart, false);
		col.addEventListener('dragenter', handleDragEnter, false);
		col.addEventListener('dragleave', handleDragLeave, false);
		col.addEventListener('dragover',  handleDragOver, false);
		col.addEventListener('dragend',   handleDragEnd, false);
	});

	var cols = document.querySelectorAll('#drop_zone');
	[].forEach.call(cols, function(col) {
		col.addEventListener('drop', handleDrop, false);
	});

}

setup();




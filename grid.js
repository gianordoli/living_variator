
// ---------------
// Grid class
// ---------------

var Util = require('./game_util'); // utils
var Cell = require('./cell'); // cell class
var Vector = require('./vec'); // vector class 


function Grid(width, height, wrap){ // default wrap to true

	this.width = isNaN(width) ? 0 : width;
	this.height = isNaN(height) ? 0 : height;
	this.numCells = width * height;
	this.cells = [];
	this.wrap = (typeof(wrap) === "boolean") ? wrap : true;
	this.util = new Util();
	this.initCells();

}

// ----------
// FUNCTIONS:
// ----------

Grid.prototype.initCells = function(wrap){
	this.cells = this.cells.splice(0,this.cells.length); // splice to 0 / clear
	// init cells with x,y position
	for (var y=0; y<this.height; y++){
		for (var x=0; x<this.width; x++){
			this.cells.push(new Cell(x,y));
		}
	}
	// set cell neighbors
	wrap = (typeof(wrap) === "boolean") ? wrap : this.wrap;

	for (var y=0; y<this.height; y++){
		for (var x=0; x<this.width; x++){

			var idx = y*this.width+x;
			var n = this.findNeighborIndices(x,y,wrap);
			this.cells[idx].addNeighbors(n);
		}
	}
	return this.cells;
}

Grid.prototype.getCell = function(x,y,wrap){

	if (isNaN(x))
		return undefined;

	else if (isNaN(y))
		return cells[x]; // treat single number as array index

	else { // x,y

		wrap = (typeof(wrap) === "boolean") ? wrap : this.wrap;
		var idx;
		if (x < 0 || y < 0 || x >= this.width || y >= this.height){
			if (wrap) {
				var xG = x,
					yG = y;
				// wrap numbers
				if (x<0)
					xG = this.width + x;
				else if (x>=this.width)
					xG = x - this.width;

				if (y<0)
					yG = this.height + y;
				else if (y>=this.height)
					yG = y - this.height;

				// find index
				if (xG>=0 && xG<this.width && yG>=0 && yG<this.height)
					idx = yG*this.width+xG;
				else {
					console.log("tried to get cell for oob x,y: "+x+','+y+", converted to xG,yG: "+xG+','+yG);
					return undefined;
				}
			}
			else {
				console.log("tried to get cell for oob x,y: "+x+','+y);
				return undefined;
			}
		} 
		else idx = y*this.width+x;
		return this.cells[idx];
	}
}
Grid.prototype.getCellIndex = function(x,y,wrap){
	if (isNaN(x) || isNaN(y))
		return undefined;

	else { // x,y

		wrap = (typeof(wrap) === "boolean") ? wrap : this.wrap;
		var idx;
		if (x < 0 || y < 0 || x >= this.width || y >= this.height){
			if (wrap) {
				var xG = x,
					yG = y;
				// wrap numbers
				if (x<0)
					xG = this.width + x;
				else if (x>=this.width)
					xG = x - this.width;

				if (y<0)
					yG = this.height + y;
				else if (y>=this.height)
					yG = y - this.height;

				// find index
				if (xG>=0 && xG<this.width && yG>=0 && yG<this.height)
					idx = yG*this.width+xG;
				else {
					console.log("tried to get cell index for oob x,y: "+x+','+y+", converted to xG,yG: "+xG+','+yG);
					return undefined;
				}
			}
			else return undefined;
		} 
		else idx = y*this.width+x;
		return idx;
	}

}
Grid.prototype.setCell = function(x,y,cell){ // by x,y coord on grid
	if (cell instanceof Cell &&
		this.util.isNum(x) && x >= 0 && x <= this.width &&
		this.util.isNum(y) && y>=0 && y<=this.height)
	{
		var idx = y*width+x;
		this.cells[idx] = cell;
	}
	return this.cells;
}
Grid.prototype.setCells = function(cellArray){ // by array index
	if (Array.isArray(cellArray)){
		for (var i=0; i<cellArray.length || i<this.cells.length; i++){
			if (cellArray[i] instanceof Cell){
				this.cells[i] = cellArray[i];
			}
		}
	}
	return this.cells;
}
Grid.prototype.findNeighborIndices = function(x,y,wrap){
	var n = [];
	var c = this.getCell(x,y);
	if (typeof(c) === "undefined"){
		console.log("error trying to find neighbor indices for undefined Cell at "+x+','+y);
		return n;
	}
	wrap = (typeof(wrap) === "boolean") ? wrap : this.wrap;
	// neighbors
	// -- clockwise starting with top left
	var tl = this.getCellIndex(	x-1,	y-1,	wrap);
	var tc = this.getCellIndex(	x,		y-1,	wrap);
	var tr = this.getCellIndex(	x+1,	y-1,	wrap);
	var cr = this.getCellIndex(	x+1,	y,		wrap);
	var br = this.getCellIndex(	x+1,	y+1,	wrap);
	var bc = this.getCellIndex(	x,		y+1,	wrap);
	var bl = this.getCellIndex(	x-1,	y+1,	wrap);
	var cl = this.getCellIndex(	x-1,	y,		wrap);
	n = [tl,tc,tr,cr,br,bc,bl,cl];
	return n;
}

module.exports = Grid;
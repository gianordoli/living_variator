
// ----------------------------------------------
// Conway Game of Life - simpler, no dependencies
// ----------------------------------------------

var Util = require('./game_util');
var Cell = require('./cell'); // cell class
var Grid = require('./grid'); // game board
var Game = require('./game'); // game (update + draw)

function Conway (width, height, framerate) {

	this.game = new Game(width, height, framerate, false); // no wrap
	this.grid = this.game.grid;
	this.cells = this.game.cells;
	this.output = {};

	this.targetFps = isNaN(framerate) ? 30 : framerate;
	this.updateId = 0;
	this.util = new Util();

}

// in Conway's Game of Life, cells have boolean state: alive or dead
// every update, cell's state is determined by states of 8 neighbors on the grid


Conway.prototype.setup = function() {

	this.game.update = this.update; // set game update function

	for (var i=0; i<this.cells.length; i++){
		var c = this.cells[i];

		c.data = {alive: false, n: 0}; // all cells start dead

		// print cell data and neighbors
		console.log("cell " + c.name + ": ");

		if (Array.isArray(c.neighbors)){
			for (var n=0; n<c.neighbors.length; n++){
				var nIdx = c.neighbors[n];
				console.log(' n'+n+"- "+this.cells[nIdx].name);
			}
		} else {
			console.log("- error! no neighbor array!");
			good = false;
		}
	}
	return this;
}

Conway.prototype.start = function(){

	var self = this;
	this.updateId = setInterval( 
		function(){ 
			self.update();
			self.game.tick();
		}, 1000/this.targetFps );
	this.game.start();

}

Conway.prototype.stop = function(){
	if (this.updateId != 0){
		clearInterval(this.updateId);
		this.updateId = 0;
	}
	this.game.stop();
}

Conway.prototype.update = function(){

	var w = this.game.width;
	var h = this.game.height;
	var nCells = this.cells.length;
	var err = {};

	for (var i=0; i<nCells; i++){
		var c = this.cells[i];
		var n = this.calcNumLiveNeighbors(i);
		if (this.util.isNum(n)) { // if actual number

			// conway rules
			if (n < 2 || n > 3) c.data.alive = false;
			else if (n === 3) c.data.alive = true;
			// if 2, no change
			c.data.n = n; // save num alive neighbors
		}
		else {
			console.log("error! cell "+i+"'s neighbor data undefined");

		}
	}

	// draw
	var err = undefined;
	var data = 
		{
	        width: this.game.width,
           	height: this.game.height,
           	cells: this.cells,
           	output: this.output,
           	fps: this.game.fps
        }
	this.draw(err,data);
}

Conway.prototype.draw = function(err, data){ }

Conway.prototype.onDraw = function(callback) {
	if (typeof(callback) === "function"){

		this.draw = callback;
		return true;
	}
	return false;
}

Conway.prototype.initCell = function(x,y,alive){
	var c = this.grid.getCell(x,y);
	if (c instanceof Cell){
		c.data.alive = alive;
		return c;
	}
	else return undefined;
}

Conway.prototype.initSectionPercent = function(x1,y1,x2,y2,pctAlive){ // init x1-x2,y1-y2 box of cells, inclusive
	for (var x=x1; x<=x2 && x<this.game.width; x++){
		for (var y=y1; y<=y2 && y<this.game.height; y++){
			var a = (Math.random() <= pctAlive);
			this.initCell(x,y,a);
			var log = "cell at "+x+','+y+": ";
			log += a ? "alive" : "dead";
			console.log(log);
		}
	}
}

Conway.prototype.getSectionPercent = function(x1,y1,x2,y2){
	var nA = 0;
	var nC = 0;
	for (var x=x1; x<=x2 && x<this.game.width; x++){
		for (var y=y1; y<=y2 && y<this.game.height; y++){
			var c = this.grid.getCell(x,y);
			if (c instanceof Cell){
				if (typeof(c.data.alive) === "boolean"){
					nA += c.data.alive ? 1 : 0;
					nC++;
				}
			}
		}
	}
	if (nC > 0) return nA/nC;
	return 0;
}
Conway.prototype.calcNumLiveNeighbors = function(index){

	var n = 0; // num of alive neighbors

	if (this.util.isNum(index)){

		var c = this.cells[index];
		var neighbors = c.neighbors;

		for (var i=0; i<neighbors.length; i++){

			if (i>=8) return undefined; // too many neighbors			

			var nC = this.cells[neighbors[i]];
			if (typeof(nC.data.alive) === "boolean"){
				n += nC.data.alive ? 1 : 0;
			}
			else return undefined; // no alive/dead data for cell
		}

		return n; // return num live neighbors
	}
	else return undefined; // no cell array
}

module.exports = Conway;

// ------------------------------------------------
// Conway Game of Life - simpler, less dependencies
// ------------------------------------------------

var Fps = require('./fps');

function Conway (width, height, framerate, wrap) {

	this.width = isNaN(width) ? 100 : width;
	this.height = isNaN(height) ? 80 : height;
	this.targetFps = isNaN(framerate) ? 30 : framerate;
	this.wrap = (typeof(wrap) === boolean) ? wrap : false;
	this.cells = [];
	this.output = {};

	this.updateId = 0;
	this.fps = new Fps();
	this.setup();
}

// in Conway's Game of Life, cells have boolean state: alive or dead
// every update, cell's state is determined by states of 8 neighbors on the grid

Conway.prototype.start = function(){

	var self = this;
	this.updateId = setInterval( 
		function(){ 
			self.update();
		}, 1000/this.targetFps );
	this.fps.start();
}

Conway.prototype.stop = function(){
	if (this.updateId != 0){
		clearInterval(this.updateId);
		this.updateId = 0;
	}
	this.fps.stop();
}

Conway.prototype.setup = function() {

	for (var y=0; y<this.height; y++){
		for (var x=0; x<this.width; x++){

			var cell = 
			{
				alive: false, // all cells start dead
				x: x, // x pos
				y: y,  // y pos
				n: 0 // num alive neighbors
			}; 
			this.cells.push(cell); // top left to bottom right

		}
	}
	return this;
}

Conway.prototype.update = function(){

	var err = {}; // for draw callback

	for (var i=0; i<this.cells.length; i++){

		var c = this.cells[i];

		// ------------
		// conway rules
		// ------------

		if (c.n < 2 || c.n > 3) // die if lonely or overcrowded
			c.alive = false;

		else if (c.n === 3) // spawn if exactly 3 neighbors
			c.alive = true;

		// if c.n === 2, no change

		else if (c.n != 2){
			console.log("error: unknown neighbor data for cell index "+i+", neighbors: "+c.n);
		}
	}

	this.getAllNumNeighbors(); // recalc num neighbors

	// tick fps
	this.fps.tick();

	// draw
	var err = undefined;
	var data = 
		{
	        width: this.width,
           	height: this.height,
           	cells: this.cells,
           	output: this.output,
           	fps: this.fps.fps
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
	var c = this.getCell(x,y);
	if (typeof(c) != "undefined"){
		c.alive = alive;
		return c;
	}
	else return undefined;
}

Conway.prototype.initSectionPercent = function(x1,y1,x2,y2,pctAlive){ // init x1-x2,y1-y2 box of cells, inclusive
	var numInit = 0;
	for (var x=x1; x<=x2 && x<this.width; x++){
		for (var y=y1; y<=y2 && y<this.height; y++){
			var a = (Math.random() <= pctAlive);
			var c = this.initCell(x,y,a);
			if (typeof(c) != "undefined"){
				var log = "cell at "+x+','+y+": ";
				log += a ? "alive" : "dead";
				console.log(log);
				numInit++;
			}
			else {
				console.log("error initializing cell at "+x+','+y+" to "+a);
			}
		}
	}
	if (numInit > 0) this.getAllNumNeighbors();
	return this;
}

Conway.prototype.getSectionPercent = function(x1,y1,x2,y2){
	var numAlive = 0;
	var numCells = 0;
	for (var x=x1; x<=x2 && x<this.game.width; x++){
		for (var y=y1; y<=y2 && y<this.game.height; y++){
			var c = this.getCell(x,y);
			if (typeof(c) != "undefined"){
				if (typeof(c.alive) === "boolean"){
					numAlive += c.alive ? 1 : 0;
					numCells++;
				}
			}
		}
	}
	if (numCells > 0) return numAlive/numCells;
	else return 0;
}

Conway.prototype.getCell = function(x,y,wrap){
	if (isNaN(x) || isNaN(y))
		return undefined;

	else { // x,y

		wrap = (typeof(wrap) === "boolean") ? wrap : false; // wrap grid edges?

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
			else return undefined;
		} 
		else idx = y*this.width+x;
		return this.cells[idx];
	}
}

Conway.prototype.getAllNumNeighbors = function(){
	for (var i=0; i<this.cells.length; i++){
		var n = 0;
		var c = this.cells[i];

		// calc alive neighbors
		for (y=-1; y<=1; y++){
			for (x=-1; x<=1; x++){
				var nX = c.x+x;
				var nY = c.y+y;
				var nC = this.getCell(nX,nY,this.wrap);
				if (typeof(nC) != "undefined"){
					n += nC.alive ? 1 : 0;
				}
			}
		}
		c.n = n;
	}
}

module.exports = Conway;
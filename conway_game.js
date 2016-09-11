
// ------------------------------------------------
// Conway Game of Life - simpler, less dependencies
// ------------------------------------------------

var Fps = require('./fps');
var fs = require('fs');

function Conway (width, height, framerate, wrap) {

	this.width = isNaN(width) ? 100 : width;
	this.height = isNaN(height) ? 80 : height;
	this.targetFps = isNaN(framerate) ? 30 : framerate;
	this.wrap = (typeof(wrap) === "boolean") ? wrap : false;
	this.cells = [];
	this.input = {};
	this.output = {};
	this.score = []; // score for "music"
	this.scoreRow = 0; // current row for musical score reading
	this.nAlive = 0;

	this.updateId = 0;
	this.fps = new Fps();
	this.setup();
}

// in Conway's Game of Life, cells have boolean state: alive or dead
// every update, cell's state is determined by states of 8 neighbors on the grid

// ------------------------------------------- START/STOP

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

// ------------------------------------------- SETUP (called by constructor)
												// - inits grid of "dead" cells

Conway.prototype.setup = function() {

	for (var y=0; y<this.height; y++){
		for (var x=0; x<this.width; x++){

			var cell = 
			{
				idx: y*this.width+x,
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

// ------------------------------------------- UPDATE

Conway.prototype.update = function(){

	var err = undefined;

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

	// ----------------- recalc num neighbors for each cell in grid

	this.getAllNumNeighbors();

	// ----------------- tick fps
	this.fps.tick();

	// ----------------- do musical score
	this.getScore();

	// ----------------- calc output streams
	this.getOutputs();

	// ----------------- "draw" callback

	var data = 
		{
	        width: this.width,
           	height: this.height,
           	cells: this.cells,
           	input: this.input,
           	output: this.output,
           	score: this.score,
           	fps: this.fps.fps
        }
	this.draw(err,data);

	// log to file
	var scoreLog = '';
	for (var i=0; i<this.score.length; i++){
		scoreLog+=this.score[i];
	}
	scoreLog+='\n';
	fs.appendFile('score_log.txt',scoreLog);
}

// ------------------------------------------- "DRAW" CALLBACK ----------//
/* (passes data object: width, height, cells array, output streams, fps) */


Conway.prototype.draw = function(err, data){ }

Conway.prototype.onDraw = function(callback) { // set draw callback function
	if (typeof(callback) === "function"){

		this.draw = callback;
		return true;
	}
	return false;
}

// ------------------------------------------- INPUT / OUTPUT


Conway.prototype.addInput = function(x1,y1,x2,y2,name){
	if (typeof(name) === "string"){
		if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
			console.log("error adding input to NaN region x1,y1 : x2,y2: "+x1+','+y1+" : "+x2+','+y2);
		}
		else {
			this.input[name] = { x1:x1, y1:y1, x2:x2, y2:y2, pct: 0 };
			console.log("added input section "+name+" - x1,y1 : x2,y2: "+x1+','+y1+" : "+x2+','+y2);
		}
	}
	return this.input;
}

Conway.prototype.setInput = function(name, pct){
	if (typeof(name) === "string" && this.input.hasOwnProperty(name)) {
		if (isNaN(pct) || pct > 1.0 || pct < 0.0) { // pct must be between 0 and 1
			console.log("error setting input "+name+" pct: "+pct+" is invalid (must be 0-1)");
		}
		else {
			var i = this.input[name];
			i.pct = pct;
			this.initSectionPercent(i.x1,i.y1,i.x2,i.y2,i.pct); // init input section
		}
	}
	else {
		console.log("error setting input pct: "+name+" is invalid input stream");
	}
	return this.input;
}

Conway.prototype.clearInputs = function(){
	for (var inp in this.input) {
		if (this.input.hasOwnProperty(inp)) { 
			delete this.input[inp]; 
		} 
	}
	return this.input;
}

Conway.prototype.addOutput = function(x1,y1,x2,y2,name){
	if (typeof(name) === "string"){
		if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
			console.log("error adding output to NaN region x1,y1 : x2,y2: "+x1+','+y1+" : "+x2+','+y2);
		}
		else {
			this.output[name] = { x1:x1, y1:y1, x2:x2, y2:y2, pct: undefined, weightedPct: undefined };
			console.log("added output section "+name+" - x1,y1 : x2,y2: "+x1+','+y1+" : "+x2+','+y2);
		}
	}
	return this.output;
}

Conway.prototype.clearOutputs = function(){
	for (var out in this.output) {
		if (this.output.hasOwnProperty(out)) { 
			delete this.output[out]; 
		} 
	}
	return this.output;
}

Conway.prototype.getOutputs = function(){
	var totalPct = this.nAlive / this.cells.length; // get total pct alive for weighted Pct
	for (var out in this.output) {
	  if (this.output.hasOwnProperty(out)) {
	  	var o = this.output[out];
	  	o.pct = this.getSectionPercent(o.x1,o.y1,o.x2,o.y2);
	  	o.weightedPct = o.pct - totalPct;
	  		// negative value here means section is less alive than entire board
	  		// positive value means section is more alive than entire board
	  }
	}
	return this.output;
}

// ------------------------------------------- SCORE (musical data, line-by-line grid reading)
Conway.prototype.getScore = function(){

	this.score.splice(0,this.score.length); // empty array
	for (var x=0; x<this.width; x++){
		var a = this.getCell(x,this.scoreRow).alive ? 1 : 0;
		this.score.push(a);
	}
	this.scoreRow++;
	if (this.scoreRow >= this.height) this.scoreRow = 0; // wrap to beginning
}

// ------------------------------------------- SETTERS / GETTERS

Conway.prototype.initCell = function(x,y,alive){ // init single cell
	var c = this.getCell(x,y);
	if (typeof(c) != "undefined"){
		c.alive = alive;
		return c;
	}
	else return undefined;
}

Conway.prototype.initSectionPercent = function(x1,y1,x2,y2,pctAlive){ // init x1-x2,y1-y2 box of cells, inclusive
	var numAlive = 0, numInit = 0;
	if (isNaN(pctAlive) || pctAlive <=0 || pctAlive > 1){
		console.log("error init section "+x1+","+y1+":"+x2+","+y2+" - pctAlive out of range 0-1");
		return this;
	}
	for (var y=y1; y<=y2 && y<this.height; y++){
		for (var x=x1; x<=x2 && x<this.width; x++){
			var a = (Math.random() < pctAlive) ? true : false;
			var c = this.initCell(x,y,a);
			if (typeof(c) != "undefined"){
				if (a) numAlive++;
				numInit++;
			}
			else {
				console.log("error initializing cell at "+x+','+y+" to "+a);
			}
		}
	}
	if (numInit > 0) {
		this.getAllNumNeighbors();
		var pct = numAlive/numInit;
		console.log("inited section "+x1+","+y1+":"+x2+","+y2+" - alive/total: "+numAlive+"/"+numInit+" = "+pct.toFixed(4));

		/* testing */
		var pctTrue = this.getSectionPercent(x1,y1,x2,y2);
		console.log("tested: section "+x1+","+y1+":"+x2+","+y2+" - alive/total: "+pctTrue.toFixed(4));
	}
	return this;
}

Conway.prototype.getSectionPercent = function(x1,y1,x2,y2){ // calc pct alive in area
	var numAlive = 0;
	var numCells = 0;
	for (var x=x1; x<=x2 && x<this.width; x++){
		for (var y=y1; y<=y2 && y<this.height; y++){
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

Conway.prototype.getCell = function(x,y,wrap){ // retrieve cell by x,y location
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

Conway.prototype.getAllNumNeighbors = function(){ // calc num neighbors for each cell in grid
	var nAlive = 0;
	for (var i=0; i<this.cells.length; i++){
		var n = 0;
		var c = this.cells[i];
		if (c.alive) nAlive++;

		// calc alive neighbors
		for (y=-1; y<=1; y++){
			for (x=-1; x<=1; x++){
				var nX = c.x+x;
				var nY = c.y+y;
				var nC = this.getCell(nX,nY,this.wrap);
				if (typeof(nC) != "undefined" && c!=nC){
					n += nC.alive ? 1 : 0;
				}
			}
		}
		c.n = n;
	}
	this.nAlive = nAlive;
}

module.exports = Conway;
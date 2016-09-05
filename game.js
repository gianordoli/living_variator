
// ----------------
// Game class
// ----------------

var Util = require('./game_util');
var Grid = require('./grid');
var Cell = require('./cell'); // cell class


function Game (width,height,framerate) { // constructor

	// grid

	this.width = isNaN(width) ? 100 : width; // default 100 width
	this.height = isNaN(height) ? 80 : height; // default 80 height
	this.grid = new Grid(width,height);
	this.numCells = this.width*this.height;
	this.cells = this.grid.cells;

	// fps

	this.targetFps = framerate || 30;
	this.fps = 0; // fps tracker
	this.sumFps = 0; // fps calc sum over 1 sec
	this.nFramesThisSec = 0;  // frame ticker
	this.lastDrawTime = Date.now(); // unix timestamp of last frame for fps calc

	// loop id
	this.fpsId = 0;

}


// ----------
// FUNCTIONS:
// ----------

// ---------------------- start

Game.prototype.start = function(){

	// ----------------- LOOP intervals
	var self = this;

	// every second, average the per-frame fps
	this.fpsId = setInterval(function(){ self.updateFps(); }, 1000);

	return this;
}

// ---------------------- stop
Game.prototype.stop = function(){

	if (this.fpsId != 0){
		clearInterval(this.fpsId);
		this.fpsId = 0;
	}
	return this;
}

// ---------------------- tick -- call for fps update
Game.prototype.tick = function(){

	// ---------------------- calc per-frame fps

	this.nFramesThisSec++;
	var elapsedMs = Date.now() - this.lastDrawTime;
	this.sumFps += 1000/elapsedMs;
	this.lastDrawTime = Date.now();
}


// ---------------------- update fps (to be run every second)

Game.prototype.updateFps = function(){ // util to update fps every second (simply counts frames)
	this.fps = this.sumFps / this.nFramesThisSec;
	this.sumFps = 0;
	this.nFramesThisSec = 0;
	console.log("fps: "+this.fps);
}

// ---------------------- update loop

Game.prototype.update = function(){ }


module.exports = Game;





// ---------------------- returns array of neighbor data of a cell in form: { cellIndex, cellRadius, distance }
/*
Game.prototype.getNeighborsByRadius = function(cellIndex, radius){

	var nbs = [];

	if (isNaN(cellIndex) || cellIndex<0 || cellIndex>this.cells.length || isNaN(radius))
		return nbs;

	var c = this.cells[cellIndex];

	for (var i=0; i<this.cells.length; i++){

		if (i===cellIndex) continue; // skip self-comparison

		var cn = this.cells[i];
		var rad = cn.radius;
		var ins = false;

		// check if neighbor
		var dist = c.distToNeighbor(cn.x,cn.y,cn.radius);
		if (dist < c.neighborhoodRadius){
			if (c.radius > dist + cn.radius) ins = true; // if neighbor center is inside cell wall
			nbs.push({ cellIndex: i, radius: rad, distance: dist, inside: ins });
		}
	}

	return nbs; // returns array of cell indexes and distances
}
*/

/*

// ---------------------- update loop

Simulation.prototype.update = function(){

	var self = this;

	var divisions = []; // keeps indices of cells that should divide
	var feeding = []; // keeps indices of cells that are feeding
	var died = []; // keeps indices of cells that are eaten


	//  -------------------------
	//  LOOP #1: update movements
	//  -------------------------

	for (var i=0; i<self.cells.length; i++){

		var c = self.cells[i];
		c.update( self.envVar.neighborhoodScale );

		// ---------------------- bounce off walls

		if (c.x > self.width - c.radius){ // right
			c.vx *= -1;
			c.x = self.width - c.radius;
		}
		else if (c.x < c.radius){ // left
			c.vx *= -1;
			c.x = c.radius;
		}
		if (c.y > self.height - c.radius) { // bottom
			c.vy *= -1;
			c.y = self.height - c.radius;
		}
		else if (c.y < c.radius){ // top
			c.vy *= -1;
			c.y = c.radius;
		}

	}


	//  --------------------------------
	//  LOOP #2: find food and seek prey
	//  --------------------------------

	for (var i=0; i<self.cells.length; i++){

		var c = self.cells[i];

		// ---------------------- check for neighbors

		var neighbors = self.getNeighbors(i); // array of neigbors data: { index, radius, distance, eat }
		c.numNeighbors = neighbors.length;

		// ---------------------- check for food and new prey (closest neighbor smaller than this cell)
		
		var food = 0;
		var preyIdx = i; // init to self, otherwise will be index of prey cell
		var preyDist = c.neighborhoodRadius; // init to neighborhoodRadius, otherwise will be dist to prey cell

		for (var n=0; n<c.numNeighbors; n++){
			var nIdx = neighbors[n].cellIndex;
			var nRad = neighbors[n].radius;
			var nDist = neighbors[n].distance;
			var nIn = neighbors[n].inside;

			// if neighbor is smaller than me...
			if (nRad < c.radius) {

				if (nIn) { // food --- eat!
					food += nRad; // add growth amount
					if (this.contains(feeding,i) === false) feeding.push(i); // cell is feeding
					if (this.contains(died, nIdx) === false) died.push(nIdx); // add eaten cell to died set
				}
				else if (nDist < preyDist) { // best new prey so far
					preyIdx = nIdx;
				}
			}
		}

		// eat
		c.feed(food); // add food for cell to eat in next loop

		// seek prey

		if (preyIdx != i) {
			c.seek( self.cells[preyIdx].x, self.cells[preyIdx].y );
		}
		

		// ---------------------- check for mitosis (due to cell age or size)
		if ( c.age > self.envVar.mitosisWait ||  c.radius > self.envVar.maxRadius ) {

			if (c.radius * 0.5 >= self.envVar.minRadius) { // only if big enough
				if (this.contains(divisions,i) === false) divisions.push(i); // add to divisions set
				if (this.contains(died,i) == false) died.push(i); // add to died set
			}
		}
	}


	//  ----------------------------
	//  LOOPs #3: divide or die
	//  ----------------------------

	var logs = false;

	// divide
	if (divisions.length > 0) {

		console.log (divisions.length+' divisions');  logs = true;

		for (var i=0; i<divisions.length; i++){
			var idx = divisions[i];
	
			var c = self.cells[idx];

			var newRadius = c.radius * 0.5;
			if (newRadius < self.minRadius) newRadius = self.minRadius;

			// create 2 new cells

			// cell 1
			var vx = c.vy; // rotate 90 clockwise
			var vy = -c.vx;

			var normV = c.normalize(vx,vy);

			var x = c.x + normV.x*newRadius; // spread by radii
			var y = c.y + normV.y*newRadius;

			self.cells.push( 
				// create cell
				new Cell( x, y, newRadius, vx, vy, self.envVar.neighborhoodScale )
			);

			// cell 2
			vx = -c.vy; // rotate 90 counter-clockwise
			vy = c.vx;

			normV = c.normalize(vx,vy);

			x = c.x + normV.x*newRadius; // spread by radii
			y = c.y + normV.y*newRadius;

			self.cells.push( 
				// create cell
				new Cell( x, y, newRadius, vx, vy, self.envVar.neighborhoodScale )
			);

		}

	}


	//die
	var diedSort = [];
	if (died.length > 0) {
		console.log(died.length+' deaths');
		logs = true;
		diedSort = died.sort(); // set -> sorted array to iterate backwards
	}

	for (var i=diedSort.length-1; i>=0; i--) {
		self.cells.splice(diedSort[i],1); // remove from cell array
	}
	if (died.length > 0) {
		console.log(self.cells.length+' cells now alive');
		logs = true;
	}

	self.numCells = self.cells.length;
	if (logs) {
		console.log(self.numCells + ' cells now alive\n');
	}


	// ---------------------- draw on server?

	if (self.drawOnServer){
		self.draw(self);
	}

	// ---------------------- calc per-frame fps

	self.nFramesThisSec++;
	var elapsedMs = Date.now() - self.lastDrawTime;
	self.sumFps += 1000/elapsedMs;
	self.lastDrawTime = Date.now();


	// ---------------------- callback

	self.onDraw();
}



// ---------------------- draw loop - [DEPRECATED: REQUIRES NODE-CANVAS]

Simulation.prototype.draw = function(){

	var self = this;

	// bg
	self.ctx.fillStyle = "rgba(0,0,0,0.1)";
	self.ctx.fillRect(0,0,self.width,self.height);

	// draw cells
	for (var i=0; i<self.cells.length; i++){

		var c = self.cells[i];

		// circle
		self.ctx.beginPath();
		var color = 'hsla('
					 c.color.h+','
					 c.color.s+'%,'
					 c.color.l+'%,'
					 c.color.a+')';
		self.ctx.fillStyle = color;
		self.ctx.arc( c.x,c.y,c.radius,0,Math.PI*2 );
		self.ctx.fill();

	}

	// fps draw
	self.ctx.fillStyle = "black";
	self.ctx.fillRect(0,0,60,20);
	self.ctx.fillStyle = "white";
	self.ctx.fillText("fps: " + self.fps.toFixed(2), 5,15);

}

*/

/*
Simulation.prototype.emitCanvas(filename){
	if (connectedUsers > 0){
		//io.sockets.emit('simulation', { type: 'URL', buffer: canvas.toDataURL()}); // send dataURL
		//io.sockets.emit('simulation', { type: 'URL': buffer: filename }); // send filename of saved png
		canvas.toBuffer(function(err,buf){
			if (err) throw err;
		 	//io.sockets.emit('simulation', { type: 'png64', buffer: buf.toString('base64')}); // send img buffer as base64
		 	io.sockets.emit('simulation', { type: 'rawbuf', buffer: buf}); // send raw img buffer (to encode base64 on client)
		});
	}
}

Simulation.prototype.saveToPng(){

	var out = fs.createWriteStream(__dirname + '/public/frame_' + nFramesThisSec + '.png'),
		stream = canvas.createPNGStream();

	stream.on('data', function(chunk){
  		out.write(chunk);
	});

	stream.on('end', function(){
		console.log('saved frame_' + nFramesThisSec + '.png, fps: '+ fps);
		var fn = 'frame_'+nFramesThisSec+'.png';
		emitCanvas(fn);
	});
}
*/
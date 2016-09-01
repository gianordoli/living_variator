
// ----------------
// Simulation class
// ----------------

var Cell = require('./cell'); // cell class
// var Canvas = require('canvas');


function Simulation (width,height,numCells,framerate, drawOnServer){ // constructor / setup


	var self = this;

	// ------------------ variables

	// canvas
	self.drawOnServer = drawOnServer || false;
	self.width	= width || 500;
	self.height	= height || 500;
	// self.canvas = new Canvas(self.width, self.height);
	// self.ctx	= self.canvas.getContext('2d');

	// fps
	self.targetFps = framerate || 30;
	self.fps = 0; // fps tracker
	self.sumFps = 0; // fps calc sum over 1 sec
	self.nFramesThisSec = 0;  // frame ticker
	self.lastDrawTime = 0; // unix timestamp of last frame for fps calc

	// cells
	self.numCells = numCells;
	self.cells = [];

	// environmental variables
	self.envVar = {
		minRadius : 5, // cells cannot divide if < minRadius * 2
		maxRadius : 100, // cells automatically divide if >= maxRadius
		neighborhoodScale : 10, // neighborhoodScale * cell radius = neighborhoodRadius
		mitosisWait : 180, // # frames before cell division
		forceX : 0, // apply global directional force
		forceY : 0,
		acceleration: 0, // apply global acceleration
		drag : 0 // simulates environmental drag (this should be small, eg 0.1)
	};

	// ----------------- SETUP

	self.setup();

	// ----------------- LOOP intervals

	// update() function runs at target fps (update calls draw)
	setInterval(function(){

		self.update(self);
	}, 1000/self.targetFps); 

	// average the per-frame fps every second
	setInterval(function(){

		self.updateFps(self);
	}, 1000);


}


// ----------
// FUNCTIONS:
// ----------

// ---------------------- util: map
Simulation.prototype.map = function(val,oldLo,oldHi,newLo,newHi,bClamp){

	var pct = (val - oldLo) / (oldHi - oldLo);
	var newVal = (newHi - newLo) * pct + newLo;
	if (bClamp){
		if (newVal > newHi) newVal = newHi;
		else if (newVal < newLo) newVal = newLo;
	}
	return newVal;
}

// ----------------------- util: distance between x,y points
Simulation.prototype.dist = function(x1,y1,x2,y2){

	return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}

// ------------------------ util: magnitude
Simulation.prototype.mag = function(x,y){
	return Math.sqrt(x*x + y*y);
}

// ------------------------ util: array contains?
Simulation.prototype.contains = function(array,value){
	for (var i=0; i<array.length; i++){
		if (array[i] === value) return true;
	}
	return false;
}

// ---------------------- update fps (to be run every second)

Simulation.prototype.updateFps = function(){ // util to update fps every second (simply counts frames)
	var self = this;
	self.fps = self.sumFps / self.nFramesThisSec;
	self.sumFps = 0;
	self.nFramesThisSec = 0;
	console.log("fps: "+self.fps);
}

// ---------------------- returns array of neighbor data of a cell in form: { cellIndex, cellRadius, distance }

Simulation.prototype.getNeighbors = function(cellIndex){

	var self = this;

	var c = self.cells[cellIndex];

	var nR = c.neighborhoodRadius;

	var nbs = [];

	for (var i=0; i<self.cells.length; i++){

		if (i===cellIndex) continue; // skip self-comparison

		var cn = self.cells[i];
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

// ---------------------- setup
Simulation.prototype.setup = function(){

	var self = this;

	// initialize cell array
	for (var i=0; i<self.numCells; i++){

		// radius - random between minRadius and maxRadius
		var minRad = self.envVar.minRadius;
		var maxRad = self.envVar.maxRadius * 0.5;
		var radius = Math.random()*(maxRad-minRad)+minRad;

		// pos
		var x = Math.random()*(self.width-radius*2)+radius; // between radius and width-radius
		var y = Math.random()*(self.height-radius*2)+radius; // r : h-r

		// velocity
		var vx, vy;
		do {
			vx = Math.random()*2 -2; // between -2 and 2
			vy = Math.random()*2 -2;
		} while (vx == 0 && vy == 0); // must have some initial velocity

		self.cells.push( 
			// create cell
			new Cell(	x, y, radius, vx, vy,
					 	self.envVar.neighborhoodScale, self.envVar.mitosisWait )
		);
	}
}

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

Simulation.prototype.onDraw = function(){
	// to be overridden
}

module.exports = Simulation;

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

// ----------------
// Simulation class
// ----------------

var Cell = require('./Cell'); // cell class
var Canvas = require('canvas');


function Simulation (width,height,numCells,framerate, drawOnServer){ // constructor / setup


	var self = this;

	// ------------------ variables

	// canvas
	self.drawOnServer = drawOnServer || false;
	self.width	= width || 500;
	self.height	= height || 500;
	self.canvas = new Canvas(self.width, self.height);
	self.ctx	= self.canvas.getContext('2d');

	// fps
	self.targetFps = framerate || 30;
	self.fps = 0; // fps tracker
	self.sumFps = 0; // fps calc sum over 1 sec
	self.nFramesThisSec = 0;  // frame ticker
	self.lastDrawTime = 0; // unix timestamp of last frame for fps calc

	// cells
	self.cells = [];

	// environmental variables
	self.envVar = {
		radius : 5, // init cell radius in canvas px
		neighborhoodRadius : 50, // cell neighboorhood in canvas px
		deathWait : 30, // # frames before death if cell is alone/crowded
		accelX : 0, // accelerate global cell speed
		accelY : 0
	};

	// ----------------- SETUP

	// populate cell array
	for (var i=0; i<numCells; i++){

		// pos
		var x = self.envVar.radius + Math.random()*(self.width-self.envVar.radius*2); // between radius and width-radius
		var y = self.envVar.radius + Math.random()*(self.height-self.envVar.radius*2);
		// velocity
		var vx, vy;
		do {
			vx = Math.random()*2 -1; // between -1 and 1
			vy = Math.random()*2 -1;
		} while (vx == 0 && vy == 0); // must have some initial velocity

		var color = { h: 240, //0-360 hue... 240 blue, 360 red
					  s: 100, //% sat
					  l: 60, //% luma (100 == white)
					  a: 0.8  //0-1 alpha
					};
		var nColor = { h: 240, s: 50, l: 40, a: 0.1 }; // neighborhood color

		self.cells.push( 
			new Cell(x, y, self.envVar.radius, vx, vy, self.envVar.neighborhoodRadius, self.envVar.deathWait, color, nColor) // create cell
		);
	}


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

// ----------------------- util: dist
Simulation.prototype.dist = function(x1,y1,x2,y2){

	return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}

// ------------------------ util: magnitude
Simulation.prototype.mag = function(x,y){
	return Math.sqrt(x*x + y*y);
}


// ---------------------- update fps (to be run every second)

Simulation.prototype.updateFps = function(){ // util to update fps every second (simply counts frames)
	var self = this;
	self.fps = self.sumFps / self.nFramesThisSec;
	self.sumFps = 0;
	self.nFramesThisSec = 0;
	console.log("fps: "+self.fps);
}

// ---------------------- returns array of neighbor data of a cell in form: { cellIndex, distance }

Simulation.prototype.getNeighbors = function(cellIndex){

	var self = this;

	var c = self.cells[cellIndex];

	var nR = c.neighborhoodRadius;

	var nbs = [];

	for (var i=0; i<self.cells.length; i++){

		if (i===cellIndex) continue; // skip self-comparison

		var cn = self.cells[i];

		// check if neighbor
		var dist = c.distToNeighbor(cn.x,cn.y);
		if (dist < c.neighborhoodRadius){

			nbs.push({ cellIndex: i, distance: dist});
		}
	}

	return nbs;
}

// ---------------------- update loop

Simulation.prototype.update = function(){

	var self = this;

	var collisions = new Set(); // keeps set of indexes of cells that collided
	var deaths = new Set(); // keeps set of indexes of cells that died

	for (var i=0; i<self.cells.length; i++){

		var c = self.cells[i];

		// ---------------------- check for neighbors

		var neighbors = self.getNeighbors(i);
		var numNeighbors = neighbors.length;

		// ---------------------- check for collisions

		if (c.age > c.deathWait){ // this cell must be old enough to collide

			for (var n=0; n<numNeighbors; n++){

				var nIdx = neighbors[n].cellIndex;
				var nDist = neighbors[n].distance;

				var nCell = self.cells[nIdx];

				if (nCell.age > nCell.deathWait){ // other cell must be old enough to collide

					if (nDist < c.radius){

						// later, kill cell
						c.dead = true;
						deaths.add(i);

						// and spawn more
						c.collided = true;
						collisions.add(i);
					}
				}
			}
		}

		// ---------------------- SIM RULES OF DEATH...

		// death ticker

		// reset cases:
		if (  (c.numNeighbors >= 4  && numNeighbors < 4) 			// was crowded, now not
		   || (c.numNeighbors === 0 && numNeighbors > 0)) {			// was isolated, now not	
			c.deathTick = 0;
		}	
		
		if	(numNeighbors < 4 	 && numNeighbors > 0) {			// neither crowded nor isolated 	
			c.deathTick = 0;
		}
		else {													// crowded or isolated
			c.deathTick++;
			// update color
			c.color.h = self.map(c.deathTick,0,c.deathWait,240,360);
		}

		c.numNeighbors = numNeighbors; // save num neighbors

		if (c.deathTick >= c.deathWait) { // check if dead
			c.dead = true;
			deaths.add(i);
		}

		// ---------------------- lastly, update cell position, if still alive

		if (c.dead === false) {

			c.update( self.envVar.accelX, self.envVar.accelY, self.envVar.neighborhoodRadius, self.envVar.deathWait);

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

	}

	// ---------------------- now spawn new cells based on collisions
	
	if (collisions.size > 0) console.log (collisions.size+' collisions');
	for (var idx of collisions){

		var c = self.cells[idx];

		var color = { h: 240, s: 100, l: 60, a: 0.8 }; // default cell color
		var nColor = { h: 240, s: 50, l: 40, a: 0.1 }; // default neighborhood color

		// create 2 new cells
		for (var j=0; j<2; j++){

			var vx, vy;
			do {
				vx = Math.random()*2 -1; // between -1 and 1
				vy = Math.random()*2 -1;
			} while (vx == 0 && vy == 0); // must have some initial velocity

			var magV = self.mag(vx,vy), // calc magnitude and direction of velocity
				normX = vx/magV,
				normY = vy/magV;

			var x = c.x + normX*c.radius*2,
				y = c.y + normY*c.radius*2;

			self.cells.push( 
				new Cell(  // create cell
						x, y, 
						self.envVar.radius, 
						vx, vy, 
						self.envVar.neighborhoodRadius, 
						self.envVar.deathWait, 
						color, nColor)
			);
		}
	}

	// ---------------------- now, delete dead cells from cell array

	var deathsArray = Array.from(deaths).sort(); // cvt to sorted array to iterate backwards
	if (deathsArray.length > 0) console.log(deathsArray.length+' deaths');

	for (var i=deathsArray.length-1; i>=0; i--){

		self.cells.splice(deathsArray[i],1); // remove from array
	}
	if (deathsArray.length > 0) console.log(this.cells.length+' cells now alive')

	

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



// ---------------------- draw loop

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
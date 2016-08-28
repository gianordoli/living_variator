
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

		var x = self.envVar.radius + Math.random()*(self.width-self.envVar.radius*2); // pos x - between radius and width-radius
		var y = self.envVar.radius + Math.random()*(self.height-self.envVar.radius*2); // pos y - between radius and height-radius
		var vx, vy;
		do {
			vx = Math.random()*2 -1; // vel x - between -1 and 1
			vy = Math.random()*2 -1; // vel y - between -1 and 1
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

	// average the per-frame fps every second
	setInterval(function(){
		self.updateFps(self);
	}, 1000);

	// update() function runs at target fps (update calls draw)
	setInterval(function(){
		self.update(self);
	}, 1000/self.targetFps); 


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

// ------------------------ util: mag
Simulation.prototype.mag = function(x,y){
	return Math.sqrt(x*x + y*y);
}


// ---------------------- util: update fps

Simulation.prototype.updateFps = function(self){ // util to update fps every second (simply counts frames)
	self.fps = self.sumFps / self.nFramesThisSec;
	self.sumFps = 0;
	self.nFramesThisSec = 0;
	console.log("fps: "+self.fps);
}

// ---------------------- returns array of neighbor data of a cell in form: { cellIndex, distance }

Simulation.prototype.getNeighbors = function(self, cellIndex){

	var c = self.cells[cellIndex];
	var nR = c.neighborhoodRadius;

	var nbs = []; // neighbors

	for (var i=0; i<self.cells.length; i++){

		if (i===cellIndex) continue; // skip self-comparison

		var cn = self.cells[i];

		// check if within general bounding box
		if (cn.x > c.x-nR && cn.x < c.x+nR && cn.y > c.y-nR && cn.y < c.y+nR){

			// calc actual dist
			var dist = Math.sqrt(Math.pow(c.x-cn.x,2) + Math.pow(c.y-cn.y,2));

			if (dist < nR){
				nbs.push({ cellIndex: i, distance: dist});
			}
		}
	}

	return nbs;
}

// ---------------------- update loop

Simulation.prototype.update = function(self){

	//var collisions = new Map(); // keeps index pairs as key and x,y locations as values of collisions
	var collisions = new Set(); // keeps set of indexes of cells that collided
	var deaths = new Set(); // keeps set of indexes of cells that died

	for (var i=0; i<self.cells.length; i++){

		var c = self.cells[i];

		// ---------------------- check for neighbors

		var neighbors = self.getNeighbors(self, i);
		var numNeighbors = neighbors.length;

		for (var n=0; n<numNeighbors; n++){

			var nIdx = neighbors[n].cellIndex;
			var nDist = neighbors[n].distance;
			var nCell = self.cells[nIdx];

			// ---------------------- check for collisions

			if (nDist < c.radius){

				// later, kill cell
				c.dead = true;
				deaths.add(i);

				// and spawn more
				c.collided = true;
				collisions.add(i);

				// var c1 = Math.min(i,nIdx);
				// var c2 = Math.max(i,nIdx);
				// var cP = [c1,c2];

				// var mX = (nCell.x+c.x)*0.5;
				// var mY = (nCell.y+c.y)*0.5;
				// var mPt = {x: mX, y: mY};

				// collisions.set(cP, mPt);
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

	console.log('collisions: '+collisions.size);
	
	for (var idx of collisions){

		var c = self.cells[idx];

		var color = { h: 240, s: 100, l: 60, a: 0.8 }; // default cell color
		var nColor = { h: 240, s: 50, l: 40, a: 0.1 }; // default neighborhood color

		// create 2 new cells
		for (var j=0; j<2; j++){

			var vx = Math.random()*2-1,
				vy = Math.random()*2-1;

			var magV = self.mag(vx,vy),
				normX = vx/magV,
				normY = vy/magV;

			var x = c.x + normX*c.radius*4,
				y = c.y + normY*c.radius*4;

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
	console.log('deathsArray size '+deathsArray.length);

	for (var i=deathsArray.length-1; i>=0; i--){

		console.log('cell '+deathsArray[i]+' died, RIP');
		self.cells.splice(deathsArray[i],1); // remove from array
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



// ---------------------- draw loop

Simulation.prototype.draw = function(self){

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
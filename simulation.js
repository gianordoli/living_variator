
// ----------------
// Simulation class
// ----------------

var Cell = require('./Cell'); // cell class
var Canvas = require('canvas');


function Simulation (width,height,numCells,framerate){ // constructor / setup


	var self = this;

	// ------------------ variables

	// canvas
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
		neighborhoodRadius : 20, // cell neighboorhood in canvas px
		deathWait : 2.0, // seconds before death if cell is alone/crowded
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

		self.cells.push( 
			new Cell(x, y, self.envVar.radius, vx, vy, self.envVar.deathWait) // create cell
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


// ---------------------- util: update fps

Simulation.prototype.updateFps = function(self){ // util to update fps every second (simply counts frames)
	self.fps = self.sumFps / self.nFramesThisSec;
	self.sumFps = 0;
	self.nFramesThisSec = 0;
	console.log("fps: "+self.fps);
}

// ---------------------- update loop

Simulation.prototype.update = function(self){


	for (var i=0; i<self.cells.length; i++){
		var c = self.cells[i];

		c.update( self.envVar.accelX, self.envVar.accelY, self.envVar.neighborhoodRadius, self.envVar.deathWait);

		// bounce off walls
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

	self.draw(self);
}

// ---------------------- draw loop

Simulation.prototype.draw = function(self){

	var elapsedMs = Date.now() - self.lastDrawTime;
	self.sumFps += 1000/elapsedMs;
	self.lastDrawTime = Date.now();

	// bg
	self.ctx.fillStyle = "rgba(0,0,0,0.1)";
	self.ctx.fillRect(0,0,self.width,self.height);

	// draw cells
	for (var i=0; i<self.cells.length; i++){

		var c = self.cells[i];

		// circle
		self.ctx.beginPath();
		self.ctx.fillStyle = "blue";
		self.ctx.arc( c.x,c.y,c.radius,0,Math.PI*2 );
		self.ctx.fill();

	}

	// fps draw
	self.ctx.fillStyle = "white";
	self.ctx.fillText("fps: " + self.fps.toFixed(2), 5,15);

	self.nFramesThisSec++;

	// callback for socket.io emit canvas
	self.onDraw();

	//emitCanvas(); // send to client (if any)
	//saveToPng(); // save canvas to disk
}

Simulation.prototype.onDraw = function(){
	// to be overridden
}


/// ?????? callback I think
// Simulation.prototype.on = function(functionName,callback){
// 	if (callback && typeof(callback) === 'function'){
// 		if (functionName === 'draw'){
// 			this.onDraw = callback;
// 		}
// 	}
// }

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
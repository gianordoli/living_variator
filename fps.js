

// --------------
// Fps calc class
// --------------


function Fps(){

	// fps

	this.fps = 0; // fps tracker
	this.runningFps = 0;
	this.sumFps = 0; // fps calc sum over 1 sec
	this.nFramesThisSec = 0;  // frame ticker
	this.lastDrawTime = 0; // unix timestamp of last frame for fps calc
	this.totalMs = 0; // time since start

	// loop id
	this.fpsId = 0;

}

// ---------------------- start/stop timer

Fps.prototype.start = function(){
	var self = this;
	this.fpsId = setInterval( 
		function(){ 
			self.updateFps();
		}, 1000);
	this.lastDrawTime = Date.now();
}

Fps.prototype.stop = function(){
	if (this.fpsId != 0){
		clearInterval(this.fpsId);
	}
	this.fps = 0; // fps tracker
	this.runningFps = 0;
	this.sumFps = 0; // fps calc sum over 1 sec
	this.nFramesThisSec = 0;  // frame ticker
	this.lastDrawTime = 0; // unix timestamp of last frame for fps calc

	// loop id
	this.fpsId = 0;
}

// ---------------------- tick -- call each frame

Fps.prototype.tick = function(){ // calc per frame fps

	this.nFramesThisSec++;
	var elapsedMs = Date.now() - this.lastDrawTime;
	this.runningFps = (elapsedMs > 0) ? 1000/elapsedMs : 1000;
	this.sumFps += this.runningFps;
	this.lastDrawTime = Date.now();
	this.totalMs+=elapsedMs;
}

// ---------------------- get fps -- call every second

Fps.prototype.updateFps = function(){ // util to update fps every second (simply counts frames)
	this.fps = this.sumFps / this.nFramesThisSec;
	this.sumFps = 0;
	this.nFramesThisSec = 0;
	console.log("fps: "+this.fps);
}

module.exports = Fps;
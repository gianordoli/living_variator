
// ----------
// Cell class
// ----------


function Cell(x, y, radius, vx, vy, neighborhoodRadius, deathWait, color, nColor){

	var self = this;
	self.x = x;
	self.y = y;
	self.radius = radius;
	self.vx = vx;
	self.vy = vy;
	self.neighborhoodRadius = neighborhoodRadius;
	self.deathWait = deathWait;
	self.deathTick = 0;
	self.color = color;
	self.nColor = nColor;
	self.dead = false;
	self.collided = false;
}

Cell.prototype.update = function(accelX, accelY, neighborhoodRadius, deathWait){

	this.vx += accelX;
	this.vy += accelY;
	this.x += this.vx;
	this.y += this.vy;
	this.neighborhoodRadius = neighborhoodRadius;
	this.deathWait = deathWait;
}

module.exports = Cell;
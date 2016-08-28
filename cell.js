
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
	self.age = 0;
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
	this.age++;
	this.radius++; // grow
}


Cell.prototype.distToNeighbor = function(x,y){ // returns distance if neighbor, or this.neighborhoodRadius if not

	// check bounding box
	if (Math.abs(this.x-x) < this.neighborhoodRadius && Math.abs(this.y-y) < this.neighborhoodRadius){
	// check radial dist
		var dist = this.distanceTo(x,y);
		if (dist < this.neighborhoodRadius) return dist;
	}
	return this.neighborhoodRadius;
}

Cell.prototype.isCollision = function(x,y){

	// check bounding box
	if (Math.abs(this.x-x) < this.radius && Math.abs(this.y-y) < this.radius){	
		// check radial dist
		if (this.distanceTo(x,y) < this.radius) return true;
	}
	return false;
}

Cell.prototype.distanceTo = function(x,y){

	return Math.sqrt((this.x-x)*(this.x-x)+(this.y-y)*(this.y-y));
}

module.exports = Cell;
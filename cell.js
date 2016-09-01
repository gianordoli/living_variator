
// ----------
// Cell class
// ----------


function Cell(x, y, radius, vx, vy, neighborhoodScale){

	var self = this;
	self.x = x; // initial position
	self.y = y;
	self.radius = radius; // initial radius
	self.vx = vx; // initial velocity
	self.vy = vy;
	self.accelX = 0;
	self.accelY = 0;
	self.food = 0;
	self.neighborhoodRadius = neighborhoodScale * radius;
	self.numNeighbors = 0;
	self.age = 0;
	self.hunger = 1; // scale 0-1 - how to calc?
}

Cell.prototype.applyForce = function(forceX, forceY){
	this.accelX += forceX;
	this.accelY += forceY;
}

Cell.prototype.applyDrag = function(drag){
	var speed = magnitude(this.vx,this.vy);
	var dragMag = drag * speed * speed;
	dragVec = normalize(this.vx*-1,this.vy*-1);
	dragVec.x *= dragMag;
	dragVec.y *= dragMag;
	this.applyForce(dragVec.x,dragVec.y);
}

Cell.prototype.feed = function(food){ // adds food to be eaten
	this.food += food;
}

Cell.prototype.eat = function() { // eats added food
	if (this.food > 0) this.age = 0;
	this.radius += this.food;
	this.food = 0;
}

Cell.prototype.update = function(neighborhoodScale){

	this.age++;
	this.eat();

	this.vx += this.accelX;
	this.vy += this.accelY;
	this.x += this.vx;
	this.y += this.vy;

	this.neighborhoodRadius = this.radius * neighborhoodScale;

	this.accelX = 0;
	this.accelY = 0;
}

Cell.prototype.seek = function(preyX, preyY){

	var desVx = preyX - this.x;
	var desVy = preyY - this.y;
	var desNorm = this.normalize(desVx,desVy);
	var vMag = this.magnitude(this.vx,this.vy);
	desVx = desNorm.x * vMag; // maybe change maxSpeed to function input?
	desVy = desNorm.y * vMag; // or base it on current velocity magnitude?
	var steerX = desVx - this.vx;
	var steerY = desVy - this.vy;
	// can add max force here - i.e. steerX.limit(maxForceX); steerY.limit(maxForceY);
	// max force could be tied to hunger?
	this.applyForce(steerX,steerY);
}

Cell.prototype.normalize = function(vx,vy){ // returns normalized vector (e.g. direction) (as x,y object)
	var mag = this.magnitude(vx,vy);
	if (mag === 0) return { x: 0, y: 0 };
	return { x : vx/mag, y : vy/mag };
}

Cell.prototype.magnitude = function(vx,vy){
	if (vx===0 && vy===0) return 0;
	return Math.sqrt((vx*vx) + (vy*vy));
}


Cell.prototype.distToNeighbor = function(x,y,neighborRadius){ 
// returns distance if neighbor, or this.neighborhoodRadius if not
// if no neighborRadius given, dist to cell center, otherwise dist to cell wall

	var nRadius = neighborRadius || 0;
	// check bounding box
	if (Math.abs(this.x-x) -nRadius < this.neighborhoodRadius
		&& Math.abs(this.y-y) -nRadius < this.neighborhoodRadius){

		// check radial dist
		var dist = this.distanceTo(x,y) - nRadius;
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
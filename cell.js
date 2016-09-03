
// ----------
// Cell class
// ----------

var Vector = require('./vec'); // vector class 


function Cell(x, y, name, neighbors, radius, velocity, data){

	this.x = isNaN(x) ? 0 : x; // position
	this.x = isNaN(y) ? 0 : x;
	this.pos = new Vec(this.x,this.y);
	this.name = name || "cell";
	this.radius = isNaN(radius) ? 0 : radius;
	this.neighbors = [];
	this.addNeighbors(neighbors);
	this.velocity = new Vec();
	this.makeVelocity(velocity);
	this.acceleration = new Vec();
	this.age = 0;
	this.data = data || {};
}

// ----------
// FUNCTIONS:
// ----------


// -------------------------------- update


Cell.prototype.update = function(){

	this.age++;

	// movement
	this.velocity.add(this.acceleration);
	this.acceleration.x = 0; this.acceleration.y = 0;
	this.pos.add(this.velocity);
	this.x = this.pos.x;
	this.y = this.pos.y;
	return this;
}


// -------------------------------- neighbors

Cell.prototype.addNeighbors = function(neighbors){
	if (Array.isArray(neighbors)){
		for (var i=0; i<neighbors.length; i++){
			if (neighbors[i] instanceof Cell){
				this.neighbors.push(neighbors[i]);
			}
		}
	} else if (neighbors instanceof Cell){
		this.neighbors.push(neighbor);
	}
	return this.neighbors;
}
Cell.prototype.addNeighbor = function(neighbor){
	return this.addNeighbors(neighbor);
}
Cell.prototype.clearNeighbors = function(){
	this.neighbors.splice(0,this.neighbors.length); // splice to 0 / clear
	return this.neighbors;
}
Cell.prototype.setNeighbors = function(neighbors){
	if (this.neighbors.length > 0) this.clearNeighbors();
	this.addNeighbors(neighbors);
	return this.neighbors;
}


// -------------------------------- forces

Cell.prototype.makeVelocity = function(velocity){
	if (velocity instanceof Vec){
		this.velocity.copyFrom(velocity);
	}
	return this.velocity;
}
Cell.prototype.applyForce = function(force){
	if (force instanceof Vec){
		this.acceleration.add(force);
	} else if (typeof(force) === "number"){
		this.acceleration.multiply(force);
	}
	return this.acceleration;
}
Cell.prototype.accelerate = function(force){
	return this.applyForce(force);
}
Cell.prototype.applyDrag = function(drag){
	var dragVec = new Vec();
	if (typeof(drag) === "number"){
		var speed = this.velocity.magnitude();
		var dragMag = drag * speed * speed;
		dragVec.copyFrom(this.velocity);
		dragVec.reverse().normalize().multiply(dragMag);
	}
	return this.applyForce(dragVec);
}

Cell.prototype.seek = function(target, maxSpeed){
	var steer = new Vec();
	if (target instanceof Vec){
		var dir = target.copy();
		dir.subtract(this.pos).normalize();
		var mag = this.velocity.magnitude();
		if (isNaN(maxSpeed) === false){
			mag = maxSpeed;
		}
		dir.multiply(mag); // either maxSpeed or this.velocity.magnitude()
		steer = dir.subtract(this.velocity);
		// can add max force here - i.e. steer.limit(maxForce);
	}
	return this.applyForce(steer);
}


// -------------------------------- collision

Cell.prototype.isCollision = function(cell){
	if (cell instanceof Cell) {
		if (this.positition.distanceTo(cell.position) <= this.radius+cell.radius){
			return true;
		}
	} else if (cell instanceof Vec){
		if (this.position.distanceTo(cell) <= this.radius){
			return true;
		}
	}
	return false;
}

module.exports = Cell;
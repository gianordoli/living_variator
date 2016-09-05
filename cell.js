
// ----------
// Cell class
// ----------

var Util = require('./game_util'); // Util class
var Vec = require('./vec'); // Vector class 

function Cell(x, y, name, neighbors, radius, velocity, data){

	this.x = isNaN(x) ? 0 : x; // position
	this.y = isNaN(y) ? 0 : y;
	this.pos = new Vec(this.x,this.y);
	this.name = name || this.x+','+this.y;
	this.radius = isNaN(radius) ? 0 : radius;
	this.neighbors = [];
	this.util = new Util();
	this.addNeighbors(neighbors);
	this.velocity = new Vec();
	this.makeVelocity(velocity);
	this.acceleration = new Vec();
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
		if (neighbors.length > 0){
			if (this.util.isNum(neighbors[0])){ // indices
				for (var i=0; i<neighbors.length; i++){
					if (isNaN(neighbors[i]) === false){
						this.neighbors.push(neighbors[i]);
					}
					else {
						this.clearNeighbors();
						console.log("error adding neighbor indices: NaN at neighbors["+i+']');
					}
				}
			}
			else console.log("error adding neighbors: neighbors array not indices");
		}
	} else if (this.util.isNum(neighbors)){
		this.neighbors.push(neighbors);
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
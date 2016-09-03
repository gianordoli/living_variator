
// ------------
// Vector class
// ------------



function Vec(x,y){
	this.x = isNaN(x) ? 0 : x;
	this.y = isNaN(y) ? 0 : y;
}

// copy
Vec.prototype.copyFrom = function(vec) {
	if (vec instanceof Vec){
		this.x = 0+vec.x; this.y = 0+vec.y;
	}
	return this;
}
Vec.prototype.copyTo = function(vec){
	if (vec instanceof Vec){
		vec.copyFrom(this);
	}
	return vec;
}
Vec.prototype.copy = function(){
	return new Vec().copyFrom(this);
}

// addition
Vec.prototype.add = function(vec) {
	if (vec instanceof Vec){
		this.x+=vec.x; this.y+=vec.y;
	}
	return this;
}
Vec.prototype.addTo = function(vec) { // modifies input
	if (vec instanceof Vec){
		vec.add(this);
	}
	return vec;
}
Vec.prototype.newAdd = function(vec) {
	return this.copy().add(vec);
}

//subtraction
Vec.prototype.subtract = function(vec) {
	if (vec instanceof Vec){
		this.x-=vec.x; this.y-=vec.y;
	}
	return this;
}
Vec.prototype.subtractTo = function(vec) { // modifies input
	if (vec instanceof Vec){
		vec.subtract(this);
	}
	return vec;
}
Vec.prototype.newSubtract = function(vec) {
	return this.copy().subtract(vec);
}

// multiplication
Vec.prototype.multiply = function(vec) {
	if (vec instanceof Vec){
		this.x*=vec.x;
		this.y*=vec.y;
	} else if (typeof vec === "number"){
		this.x*=vec;
		this.y*=vec;
	}
	return this;
}
Vec.prototype.multiplyBy = function(vec) { 
	return this.multiply(vec); 
}
Vec.prototype.multiplyTo = function(vec) { // modifies input
	if (vec instanceof Vec){
		vec.multiply(this);
	}
	return vec;
}
Vec.prototype.newMultiply = function(vec) {
	return this.copy().multiply(vec);
}

// division
Vec.prototype.divide = function(vec) {
	if (vec instanceof Vec){
		if (vec.x != 0) this.x/=vec.x;
		if (vec.y != 0) this.y/=vec.y;
	} else if (typeof vec === "number"){
		if (vec != 0) {
			this.x/=vec;
			this.y/=vec;
		}
	}
	return this;
}
Vec.prototype.divideBy = function(vec){
	return this.divide(vec);
}
Vec.prototype.divideTo = function(vec) { // modifies input
	if (vec instanceof Vec){
		vec.divide(this);
	}
	return vec;
}
Vec.prototype.newDivide = function(vec) {
	return this.copy().divide(vec);
}

// absolute values
Vec.prototype.makeAbsolute = function() {
	this.x = Math.abs(this.x);
	this.y = Math.abs(this.y);
	return this;
}
Vec.prototype.newAbsolute = function() {
	return this.copy().makeAbsolute();
}

// distance
Vec.prototype.distance = function(vec){
	if (vec instanceof Vec){
		var dx = Math.sqrt(Math.pow(this.x-vec.x,2), Math.pow(this.y-vec.y,2));
		return dx;
	}
	return 0;
}
Vec.prototype.distanceTo = function(vec){
	return this.distance(vec);
}

// magnitude
Vec.prototype.magnitude = function(){
	return this.distance(new Vec());
}

// normalize
Vec.prototype.normalize = function(){
	var mag = this.magnitude();
	this.divide(mag);
	return this;
}

// reverse
Vec.prototype.reverse = function(){
	this.x *= -1;
	this.y *= -1;
	return this;
}

// limit magnitude
Vec.prototype.limit = function(limit){
	if (limit instanceof Vec || typeof(limit)==="number"){
		var mag = this.magnitude();
		var lMag = (limit instanceof Vec) ? limit.magnitude() : limit;
		if (mag > lMag) {
			this.normalize().multiply(lMag);
		}
	}
	return this;
}

module.exports = Vec;

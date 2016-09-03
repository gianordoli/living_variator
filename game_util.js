

// ----------
// Game Utils
// ----------

function Util(){}

Util.prototype.isNum = function(val){
	return isNaN(val) ? false : true;
}

// -------------------------------- util : map
Util.prototype.map = function(val,oldLo,oldHi,newLo,newHi,bClamp){
	var newVal;
	if (this.isNum(val) && this.isNum(oldLo) && this.isNum(oldHi) && this.isNum(newLo) && this.isNum(newHi)){
		var pct = (val - oldLo) / (oldHi - oldLo);
		newVal = (newHi - newLo) * pct + newLo;
		if (bClamp){
			if (newVal > newHi) newVal = newHi;
			else if (newVal < newLo) newVal = newLo;
		}
	}
	return newVal;
}

// -------------------------------- util : array contains?
Util.prototype.arrayContains = function(array,value){
	if (Array.isArray(array)){
		for (var i=0; i<array.length; i++){
			if (array[i] === value) return true;
		}
	}
	return false;
}

module.exports = Util;
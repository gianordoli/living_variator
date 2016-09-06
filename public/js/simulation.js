var simulation = {
	map: function(val,oldLo,oldHi,newLo,newHi,bClamp){
		var pct = (val - oldLo) / (oldHi - oldLo);
		var newVal = (newHi - newLo) * pct + newLo;
		if (bClamp){
			if (newVal > newHi) newVal = newHi;
			else if (newVal < newLo) newVal = newLo;
		}
		return newVal;
	},
	normalize: function(vx,vy){
		var mag = Math.sqrt((vx*vx)+(vy*vy));
		return {x: vx/mag, y: vy/mag };
	},
	drawCellData: function(data, ctx){

		/* 
		data = {
	        width: this.width,
           	height: this.height,
           	cells: this.cells,
           	output: this.output,
           	fps: this.fps.fps
        }
        */
        
        console.log("cells:");
        console.log(data.cells);

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;
        var cellWidth = width / data.width;
        var cellHeight = height / data.height;

		ctx.fillStyle = "rgba(0,0,0,1.0)";
		ctx.fillRect(0,0,width,height);

		// draw cells
		for (var i=0; i<data.cells.length; i++){

			var c = data.cells[i];
			if (c.alive) {
				var canX = c.x*cellWidth;
				var canY = c.y*cellHeight;

				var hue = this.map(c.n,0,9,220,360,true);
				var color = { 	
					h: hue, //0-360 hue... 240 blue, 360 red
				  	s: 100, //% sat
				  	l: 60, //% luma (100 == white)
					a: 1.0  //0-1 alpha
				};

				// draw cell
				ctx.beginPath();
				ctx.fillStyle = 'hsla('+color.h+','+color.s+'%,'+color.l+'%,'+color.a+')';
				ctx.fillRect(canX,canY,cellWidth,cellHeight);
			}

		}

		// fps draw
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(0,0,60,20);
		ctx.fillStyle = "#fff";
		ctx.fillText("fps: " + data.fps.toFixed(2), 5,15);
	}
}
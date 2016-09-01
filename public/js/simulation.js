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
	drawCellData: function(cells, info, ctx){

		// bg
		//ctx.globalCompositeOperation = "source-over"

		ctx.fillStyle = "rgba(0,0,0,0.7)";
		ctx.fillRect(0,0,info.width,info.height);

		//ctx.globalCompositeOperation = "lighten";

		// draw cells
		for (var i=0; i<cells.length; i++){

			var c = cells[i];

			var hue = this.map(c.radius,0,100,240,360,true);
			var color = { 	
				h: hue, //0-360 hue... 240 blue, 360 red
			  	s: 100, //% sat
			  	l: 60, //% luma (100 == white)
				a: 0.6  //0-1 alpha
			};
			var nColor = { h: hue, s: 20, l: 20, a: 0.2 }; // neighborhood color

			//draw neighborhood radius
			ctx.beginPath();
			ctx.fillStyle = 'hsla('+nColor.h+','+nColor.s+'%,'+nColor.l+'%,'+nColor.a+')'
			ctx.arc( c.x,c.y, c.neighborhoodRadius,0,Math.PI*2 );
			ctx.fill();

			// draw cell radius
			ctx.beginPath();
			ctx.fillStyle = 'hsla('+color.h+','+color.s+'%,'+color.l+'%,'+color.a+')';
			ctx.arc( c.x,c.y,c.radius,0,Math.PI*2 );
			ctx.fill();

			// draw cell velocity line
			ctx.strokeStyle = 'rgba(255,255,255,0.4)';
			ctx.beginPath();
			var nV = this.normalize(c.vx,c.vy);
			var bx = c.x+nV.x*c.radius,
				by = c.y+nV.y*c.radius;
			var ex = bx+c.vx*10,
				ey = by+c.vy*10;
			ctx.moveTo(bx,by);
			ctx.lineTo(ex,ey);
			ctx.stroke();

			ctx.fillStyle = "white"
			// radius
			ctx.fillText('r '+c.radius.toFixed(1), c.x-6, c.y-12);
			// num neighbors
			ctx.fillText('n '+c.numNeighbors, c.x-6, c.y);
			// age
			ctx.fillText('a '+c.age,c.x-6,c.y+12);
			// mitosis
			if (c.mitosis) ctx.fillText('m!', c.x-6, c.y+24);

		}

		//ctx.globalCompositeOperation = "source-over";

		// fps draw
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(0,0,60,20);
		ctx.fillStyle = "#fff";
		ctx.fillText("fps: " + info.fps.toFixed(2), 5,15);
	}
}
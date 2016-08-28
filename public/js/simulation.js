var simulation = {
	drawCellData: function(cells, info, ctx){

		// bg
		ctx.globalCompositeOperation = "source-over"

		ctx.fillStyle = "rgba(0,0,0,0.2)";
		ctx.fillRect(0,0,info.width,info.height);

		ctx.globalCompositeOperation = "lighten";

		// draw cells
		for (var i=0; i<cells.length; i++){

			var c = cells[i];

			// draw neighborhood radius
			ctx.beginPath();
			var nColor = 'hsla('+c.nColor.h+','+c.nColor.s+'%,'+c.nColor.l+'%,0.1)';
			ctx.fillStyle = nColor;
			ctx.arc( c.x,c.y, c.neighborhoodRadius,0,Math.PI*2 );
			ctx.fill();

			// draw cell radius
			ctx.beginPath();
			var color = 'hsla('+c.color.h+','+c.color.s+'%,'+c.color.l+'%,'+c.color.a+')';
			ctx.fillStyle = color;
			ctx.arc( c.x,c.y,c.radius,0,Math.PI*2 );
			ctx.fill();

		}

		ctx.globalCompositeOperation = "source-over";

		// fps draw
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(0,0,60,20);
		ctx.fillStyle = "#fff";
		ctx.fillText("fps: " + info.fps.toFixed(2), 5,15);
	}
}
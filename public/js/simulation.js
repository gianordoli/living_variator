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
           	input: this.input,
           	output: this.output,
           	fps: this.fps.fps
        }
        */
        
        //console.log(data);

        var width = ctx.canvas.width -100; // leave 100 px on side for input labels
        var height = ctx.canvas.height -100; // leave 100 px on bottom for output labels
        var cellWidth = width / data.width;
        var cellHeight = height / data.height;

		ctx.fillStyle = 'black';
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
				ctx.fillStyle = 'hsla('+color.h+','+color.s+'%,'+color.l+'%,'+color.a+')';
				ctx.fillRect(canX,canY,cellWidth,cellHeight);
			}

		}

		// fps draw
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(0,0,60,20);
		ctx.fillStyle = "#fff";
		ctx.fillText("fps: " + data.fps.toFixed(2), 5,15);

		// input/output labels
		ctx.lineWidth = 1;

		// input - vertical
		for (inp in data.input){
			if (data.input.hasOwnProperty(inp)){
				var i = data.input[inp];

				// rect bg lightness : pct alive in region
				var lt = this.map(i.pct,0,1,5,100,true);
				ctx.fillStyle = 'hsla(0,0%,'+lt+'%,1.0)';
				ctx.fillRect(width+1,i.y1*cellHeight,99,(i.y2-i.y1+1)*cellHeight);
				ctx.strokeStyle = "#000";
				ctx.strokeRect(width+1,i.y1*cellHeight,99,(i.y2-i.y1+1)*cellHeight);

				// label
				ctx.fillStyle = 'rgba(0,0,0,0.6)';
				ctx.fillRect(width+5,i.y1*cellHeight+10,55,23);
				ctx.fillStyle = 'white';
				ctx.fillText("in "+inp+":  "+i.pct.toFixed(2), width+10, i.y1*cellHeight+25);
			}
		}

		// output - horizontal
		for (out in data.output){
			if (data.output.hasOwnProperty(out)){
				var o = data.output[out];

				// raw pct

				// rect bg lightness : pct alive in region
				var lt = this.map(o.pct,0,1,5,100,true);
				ctx.fillStyle = 'hsla(0,0%,'+lt+'%,1.0)';
				ctx.fillRect(o.x1*cellWidth,height+1,(o.x2-o.x1+1)*cellWidth,49);
				ctx.strokeStyle = '#000';
				ctx.strokeRect(o.x1*cellWidth,height+1,(o.x2-o.x1+1)*cellWidth,49);

				// label
				// ctx.fillStyle = 'rgba(0,0,0,0.6)';
				// ctx.fillRect(o.x1*cellWidth+5,height+5,(o.x2-o.x1+1)*cellWidth-10,25);
				ctx.fillStyle = 'white';
				ctx.fillText("out "+out+":", o.x1*cellWidth+12, height+20);
				ctx.fillText(o.pct.toFixed(2), o.x1*cellWidth+12, height+35);

				// weighted pct (diff between game alive and section alive)

				// bg
				lt = this.map(o.weightedPct,-0.5,0.5,5,100,true);
				ctx.fillStyle = 'hsla(0,0%,'+lt+'%,1.0)';
				ctx.fillRect(o.x1*cellWidth,height+50,(o.x2-o.x1+1)*cellWidth,49);
				ctx.strokeStyle = '#000';
				ctx.strokeRect(o.x1*cellWidth,height+50,(o.x2-o.x1+1)*cellWidth,49);

				// label
				ctx.fillStyle = 'white';
				ctx.fillText("wPct "+out+":", o.x1*cellWidth+12, height+70);
				var scaledWPct = o.weightedPct * 10;
				ctx.fillText(scaledWPct.toFixed(3), o.x1*cellWidth+12, height+85);
			}
		}
	},

	drawOutputGraph: function(data, ctx){
		/* 
		data = {
	        width: this.width,
           	height: this.height,
           	cells: this.cells,
           	input: this.input,
           	output: this.output,
           	fps: this.fps.fps
        }
        */

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        var currentCanvas = ctx.getImageData(81,0,width,height);
        ctx.putImageData(currentCanvas,80,0); // shift current graph data to left 1 pixel

        var graphHeight = height/4;

        // draw labels
		ctx.fillStyle = 'black';
		ctx.fillRect(0,0,80,height);
		ctx.fillStyle = 'white';
		ctx.fillText("pct 0", 5, graphHeight/2);
		ctx.fillText("pctSmooth", 5, graphHeight*2-graphHeight/2);
		ctx.fillText("weightedPct 0", 5, graphHeight*3-graphHeight/2);
		ctx.fillText("w...PctSmooth", 5, graphHeight*4-graphHeight/2);

		var o = data.output["0"]; // just draw first output

		ctx.fillStyle = 'black';
		// pct
		var pctH = this.map(o.pct,0.5,0,5,graphHeight-5,true);
		ctx.fillRect(width-1,pctH,1,1);
		// pctSmooth
		var pctSmoothH = this.map(o.pctSmooth,0.5,0,graphHeight+5,graphHeight*2-5,true);
		ctx.fillRect(width-1,pctSmoothH,1,1);
		// weightedPct
		var wPctH = this.map(o.weightedPct,0.1,-0.1,graphHeight*2+5,graphHeight*3-5,true);
		ctx.fillRect(width-1,wPctH,1,1);
		// weightedPctSmooth
		var wPctSmoothH = this.map(o.weightedPctSmooth,0.1,-0.1,graphHeight*3+5,height-5,true);
		ctx.fillRect(width-1,wPctSmoothH,1,1);

		// draw boxes to contain each line
		ctx.strokeStyle = 'blue';
		for (var i=0; i<4; i++){
			ctx.strokeRect(0,i*graphHeight,width+10,graphHeight);
		}
	}
}
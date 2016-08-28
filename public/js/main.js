/* Your code starts here */

var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var socket;
	var body = document.getElementsByTagName('body')[0];	
	//var img = document.createElement('img');
	//body.appendChild(img);	
	var canvas = document.getElementById('sim');
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = "black";
	ctx.fillRect(0,0,canvas.width,canvas.height);

	var drawCellData = function(cells, info){

		// bg
		ctx.globalCompositeOperation = "source-over"

		ctx.fillStyle = "rgba(0,0,0,0.2)";
		ctx.fillRect(0,0,canvas.width,canvas.height);

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

	// Initializing socket and adding listener functions
	var socketSetup = function(){
		
		// Connect
	    socket = io.connect();

		// Listeners
		socket.on('welcome', function(data){
			console.log(data.msg);
		});

		socket.on('simulation', function(data){
			var img = new Image();
			img.onload = function(){
				ctx.drawImage(img,0,0);
			}

			console.log(data);
			if (data.type == 'URL')
				img.src = data.buffer;
			
			else if (data.type == 'png64')
				img.src = 'data:image/png;base64,' + data.buffer;

			else if (data.type == 'rawbuf'){ // convert binary to base64 string
				var uint8arr = new Uint8Array(data.buffer);
				var binary = '';
				for (var i=0; i<uint8arr.length; i++){
					binary+= String.fromCharCode(uint8arr[i]);
				}
				var base64string = window.btoa(binary);
				img.src = 'data:image/png;base64,' + base64string;
			}
			else if (data.type == 'cellData'){ // raw cell data for client-canvas drawing
				console.log(data);
				drawCellData(data.buffer,data.info);
			}

		});

	};

	var init = function(){
		console.log('Initializing app.');

		socketSetup();	// Sending attachEvents as a callback	
	};

	return {
		init: init
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
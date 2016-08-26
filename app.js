//---------- BASIC SETUP ----------
var express		= require('express'),
	bodyParser	= require('body-parser'),
	fs 			= require('fs'),
	Canvas 		= require('canvas');


var app = express();						// our Express app

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());							// parse application/json

// Express server
app.use(function(req, res, next) {
    // Setup a Cross Origin Resource sharing
    // See CORS at https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);	// Show the URL user just hit by user
    next();
});

app.use('/', express.static(__dirname + '/public'));

var server = require('http').Server(app);
var io = require('socket.io')(server);

/*---------------------------------*/



/*---------- SOCKET.IO  ----------*/

// .on(identifier, callback(data))      listens to 
// .emit(identifier, data)              sends data to every user
// .broadcast.emit(identifier, data)    sends data to every user, except the newly created

var connectedUsers = 0;

io.on('connection', function(socket) {

    
    /*---------- THIS ALL HAPPENS ON EVERY NEW CONNECTION ----------*/
    console.log('A new user has connected: ' + socket.id);
	connectedUsers ++;
	console.log('Connected users: ' + connectedUsers);

	socket.emit('welcome', { msg: 'Welcome! your id is ' + socket.id });
	


    /*----- THESE ARE LISTENERS! CALLED WHEN A MSG IS RECEIVED -----*/
    // A listener for socket disconnection
    socket.on('disconnect', function() {
        io.sockets.emit('bye', 'See you, ' + socket.id + '!');
        connectedUsers --;
        console.log('Connected users: ' + connectedUsers);
    });    

    socket.on('msg-to-server', function(data) {
        io.sockets.emit('msg-to-clients', {
            id: socket.id,
            msg: data
        });
    });
    /*--------------------------------------------------------------*/
});

var Simulation = function(){

	//var obj = {};

	// CANVAS
	var width	= 500,
		height	= 500,
		canvas 	= new Canvas(width, height),
		ctx		= canvas.getContext('2d'),
		nFramesThisSec = 0,  // frame count
		fps = 0; // fps tracker


	var particles = [];
	function createParticle(){

		// radius
		this.radius = 50;

		// random pos
		this.x = this.radius + Math.random()*(width-this.radius*2); // btwn 50 and 450
		this.y = this.radius + Math.random()*(height-this.radius*2);

		// random velocity
		this.vx = Math.random()*10-5; // -5 to 5
		this.vy = Math.random()*10-5;

		// color
		this.color = "blue";
	}

	function getFps(){

		fps = nFramesThisSec;
		nFramesThisSec = 0;

	}


	function setup(){
		// console.log('Called setup');

		for (var i=0; i<5; i++){
			particles.push(new createParticle());
		}

		setInterval(update, 1000/200);
		setInterval(getFps, 1000); // every second update fps
		update();

	}

	function update(){
		// console.log('Called update');

		for (var i=0; i<particles.length; i++){

			var p = particles[i];

			// movement

			p.x += p.vx;
			p.y += p.vy;

			// bounce on bounds

			if (p.x <= p.radius || p.x >= width-p.radius){
				p.vx *= -1;
			}
			if (p.y <= p.radius || p.y >= height-p.radius){
				p.vy *= -1;
			}	
		}

		draw();
	}	

	function draw(){
		// console.log('Called draw');

		// bg
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,width,height);

		// particles
		for (var i=0; i<particles.length; i++){

			var p = particles[i];

			// circle
			ctx.beginPath();
			ctx.fillStyle = p.color;
			ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
			ctx.fill();

		}

		// fps draw
		ctx.fillStyle = "white";
		ctx.fillText("fps: " + fps.toFixed(2), 5,15);

		nFramesThisSec++;

		emitCanvas(); // send to client (if any)
		//saveToPng(); // save canvas to disk
	}

	function emitCanvas(filename){
		if (connectedUsers > 0){
			//io.sockets.emit('simulation', { type: 'URL', buffer: canvas.toDataURL()});
			//io.sockets.emit('simulation', { type: 'URL': buffer: filename });
			canvas.toBuffer(function(err,buf){
				if (err) throw err;
			 	//io.sockets.emit('simulation', { type: 'png64', buffer: buf.toString('base64')});
			 	io.sockets.emit('simulation', { type: 'rawbuf', buffer: buf})
			});
		}
	}

	function saveToPng(){

		var out = fs.createWriteStream(__dirname + '/public/frame_' + nFramesThisSec + '.png'),
  		stream = canvas.createPNGStream();

		stream.on('data', function(chunk){
	  		out.write(chunk);
		});

		stream.on('end', function(){
			console.log('saved frame_' + nFramesThisSec + '.png, fps: '+ fps);
			var fn = 'frame_'+nFramesThisSec+'.png';
			emitCanvas(fn);
		});
	}
	

	setup();


}

var simulation = new Simulation();






/*---------------------------------*/


/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
	console.log('Express server is running at ' + PORT);
});
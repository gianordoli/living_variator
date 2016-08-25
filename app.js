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

	var obj = {};

	// CANVAS
	var width	= 240,
		height	= 120,
		canvas 	= new Canvas(width, height),
		ctx		= canvas.getContext('2d');

	var posX, posY, speedX, speedY, radius;

	setup();

	function setup(){
		// console.log('Called setup');
		posX = 20;
		posY = 0;
		speedX = 2;
		speedY = 2;
		radius = 20;
		setInterval(update, 1000/60);
		update();
	}

	function update(){
		// console.log('Called update');

		posX += speedX;
		posY += speedY;

		if(posX < 0){
			posX = 0;
			speedX *= -1;
		}else if(posX > width){
			posX = width;
			speedX *= -1;
		}

		if(posY < 0){
			posY = 0;
			speedY *= -1;
		}else if(posY > height){
			posY = height;
			speedY *= -1;
		}		

		draw();
	}	

	function draw(){
		// console.log('Called draw');
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#09F';
		ctx.fillRect(posX, posY, radius, radius);
		io.sockets.emit('simulation', canvas.toDataURL());
	}
}

var simulation = new Simulation();




// var out = fs.createWriteStream(__dirname + '/state.png')
//   , stream = canvas.createPNGStream();

// stream.on('data', function(chunk){
//   out.write(chunk);
//   console.log('yo!');
// });



/*---------------------------------*/


/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
	console.log('Express server is running at ' + PORT);
});
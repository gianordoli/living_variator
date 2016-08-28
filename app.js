//---------- BASIC SETUP ----------
var express		= require('express'),
	bodyParser	= require('body-parser'),
	fs 			= require('fs');
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


/*---------- SIMULATION  ----------*/

var Simulation = require('./Simulation');

var simulation = new Simulation(1280,720,300,30,false); // width, height, fps, drawOnServer?
// simulation is now running using setInterval

var emitCanvas = function(filename){
	if (connectedUsers > 0){
		//io.sockets.emit('simulation', { type: 'URL', buffer: canvas.toDataURL()}); // send dataURL
		//io.sockets.emit('simulation', { type: 'URL': buffer: filename }); // send filename of saved png
		// simulation.canvas.toBuffer(function(err,buf){
		// 	if (err) throw err;
		//  	//io.sockets.emit('simulation', { type: 'png64', buffer: buf.toString('base64')}); // send img buffer as base64
		//  	io.sockets.emit('simulation', { type: 'rawbuf', buffer: buf}); // send raw img buffer (to encode base64 on client)
		// });
        io.sockets.emit('simulation', {
            type: 'cellData',
            buffer: simulation.cells, 
            info: { width : simulation.width, height: simulation.height, fps: simulation.fps } 
        });
	}
}

//setInterval(emitCanvas, 1000/20); // draw to client at specific fps

// UNCOMMENT LATER!!!
// simulation.onDraw = emitCanvas;


/*---------------------------------*/



/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
	console.log('Express server is running at ' + PORT);
});
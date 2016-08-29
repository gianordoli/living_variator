//---------- BASIC SETUP ----------
var express		= require('express'),
	bodyParser	= require('body-parser'),
	fs 			= require('fs'),
    jsonfile    = require('jsonfile'),
	Canvas 		= require('canvas')
    ;

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
	
    socket.emit('draw-connections', {
        inputs: inputs,
        controls: controls,
        connections: connections
    });


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

    // Receives connection (input to control) update from client
    socket.on('update-connections', function(data){
        connections = data;
        console.log(connections);
    });
    /*--------------------------------------------------------------*/
});

/*---------- DATA INPUT  ----------*/
var file = 'dummy_data/Incucyte_Hela_GFP_pilot_08_24_2016.json';
var data = jsonfile.readFileSync(file);
// Let's simulate a data update
setInterval(dataUpdate, 5000);
var currData = [];
var n = 0;
function dataUpdate(){
    var column = inputs[0];
    // console.log(data[n]);
    var newObj = {};
    // Let's constrain our inputs to the 'A' columns
    for(var prop in data[n]){
        if(inputs.indexOf(prop) > -1){
            newObj[prop] = data[n][prop];
        }
    }
    newObj['Date Time'] = data[n]['Date Time'];
    // console.log(newObj);
    io.sockets.emit('data-update', newObj);
    if(n < data.length - 1){
        n++;
    }
}

/*---------- DATA CONNECTION  ----------*/
var inputs = ['A1, Image 1', 'A1, Image 2', 'A1, Image 3', 'A1, Image 4', 'A1, Image 5', 'A1, Image 6', 'A1, Image 7', 'A1, Image 8', 'A1, Image 9', 'A1, Image 10', 'A1, Image 11', 'A1, Image 12', 'A1, Image 13', 'A1, Image 14', 'A1, Image 15', 'A1, Image 16'];
var controls = ['radius', 'acceleration', 'growth-rate', 'age', 'death-wait'];
// Assigning random connections to start
var connections = [
    { input: inputs[2], control: controls[0] },
    { input: inputs[5], control: controls[1] },
    { input: inputs[1], control: controls[2] },
    { input: inputs[13], control: controls[3] },
    { input: inputs[10], control: controls[4] }
    ];


/*---------- SIMULATION  ----------*/

var Simulation = require('./Simulation');

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

// UNCOMMENT LATER!!!
// var simulation = new Simulation(1280,720,300,30,false); // width, height, fps, drawOnServer?
//setInterval(emitCanvas, 1000/20); // draw to client at specific fps
// simulation.onDraw = emitCanvas;

/*---------------------------------*/



/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
	console.log('Express server is running at ' + PORT);
});
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

io.on('connection', function(socket) {

    
    /*---------- THIS ALL HAPPENS ON EVERY NEW CONNECTION ----------*/
    console.log('A new user has connected: ' + socket.id);

	// CANVAS
	var canvas 	= new Canvas(150, 150),
		ctx		= canvas.getContext('2d');


	ctx.fillRect(0,0,150,150);   // Draw a rectangle with default settings
	ctx.save();                  // Save the default state

	ctx.fillStyle = '#09F'       // Make changes to the settings
	ctx.fillRect(15,15,120,120); // Draw a rectangle with new settings

	ctx.save();                  // Save the current state
	ctx.fillStyle = '#FFF'       // Make changes to the settings
	ctx.globalAlpha = 0.5;    
	ctx.fillRect(30,30,90,90);   // Draw a rectangle with new settings

	ctx.restore();               // Restore previous state
	ctx.fillRect(45,45,60,60);   // Draw a rectangle with restored settings

	ctx.restore();               // Restore original state
	ctx.fillRect(60,60,30,30);   // Draw a rectangle with restored settings

	socket.emit('welcome', {
			msg: 'Welcome! your id is ' + socket.id,
			img: canvas.toDataURL()
			// img: '<img src="' +  + '" />'
		});
	


    /*----- THESE ARE LISTENERS! CALLED WHEN A MSG IS RECEIVED -----*/
    // A listener for socket disconnection
    socket.on('disconnect', function() {
        io.sockets.emit('bye', 'See you, ' + socket.id + '!');
    });    

    socket.on('msg-to-server', function(data) {
        io.sockets.emit('msg-to-clients', {
            id: socket.id,
            msg: data
        });
    });
    /*--------------------------------------------------------------*/
});



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
//---------- BASIC SETUP ----------
var    express		= require('express')
	,  bodyParser	= require('body-parser')
	,  fs 			= require('fs')
	,  jsonfile     = require('jsonfile')
	// Canvas 		= require('canvas')
	;

var app = express();						// our Express app

// Body Parser
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
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


/*-------------------- ROUTES  --------------------*/
app.get('/get-output', function(request, response){
	console.log('The client just sent a ' + request.method +
				' request for ' + request.url);

	var connections = dataConnector.getConnections();
	// Response object
	var obj = {};
	obj["output"] = {};
	obj["score"] = conway.score;

	for(var i = 0; i < connections.length; i++){
		var control = connections[i]["control"];
		obj["output"][control] = connections[i]["outputFinalValue"];
	}
	// console.log(obj);
	response.json(obj);
});

app.post('/send-input', function(request, response){
	console.log('The client just sent a ' + request.method +
				' request for ' + request.url);

	// console.log(request);
	// console.log(request["body"]);
	
	var err;
	
	if(Object.keys(request["body"]).length === 0){
		err = "Received an empty object.";
	}else if(!request["body"].hasOwnProperty("input")){
		err = "Expecting data enclosed into property 'input'.";
	}else{
		var input;

		// Let's check data types first. Python is sending a string, and postman an object. So...
		if(typeof request["body"]["input"] === "string"){
			input = JSON.parse(request["body"]["input"]);
		}else if(typeof request["body"]["input"] === "object"){
			input = request["body"]["input"];
		}else{
			err = "Data type not recognized."
		}

		// If we have an input...
		if(input !== undefined){
			if(input.length !== 16){
				err = "Missing data points. Expected 16, got " + input.length;
			}else{
				for(var i = 0; i < input.length; i++){
					if(isNaN(input[i])){
						err = "Input is not a number.";
						break;
					}
				}
			}
		}
	}

	// If everything went right...
	if(err === undefined){
		newInput(input);
		response.json("Received input: " + input);
	}else{
		console.log(err);
		response.json(err);
	}
});


/*---------- SOME AUX DATA FUNCTIONS  ----------*/
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

var map = function(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
};

var clamp = function(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

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
		outputs: Object.keys(conway.getOutputs()),
		controls: dataConnector.getControls(),
		connections: dataConnector.getConnections()
	});


	/*----- THESE ARE LISTENERS! CALLED WHEN A MSG IS RECEIVED -----*/
	// A listener for socket disconnection
	socket.on('disconnect', function() {
		io.sockets.emit('bye', 'See you, ' + socket.id + '!');
		connectedUsers --;
		console.log('Connected users: ' + connectedUsers);
	});

	// Receives connection (input to control) update from client
	socket.on('update-connections', function(data){
		// console.log(data);
		dataConnector.updateParameters(data);
	});
	/*--------------------------------------------------------------*/
});


/*---------- CONWAY GAME ----------*/

var Conway = require('./conway_game');

var emitConwayGame = function(data){ // send conway data to client
	
	// console.log("Called emitConwayGame.");

	if (connectedUsers > 0){
		io.sockets.emit('game', {
			type: 'conway',
			width: data.width,
			height: data.height,
			cells: data.cells,
			input: data.input,
			output: data.output,
			score: data.score,
			fps: data.fps,
			connections: dataConnector.getConnections()
		});
	}
};

var conway = new Conway(100,80,15,true); // w, h, fps, wrap edges?
// conway.initSectionPercent(0,0,99,79,0.5); // half alive

var initInputSections = function(){ // init input sections (8 vertical divisions)
	var inpH = Math.floor(conway.height/16);
	var inpW = conway.width;
	var x1 = 0, y1 = 0, x2 = inpW-1, y2 = inpH-1;
	for (var i=0; i<16; i++){
		var name = i.toString();
		conway.addInput(x1,y1,x2,y2,name);
		y1+=inpH;
		y2+=inpH;
	}
};
var initOutputSections = function(){ // init output sections (10 horizontal divisions)
	var outW = Math.floor(conway.width/10);
	var outH = conway.height;
	var x1 = 0, y1 = 0, x2 = outW-1, y2 = outH-1;
	for (var i=0; i<10; i++){
		var name = i.toString();
		conway.addOutput(x1,y1,x2,y2,name);
		x1+=outW;
		x2+=outW;
	}
};

// setup draw callback
var draw = conway.onDraw(function(err,data){
	dataConnector.updateValues(data["output"], data["frameCount"]);
	emitConwayGame(data);
});
if (draw) console.log("set draw callback successfully");
else console.log("error setting draw callback");


var newInput = function(data){
	conway.stop();
	console.log(data);
	var min = data.min();
	var max = data.max();
	// console.log(min, max);
	for (var i=0; i<data.length; i++){
		// var pct = Math.random()*0.5; // 0 - 0.5 - anything over 0.5 less dynamic
		var pct = map(data[i], min, max, 0, 0.5);
		// console.log(pct);
		conway.setInput(i.toString(), pct);
		console.log("set conway input "+i+" to pct: "+pct);
	}
	conway.start();
};


// DUMMY DATA
var file = 'dummy_data/dummy_data.json';
var data = jsonfile.readFileSync(file);     // Read dummy data
var n = 0;
var newInput = function(){
	conway.stop();
	var min = data[n].min();
	var max = data[n].max();
	// console.log(min, max);
	for (var i=0; i<data[n].length; i++){
		// var pct = Math.random()*0.5; // 0 - 0.5 - anything over 0.5 less dynamic
		var pct = map(data[n][i], min, max, 0, 0.5);
		// console.log(pct);
		conway.setInput(i.toString(), pct);
		console.log("set conway input "+i+" to pct: "+pct);
	}
	if (n < data.length - 1) n++;
	else n = 0;
	conway.start();
};
setInterval(newInput, 15000);               // every 15 sec, 16 new inputs ranged 0-1

var dataConnector = new DataConnector();    // Connect i/o
initInputSections();
initOutputSections();
conway.start();                             // Start game


/*---------- DATA CONNECTION  ----------*/

function DataConnector(){

	var controls = ['water-1', 'water-2', 'water-3', 'water-4', 'water-5',
					'light-1', 'light-2', 'light-3',
					'AC',
					'heating'
					];
	var connections = [];
	// connections = [
	//     {
	//         control: "water-1",         // List of controls
	//         outputIndex: 0-15,          // Conway's output index
	//         outputOriginalValue: 0-255, // Conway's outMap
	//         outputIntensity: 0.1-10,    // Intensity multiplier
	//         outputFinalValue: 0-255,    // outputOriginalValue * outputIntensity
	//         frequency: 1-100,	       // output update frequency, relative to frameCount
	//     }, ...
	// ];

	this.setup = function(obj){
		for(var i = 0; i < controls.length; i++){
			var connectionObj = {
				outputIndex: i,
				control: controls[i],
				outputIndex: i,
				outputOriginalValue: 0,
				outputIntensity: 1,
				// outputIntensity: Math.random()*10,
				outputFinalValue: 0,
				frequency: 1
				// frequency: (i === 9) ? (100) : (1)
			};
			connections.push(connectionObj);
		}
	};

	this.updateValues = function(data, frameCount){
		// console.log("Called updateValues");
		// console.log("data: ", data);
		// console.log("frameCount: ", frameCount);
		for(var i = 0; i < connections.length; i++){
			var connectionObj = connections[i];
			// Update to connections will be based on their frequency
			if(frameCount % connectionObj["frequency"] === 0){
				var outputIndex = connectionObj["outputIndex"].toString();
				connectionObj["outputOriginalValue"] = data[outputIndex]["outMap"];
				connectionObj["outputFinalValue"] = connectionObj["outputOriginalValue"] * connectionObj["outputIntensity"];
				connectionObj["outputFinalValue"] = Math.round(clamp(connectionObj["outputFinalValue"], 0, 255));
			}
			// console.log(i, connectionObj["outputOriginalValue"], connectionObj["outputIntensity"], connectionObj["frequency"], connectionObj["outputFinalValue"]);
		}
	};

	this.updateParameters = function(data){
		// updateObject = {
		//     control: "water-1",
		//     outputIndex: 0-15,
		//     outputIntensity: 0.1-10,
		//     frequency: 1000-5000
		// }
		for(var i = 0; i < connections.length; i++){
			for(var j = 0; j < data.length; j++){
				if(connections[i]["control"] === data[j]["control"]){
					for(prop in data[j]){
						connections[i][prop] = data[j][prop];
					}
				}
			}
		}
	};

	this.getConnections = function(){
		return connections;
	};

	this.getControls = function(){
		return controls;
	};

	this.setup();
}




/*---------------------------------*/

/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
	console.log('Express server is running at ' + PORT);
});
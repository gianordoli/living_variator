//---------- BASIC SETUP ----------
var    express		= require('express')
	,  bodyParser	= require('body-parser')
	,  fs 			= require('fs')
    ,  jsonfile     = require('jsonfile')
	// Canvas 		= require('canvas')
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
setInterval(dataUpdate, 1000);

var currData = [];
var n = 0;
function dataUpdate(){
    // NEED TO CONNECT THIS TO TYLER'S SIM

    // var column = inputs[0];
    // // console.log(data[n]);
    // var newObj = {};
    // // Let's constrain our inputs to the 'A' columns
    // for(var prop in data[n]){
    //     if(inputs.indexOf(prop) > -1){
    //         newObj[prop] = data[n][prop];
    //     }
    // }
    // newObj['Date Time'] = data[n]['Date Time'];
    // // console.log(newObj);
    // io.sockets.emit('data-update', newObj);
    // if(n < data.length - 1){
    //     n++;
    // }else{
    //     n = 0;
    // }
}


/*---------- CONWAY GAME ----------*/

var Conway = require('./conway_game');

var emitConwayGame = function(data){ // send conway data to client
	if (connectedUsers > 0){
        io.sockets.emit('game', {
            type: 'conway',
            width: data.width,
            height: data.height,
            cells: data.cells,
            input: data.input,
            output: data.output,
            fps: data.fps
        });
	}
};

var conway = new Conway(100,80,15,true); // w, h, fps, wrap edges?
// conway.initSectionPercent(0,0,99,79,0.5); // half alive

var initInputSections = function(){ // init input sections (8 vertical divisions)
    var inpH = Math.floor(conway.height/8);
    var inpW = conway.width;
    var x1 = 0, y1 = 0, x2 = inpW-1, y2 = inpH-1;
    for (var i=0; i<8; i++){
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
initInputSections();
initOutputSections();
var dataConnector = new DataConnector();

// setup draw callback
var draw = conway.onDraw(function(err,data){ emitConwayGame(data);});
    if (draw) console.log("set draw callback successfully");
    else console.log("error setting draw callback");

// setup dummy inputs
setInterval(function(){
    conway.stop();
    for (var i=0; i<8; i++){
        var pct = Math.random()*0.5; // 0 - 0.5 - anything over 0.5 less dynamic
        conway.setInput(i.toString(), pct);
        console.log("set conway input "+i+" to pct: "+pct);
    }
    conway.start();
}, 15000); // every 15 sec, 8 new inputs ranged 0-1

// start game
conway.start();



/*---------- DATA CONNECTION  ----------*/

function DataConnector(){

    var controls = ['water-1', 'water-2', 'water-3', 'water-4', 'water-5',
                    'light-1', 'light-2', 'light-3',
                    'AC',
                    'heating'
                    ];
    var connections = [];
    
    this.assignConnections = function(obj){
        if(!obj){
            // Assigning random connections to start
            for(var i = 0; i < controls.length; i++){
                connections.push({
                    output: i,
                    control: controls[i]
                });
            }
        }
    };

    this.getConnections = function(){
        return connections;
    };

    this.getControls = function(){
        return controls;
    };

    this.assignConnections();
}




/*---------------------------------*/

/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
	console.log('Express server is running at ' + PORT);
});
//---------- BASIC SETUP ----------
var    express      = require('express')
    ,  bodyParser   = require('body-parser')
    ,  fs           = require('fs')
    ,  jsonfile     = require('jsonfile')
    // Canvas       = require('canvas')
    ;

var app = express();                        // our Express app

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());                         // parse application/json

// Express server
app.use(function(req, res, next) {
    // Setup a Cross Origin Resource sharing
    // See CORS at https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);  // Show the URL user just hit by user
    next();
});

app.use('/', express.static(__dirname + '/public'));

var server = require('http').Server(app);
var io = require('socket.io')(server);

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


/*---------- SOCKET.IO  ----------*/
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
        // console.log(data);
        dataConnector.assignConnections(data);
    });
    /*--------------------------------------------------------------*/
});


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
        }else{
            connections = obj;
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
            score: data.score,
            fps: data.fps
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
var draw = conway.onDraw(function(err,data){ emitConwayGame(data);});
    if (draw) console.log("set draw callback successfully");
    else console.log("error setting draw callback");

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

var dataConnector = new DataConnector();    // Connect i/o
var file = 'dummy_data/dummy_data.json';
var data = jsonfile.readFileSync(file);     // Read dummy data
initInputSections();
initOutputSections();
setInterval(newInput, 15000);               // every 15 sec, 8 new inputs ranged 0-1
conway.start();                             // Start game


/*---------- BASIC SETUP ----------*/
var PORT = process.env.PORT || 4000;
server.listen(PORT, function(){
    console.log('Express server is running at ' + PORT);
});
/* Your code starts here */

var app = app || {};

app.main = (function(simulation) {
	console.log('Your code starts here!');

	var socket;
	var body = document.getElementsByTagName('body')[0];	
	//var img = document.createElement('img');
	//body.appendChild(img);	
	var canvas = document.getElementById('sim');
	var ctx = canvas.getContext('2d');

	var loadData = function(){
		console.log('Called loadData');
		$.getJSON('dummy_data/Incucyte_Hela_GFP_pilot_08_24_2016.json', function(json){
			console.log('Data received.');
			console.log(json);
			for(var i = 0; i < json.length; i++){
				json[i]['Date Time'] = new Date(json[i]['Date Time']);				
			}
			console.log(json);
		});
	}

	var drawUI = function(){
		var inputs = ['A1, Image 1', 'A1, Image 2', 'A1, Image 3', 'A1, Image 4', 'A1, Image 5', 'A1, Image 6', 'A1, Image 7', 'A1, Image 8', 'A1, Image 9', 'A1, Image 10', 'A1, Image 11', 'A1, Image 12', 'A1, Image 13', 'A1, Image 14', 'A1, Image 15', 'A1, Image 16'];
		var controls = ['radius', 'acceleration', 'growth-rate', 'age', 'death-wait'];

		// INPUTS
		var inputList = $('<ul id="input-list"></ul>');		
		for(var i = 0; i < inputs.length; i++){
			var listItem = $('<li id="'+inputs[i]+'">'+inputs[i]+'</li>').draggable({
				cursor: 'move',
				containment: 'document',
				helper: myHelper
			});
			$(inputList).append(listItem);
		}

		function myHelper(event) {
		  return '<div class="connector"></div>';
		}


		// CONTROLS
		var controlList = $('<ul id="control-list"></ul>');		
		for(var i = 0; i < controls.length; i++){
			var listItem = $('<li id="'+controls[i]+'">'+controls[i]+'</li>').droppable({
		      drop: handleDropEvent
		    });
			$(controlList).append(listItem);
		}

		function handleDropEvent( event, ui ) {
			drawConnection(ui.draggable, this);
		}


		// SVG
		var textLineHeight = 24;
		var svgCanvas = makeSVG('svg', {id: 's', width: 200, height: 500});

		function makeSVG(tag, attrs) {
            var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var k in attrs)
                el.setAttribute(k, attrs[k]);
            return el;
        }

		function drawConnection(input, output){
			var a = $(input).index();
			var b = $(output).index();
			var x1 = 0;
			var x2 = 200;
			var y1 = (a * textLineHeight) + textLineHeight;
			var y2 = (b * textLineHeight) + textLineHeight;
			var line = makeSVG('line', {
				x1: x1, y1: y1, x2: x2, y2: y2,
				input: $(input).attr('id'),
				output: $(output).attr('id')
			});
	        document.getElementById('s').appendChild(line);
	        line.onmousedown = function() {
	            console.log(this);
	        };
		}

		$('body').append(inputList);
		body.appendChild(svgCanvas);
		$('body').append(controlList);
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
				simulation.drawCellData(data.buffer, data.info, ctx);
			}

		});

	};

	var init = function(){
		console.log('Initializing app.');
		socketSetup();
		loadData();
		drawUI();
	};

	return {
		init: init
	};

})(simulation);

window.addEventListener('DOMContentLoaded', app.main.init);
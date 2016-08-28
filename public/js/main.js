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
			var listItem = $('<li id="'+controls[i]+'" in-use="false">'+controls[i]+'</li>').droppable({
		      drop: handleDropEvent
		    });
			$(controlList).append(listItem);
		}

		function handleDropEvent( event, ui ) {
			if(this.getAttribute('in-use') === 'false'){
				drawConnection(ui.draggable, this);
				this.setAttribute('in-use', true);				
			}
		}


		// SVG
		var textLineHeight = 24;
		var svgWidth = 200;
		var svgHeight = inputs.length * textLineHeight;
		var svgCanvas = makeSVG('svg', {id: 's', width: svgWidth, height: svgHeight});

		function makeSVG(tag, attrs) {
            var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var k in attrs)
                el.setAttribute(k, attrs[k]);
            return el;
        }

		function drawConnection(input, control){
			var a = $(input).index();
			var b = $(control).index();
			var x1 = 5;
			var x2 = svgWidth - 5;
			var y1 = (a * textLineHeight) + textLineHeight/2;
			var y2 = (b * textLineHeight) + textLineHeight/2;
			var line = makeSVG('line', {
				x1: x1, y1: y1, x2: x2, y2: y2,
				input: $(input).attr('id'),
				control: $(control).attr('id')
			});
	        document.getElementById('s').appendChild(line);
	        
	        // Click on the line removes drawing
	        line.onmousedown = function() {
	            this.parentNode.removeChild(this);
	            $(control).attr('in-use', 'false');
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
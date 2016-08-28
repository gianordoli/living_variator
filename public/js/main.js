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

	var appendData = function(data){
		console.log('Called appendData');
		console.log(data);
		for(var prop in data){

		}
	}

	var drawUI = function(inputs, controls, connections){
		console.log('Called drawUI');
		console.log(inputs);
		console.log(controls);
		console.log(connections);

		// INPUTS
		var inputList = $('<ul id="input-list"></ul>');		
		for(var i = 0; i < inputs.length; i++){
			var listItem = $('<li></li>');
			var header = $('<p id="'+inputs[i]+'">'+inputs[i]+'</p>').draggable({
				cursor: 'move',
				containment: 'document',
				helper: myHelper
			})
			.appendTo(listItem);

			$(inputList).append(listItem);
		}

		function myHelper(event, ui) {
			return '<div class="connector">'+$(event.target).attr('id')+'</div>';
		}


		// CONTROLS
		var controlList = $('<ul id="control-list"></ul>');		
		for(var i = 0; i < controls.length; i++){
			var listItem = $('<li id="'+controls[i]+'" in-use="true">'+controls[i]+'</li>').droppable({
		      drop: handleDropEvent
		    });
			$(controlList).append(listItem);
		}

		function handleDropEvent( event, ui ) {
			console.log('Called handleDropEvent');
			if(this.getAttribute('in-use') === 'false'){
				drawConnection(ui.draggable, this);
				this.setAttribute('in-use', true);				
			}
		}


		// SVG
		var spacing = window.innerWidth/20;
		var svgWidth = window.innerWidth;
		var svgHeight = 200;
		var svgCanvas = makeSVG('svg', {id: 's', width: svgWidth, height: svgHeight});

		// You can't use JQuery to append SVG elements, so...
		function makeSVG(tag, attrs) {
            var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var k in attrs)
                el.setAttribute(k, attrs[k]);
            return el;
        }

		function drawConnection(input, control){
			var a = $(input).parent().index();
			console.log(a);
			var b = $(control).index();
			var y1 = svgHeight - 5;
			var y2 = 5;
			var x1 = (a * spacing) + spacing/2;
			var x2 = (b * spacing) + spacing/2;
			var line = makeSVG('line', {
				x1: x1, y1: y1, x2: x2, y2: y2,
				input: $(input).attr('id'),
				control: $(control).attr('id')
			});
	        document.getElementById('s').appendChild(line);
	        
	        line.onmousedown = function() {
	        	// Click on the line removes drawing...
	            this.parentNode.removeChild(this);
	            // ...and set <control in-use> to false
	            $(control).attr('in-use', 'false');
	        };
		}

		// When updating, loop through all lines and get a list of input -> control
		var btUpdate = $('<button>Update</button>')
			.off('click').on('click', function(){
				var updatedConnections = [];				
				var lines = document.getElementsByTagName('line');
				for(var i = 0; i < lines.length; i++){
					updatedConnections.push({
						input: lines[i].getAttribute('input'),
						control: lines[i].getAttribute('control') 
					});
				}
				console.log(updatedConnections);
				socket.emit('update-connections', updatedConnections);
			});

		$('body').append(controlList);
		body.appendChild(svgCanvas);
		$('body').append(inputList);
		$('body').append(btUpdate);	


        // Drawing connections read from server	
        for(var i = 0; i < connections.length; i++){
        	var input = document.getElementById(connections[i]['input']);
        	var control = document.getElementById(connections[i]['control']);
        	drawConnection(input, control);
        }
	}


	// Initializing socket and adding listener functions
	var socketSetup = function(){
		
		// Connect
	    socket = io.connect();

		// Listeners
		socket.on('welcome', function(data){
			console.log(data.msg);
		});

		socket.on('data-update', function(data){
			appendData(data);
		});	

		socket.on('draw-connections', function(data){
			console.log(data);
			drawUI(data.inputs, data.controls, data.connections);
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
	};

	return {
		init: init
	};

})(simulation);

window.addEventListener('DOMContentLoaded', app.main.init);
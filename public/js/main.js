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
		// console.log('Called appendData');
		// console.log(data);
		for(var prop in data){
			if(prop !== 'Date Time'){
				var parent = document.getElementById(prop).parentNode;
				var dataLog = parent.getElementsByClassName('data-log')[0];
				var newData = document.createElement('li');
				newData.innerHTML = data[prop].toFixed(2);
				dataLog.appendChild(newData)
			}
		}
	}

	var drawUI = function(inputs, controls, connections){
		console.log('Called drawUI');
		console.log(inputs);
		console.log(controls);
		console.log(connections);

		if(document.getElementById('input-list') === null){
			setup();
		
		}else{
			update();
		}

		function setup(){
			console.log('Creating UI');

			for(var i = 0; i < controls.length; i++){

				var controlParent = $('<div class="control-parent"></div>');				

				// input
				var divInput = $('<div class="input"></div>');

				var dropdown = $('<select></select>');
				for(var j = 0; j < inputs.length; j++){
					$(dropdown)
						.append('<option value="'+inputs[j]+'">'+inputs[j]+'</option>')
						;
				}
				$(divInput)
					.append('<h6>INPUT</h6>')
					.append(dropdown)
					.append('<div class="data"></div>')
					;

				// control
				var divControl = $('<div class="control"></div>');

				$(divControl)
					.append('<h6>CONTROL</h6>')
					.append('<p>'+controls[i]+'</p>')
					.append('<div class="data"></div>')
					;
					

				$(controlParent)
					.append(divInput)
					.append(divControl)
					.appendTo('body')
					;

				// $(body).append(controlParent);
			}
			// for(var i = 0; i < inputs.length; i++){
			// 	var listItem = $('<li class="data-connection"></li>');
			// 	var header = $('<p id="'+inputs[i]+'">'+inputs[i]+'</p>').draggable({
			// 		cursor: 'move',
			// 		containment: 'document',
			// 		helper: myHelper
			// 	})
			// 	.appendTo(listItem);
			// 	$(listItem).append('<ul class="data-log"></ul>');

			// 	$(inputList).append(listItem);
			// }

			// var inputList = $('<ul id="input-list"></ul>');		
			// for(var i = 0; i < inputs.length; i++){
			// 	var listItem = $('<li class="data-connection"></li>');
			// 	var header = $('<p id="'+inputs[i]+'">'+inputs[i]+'</p>').draggable({
			// 		cursor: 'move',
			// 		containment: 'document',
			// 		helper: myHelper
			// 	})
			// 	.appendTo(listItem);
			// 	$(listItem).append('<ul class="data-log"></ul>');

			// 	$(inputList).append(listItem);
			// }


			// // CONTROLS
			// var controlList = $('<ul id="control-list"></ul>');		
			// for(var i = 0; i < controls.length; i++){
			// 	var listItem = $('<li id="'+controls[i]+'" in-use="true" class="data-connection">'+controls[i]+'</li>').droppable({
			//       drop: handleDropEvent
			//     });
			// 	$(controlList).append(listItem);
			// }

					// var updatedConnections = [];				
					// var lines = document.getElementsByTagName('line');
					// for(var i = 0; i < lines.length; i++){
					// 	updatedConnections.push({
					// 		input: lines[i].getAttribute('input'),
					// 		control: lines[i].getAttribute('control') 
					// 	});
					// }
					// console.log(updatedConnections);
					// socket.emit('update-connections', updatedConnections);

			// $('body').append(btUpdate);	
			// $('body').append(controlList);
			// body.appendChild(svgCanvas);
			// $('body').append(inputList);

			// update();
		}

		function update(){
	        // Drawing connections read from server	
	        for(var i = 0; i < connections.length; i++){
	        	var input = document.getElementById(connections[i]['input']);
	        	var control = document.getElementById(connections[i]['control']);
	        	drawConnection(input, control);
	        }
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
			// appendData(data);
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
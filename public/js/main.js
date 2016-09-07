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

	function appendData(data){
		console.log('Called appendData');
		console.log(data);
		for(var prop in data){
			var dropdown = $('option[value="'+prop+'"][selected="selected"]');

			if(dropdown.length > 0){
				// console.log(dropdown);
				$(dropdown)
					.parent()
					.parent()
					.find('.data-output')
					.prepend('<li>'+data[prop]['pct']+'</li>')
					;
				// console.log(dataLog);
			}
		}
	};

	function drawUI(outputs, controls, connections){
		console.log('Called drawUI');
		console.log(outputs);
		console.log(controls);
		console.log(connections);

		if($('#ui').length === 0){
			setup();
		
		}else{
			update();
		}

		function setup(){

			console.log('Creating UI');

			var ui = $('<div id="ui"></div>');			

			for(var i = 0; i < controls.length; i++){

				var controlParent = $('<div class="control-parent"></div>');				

				// output
				var divOutput = $('<div class="output"></div>');

				var dropdown = $('<select id="'+controls[i]+'"></select>');
				for(var j = 0; j < outputs.length; j++){
					$(dropdown)
						.append('<option value="'+outputs[j]+'">'+outputs[j]+'</option>')
						;
				}
				$(divOutput)
					.append('<h6>OUTPUT</h6>')
					.append(dropdown)
					.append('<ul class="data-output"></ul>')
					;

				// control
				var divControl = $('<div class="control"></div>');

				$(divControl)
					.append('<h6>CONTROL</h6>')
					.append('<p>'+controls[i]+'</p>')
					.append('<ul class="data-control"></ul>')
					;
					

				$(controlParent)
					.append(divOutput)
					.append(divControl)
					.appendTo(ui)
					;
			}

			$(ui)
				.append('<button id="bt-update">Update</button>')
				.off('click')
				.on('click', function(){

					$('.data-control, .data-output').empty();

					var updatedConnections = [];
					var selects = $('select');
					for(var i = 0; i < selects.length; i++){
						updatedConnections.push({
							output: $(selects[i]).val(),
							control: $(selects[i]).attr('id') 
						});						
					}
					console.log(updatedConnections);
					socket.emit('update-connections', updatedConnections);
				})
				.appendTo('body')
				;				

			update();
		}

		function update(){
	        // Updating dropdowns based on data read from server	
	        for(var i = 0; i < connections.length; i++){
	        	var dropdown = $('#'+connections[i]['control'])
	        		.change(function(){
	        			handleChange(this);
	        		})
	        		;
	        	$(dropdown).val(connections[i]['output']);
	        	handleChange(dropdown);
	        }
	        function handleChange(obj){
    			var options = $(obj).find('option');
    			for(var i = 0; i < options.length; i++){
    				if($(options[i]).val() == $(obj).val()){
						$(options[i]).attr('selected', true);
    				}else{
						$(options[i]).removeAttr('selected');
    				}
    			}
	        }
		}
	}


	// Initializing socket and adding listener functions
	function socketSetup(){
		
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
			drawUI(data.outputs, data.controls, data.connections);
		});		

		socket.on('game', function(data){ // raw game data for client side canvas render

			simulation.drawCellData(data, ctx);
			appendData(data['output']);
			//simulation.drawCellData(data.buffer, data.info, ctx);

			/*
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
			*/

		});

	}

	var init = function(){
		console.log('Initializing app.');
		socketSetup();
	};

	return {
		init: init
	};

})(simulation);

window.addEventListener('DOMContentLoaded', app.main.init);
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
	var graphCanvas = document.getElementById('outGraph');
	var graphCtx = graphCanvas.getContext('2d');

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

				var controlParent = $('<div class="control-parent" id="'+controls[i]+'"></div>');				

				var controlDiv = $("<div></div>");
				$(controlDiv).append('<h6>CONTROL</h6>')
					.append('<span>'+controls[i]+'</span>');

				var outputDiv = $("<div></div>");
				var dropdown = $('<select></select>');
				for(var j = 0; j < outputs.length; j++){
					$(dropdown)
						.append('<option value="'+outputs[j]+'">'+outputs[j]+'</option>')
		        		.change(function(){
		        			handleDropdownChange(this);
		        		})						
						;
				}
				$(outputDiv).append('<h6>OUTPUT</h6>')
					.append(dropdown);

				var frequencyDiv = $("<div></div>")
				var frequencySlider = $("<input type='range' class='frequency' min='-100' max='1'/>")
					.change(function(){
						handleSliderChange(this);
					})
					;
				$(frequencyDiv).append('<h6>FREQUENCY</h6>')
					.append(frequencySlider)
					.append("<span></span>");

				$(controlParent)
					.append(controlDiv)
					.append(outputDiv)
					.append(frequencyDiv)
					;
					
				$(controlParent).appendTo(ui);
			}

			var updateButton = $('<button id="bt-update">Update</button>')
				.off('click')
				.on('click', function(){

					$('.data-control, .data-output').empty();

					var updatedConnections = [];
					var parents = $('.control-parent');

					for(var i = 0; i < parents.length; i++){
				        // updateObject = {
				        //     control: "water-1",
				        //     outputIndex: 0-15,
				        //     outputIntensity: 0.1-10,
				        //     frequency: 1-100
				        // }
						updatedConnections.push({
							control: $(parents[i]).attr('id'),
							outputIndex: $(parents[i]).find("select").val(),
							outputIntensity: 1,
							frequency:  Math.abs(parseInt($(parents[i]).find(".frequency").val()))
						});						
					}
					console.log(updatedConnections);
					socket.emit('update-connections', updatedConnections);
				})
				;

			$(ui).append(updateButton);
			$(ui).appendTo('body')	

			updateUI();
		}

		function updateUI(){
			console.log("Called updateUI.");
	        // Updating UI controls based on data read from server	
	        for(var i = 0; i < connections.length; i++){
	        	var container = $('#'+connections[i]['control']);
	        	console.log(container);
	        	var dropdown = $(container).find("select");
	        	$(dropdown).val(connections[i]['outputIndex']);
	        	handleDropdownChange(dropdown);
				
				var slider = $(container).find("input[type='range']");
	        	$(slider).val(- connections[i]['frequency']);
	        	handleSliderChange(slider);
	        }
		}

		function handleDropdownChange(obj){
        	// $('.data-output').empty();
			var options = $(obj).find('option');
			for(var i = 0; i < options.length; i++){
				if($(options[i]).val() === $(obj).val()){
					$(options[i]).attr('selected', true);
				}else{
					$(options[i]).removeAttr('selected');
				}
			}
		}

		function handleSliderChange(obj){
			$(obj).parent().children("span").html("1/" + Math.abs($(obj).val()));
		}
	}

	function updateViz(data){
		// console.log('Called updateViz');
		// console.log(data);
		for(var prop in data){
			
			var container = $("#"+prop);

			if(container.length > 0){
				
				var color;
				if(control.indexOf('water') > -1){
					color = {
						red: 0,
						green: 100,
						blue: 255
					};
				}else if(control.indexOf('light') > -1){
					color = {
						red: 255,
						green: 180,
						blue: 0
					};					
				}else if(control.indexOf('heating') > -1){
					color = {
						red: 255,
						green: 0,
						blue: 0
					};					
				}else if(control.indexOf('AC') > -1){
					color = {
						red: 0,
						green: 0,
						blue: 0
					};
				}
				$(container)
					.css({
						'background-color': 'rgba('+color['red']+','+
													color['green']+','+
													color['blue']+','+
													(data[prop]['outputFinalValue']*5)+')'
					});
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

		socket.on('draw-connections', function(data){
			console.log(data);
			drawUI(data.outputs, data.controls, data.connections);
		});		

		socket.on('game', function(data){ // raw game data for client side canvas render

			simulation.drawCellData(data, ctx);
			simulation.drawOutputGraph(data, graphCtx); // draw output graph for smooth testing
			// console.log(data["connections"]);
			updateViz(data["connections"]);
			// appendData(data['output']);
			
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
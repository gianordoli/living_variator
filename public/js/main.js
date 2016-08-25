/* Your code starts here */

var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var socket;
	var body = document.getElementsByTagName('body')[0];	
	var img = document.createElement('img');
	body.appendChild(img);	

	// Initializing socket and adding listener functions
	var socketSetup = function(){
		
		// Connect
	    socket = io.connect();

		// Listeners
		socket.on('welcome', function(data){
			console.log(data.msg);
		});

		socket.on('simulation', function(data){
			console.log(data);
			img.src = data;			
		});

	};

	var init = function(){
		console.log('Initializing app.');

		socketSetup();	// Sending attachEvents as a callback	
	};

	return {
		init: init
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);
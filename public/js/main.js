/* Your code starts here */

var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var socket;

	// Initializing socket and adding listener functions
	var socketSetup = function(){
		
		// Connect
	    socket = io.connect();

		// Listeners
		socket.on('welcome', function(data){
			console.log(data.msg);
			console.log(data.img);
			var body = document.getElementsByTagName('body')[0];
			console.log(body);
			var img = document.createElement('img');
			img.src = data.img;
			body.appendChild(img);
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
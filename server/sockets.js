
var gameInProgress = {};
var lastGameIDCreated = null;

function sockets(server) {

	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket) {
		console.log('User connected');


		socket.on('joinRoom', function (user) {
			if (lastGameIDCreated !== null) {
				var game = joinGame(user);
			} else {
			 	var game = createGame(user);
			}

			socket.join('Room:' + game.id);
			console.log('User ' + user.username + ' have join Room:' + game.id);
			io.sockets.to('Room:' + game.id).emit('joinedRoom', game);
		});

		socket.on('sendSet', function (data) {
			console.log('Send Set on Room:' + data.id);
			gameInProgress[data.id].set = data.set;
			socket.broadcast.to('Room:' + data.id).emit('sendedSet', data.set);
		});
	});
	
	function createGame(user) {
		var uniqID = createUniqIDGame();

		gameInProgress[uniqID] = {
			id: uniqID,
			users: [user]
		};
		lastGameIDCreated = uniqID;

		return gameInProgress[uniqID];
	}

	function joinGame(user) {
		var game = gameInProgress[lastGameIDCreated];
		game.users.push(user);
		if (game.users.length >= 2) {
			lastGameIDCreated = null;
		}
		return game;
	}

	function createUniqIDGame() {
		var noUniq = true;
		while (noUniq) {
			var uniqID = Math.round((new Date()).getTime() * Math.random());

			if (typeof gameInProgress[uniqID] === 'undefined') {
				noUniq = false;
			}
		}
		return uniqID;
	}
}

exports.sockets = sockets;
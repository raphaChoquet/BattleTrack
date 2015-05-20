
var gameInProgress = {};
var lastGameIDCreated = null;

function sockets(server) {

	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket) {
		console.log('test');
		if (lastGameIDCreated !== null) {
			var gameID = joinGame();
		} else {
			var gameID = createGame();
		}

		socket.join('Room:' + gameID);

		socket.emit('retrievedRoomID', gameID);

		socket.on('sendQuizz', function (game) {
			socket.to('Room:' + game.id).broadcast.emit('sendedQuizz', game);
		});

	});
	
	function createGame(clientID) {
		var uniqID = createUniqIDGame();
		var gameID = uniqID;

		gameInProgress[uniqID] = gameID;
		lastGameIDCreated = uniqID;

		return gameInProgress[uniqID];
	}

	function joinGame(clientID) {
		var gameID = gameInProgress[lastGameIDCreated];
		lastGameIDCreated = null;
		return gameID;
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
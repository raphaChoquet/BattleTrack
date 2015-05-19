
var gameInProgress = {};
var lastIDGameCreate = null;

function sockets(server) {

	var io = require('socket.io').listen(server);

	io.sockets.on('connection', function (socket) {
		console.log('connection');

		if (lastIDGameCreate !== null) {
			var game = joinGame()
		} else {
			var game = createGame();
		}



		socket.emit('sendedRoomID', game);

		function createGame(clientID) {
			var uniqID = createUniqIDGame();
			var game = uniqID;

			gameInProgress[uniqID] = game;
			lastIDGameCreate = uniqID;

			createRoom(game);

			return gameInProgress[uniqID];
		}

		function joinGame(clientID) {
			var game = gameInProgress[lastIDGameCreate];
			lastIDGameCreate = null;
			createRoom(game);
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

		function createRoom(game) {
			console.log('Room', game);
			
			socket.on('sendQuizz-' + game, function (quizz) {
				console.log('received');
				socket.broadcast.emit('retrievedQuizz-' + game, quizz);
			});
		}

	});


}
exports.sockets = sockets;
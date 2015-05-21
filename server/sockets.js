
var gameInProgress = {};
var lastGameIDCreated = null;

function sockets(server) {

	var io = require('socket.io').listen(server);
	var me = {
		username: null,
		currentGame: null
	}
	io.sockets.on('connection', function (socket) {
		console.log('User connected');

		socket.on('joinRoom', function (user) {
			console.log(lastGameIDCreated);
			if (lastGameIDCreated !== null) {
				var game = joinGame(user);
			} else {
			 	var game = createGame(user);
			}
			me.username = user.username;
			me.currentGame = game.id;

			socket.join('Room:' + game.id);
			console.log('User ' + user.username + ' have join Room:' + game.id);
			io.sockets.to('Room:' + game.id).emit('joinedRoom', gameInProgress[game.id]);
		});

		socket.on('sendSet', function (data) {
			console.log('Send Set on Room:' + data.id);
			gameInProgress[data.id].set = data.set;
			socket.broadcast.to('Room:' + data.id).emit('sendedSet', data.set);
		});

		socket.on('sendResult', function (data) {
			console.log('Send Result on Room:' + data.id);
			gameInProgress[data.id].set.result.opposant = data.result;
			socket.broadcast.to('Room:' + data.id).emit('sendedResult', data.result);
		});

		socket.on('disconnect', function() {
			if (typeof gameInProgress[me.currentGame] === "undefined" || typeof gameInProgress[me.currentGame].users === "undefined" || gameInProgress[me.currentGame].length <= 1) {
				lastGameIDCreated = null;
			} else {
				delete gameInProgress[me.currentGame];
				socket.broadcast.to('Room:' + me.currentGame).emit('disconnected', null);
				lastGameIDCreated = null;
			}
		});

		socket.on('endGame', function (id) {
			delete gameInProgress[id];
			socket.broadcast.to('Room:' + id).emit('endedGame', null);
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
		gameInProgress[lastGameIDCreated].users.push(user);
		var game = gameInProgress[lastGameIDCreated];
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
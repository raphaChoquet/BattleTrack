var server = require('./server/server.js');
var sockets = require('./server/sockets.js').sockets;

server.start(sockets);

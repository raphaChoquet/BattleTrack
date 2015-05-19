var express = require('express')
var serveStatic = require('serve-static')

var app = express()

app.use(serveStatic(__dirname + '/ShowPlaylist/www/'));

app.listen(8080)
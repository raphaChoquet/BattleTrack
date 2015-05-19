var http = require('http');
var url  = require('url');
var fs   = require('fs');

function start(sockets) {
	var port = 8080;
	var server = http.createServer(function (req, res) {
	    // On lit notre fichier tchat.html
	    var filePath = '';
	    var urlRequest = url.parse(req.url).pathname;      
    	var tmp  = urlRequest.lastIndexOf('.');
    	var extension  = urlRequest.substring((tmp + 1));

    	filePath = urlRequest.replace('/', '');

    	if (filePath === '') {
    		filePath = 'index.html';
    	} 

	    fs.readFile('./htdocs/' + filePath, function(error, content) {
	    	if (error) {
		        res.writeHeader(500, {"Content-Type": "text/html"});  
		        res.end();    
		    } else {
		    	var contentType = '';
		    	switch(extension) {
		    		case 'html':
		    			contentType = 'text/html';
		    			break;
		    		case 'htm':
		    			contentType = 'text/html';
		    			break;
		    		case 'css':
		    			contentType = 'text/css';
		    			break;
		    		case 'js':
		    			contentType = 'text/javascript';
		    			break;
		    		case 'png':
		    			contentType = 'image/png';
		    			break;
		    		case 'jpg':
		    			contentType = 'image/jpg';
		    			break;
		    		case 'jpeg':
		    			contentType = 'image/jpeg';
		    			break;
		    		default :
 						contentType = 'text/html';
		    			break;
		    	}
		    	res.writeHeader(200, {"Content-Type": contentType});  
		    	res.end(content);
		    }
		})
	}).listen(port);
	
	sockets(server);
	console.log('Server starting on port : ' + port);
}


exports.start = start;
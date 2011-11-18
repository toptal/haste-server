var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');


// TODO logging
// TODO preparse static instead of using exists

//////////////

var StaticHandler = function(path) {
  this.path = path;
  this.defaultPath = '/index.html';
};

StaticHandler.contentTypeFor = function(ext) {
  if (ext == '.js') return 'text/javascript';
  else if (ext == '.css') return 'text/css';
  else if (ext == '.html') return 'text/html';
  else if (ext == '.ico') return 'image/ico';
  else console.log(ext);
};

StaticHandler.prototype.handle = function(request, response) {
  var inc = url.parse(request.url, false);
  var filePath = this.path + (inc.pathname == '/' ? this.defaultPath : inc.pathname);
  path.exists(filePath, function(exists) {
    if (exists) {
      fs.readFile(filePath, function(error, content) {
        if (error) {
          // TODO make nice
          console.log(error);
          response.writeHead(500);
          response.end();
        }
        else {
          response.writeHead(200, { 'content-type': StaticHandler.contentTypeFor(path.extname(filePath)) });
          response.end(content, 'utf-8');
        }
      });    
    }
    else {
      // TODO make nice
      response.writeHead(404);
      response.end();
    }
  }); 
};

///////////

var documents = {};

var DocumentHandler = function() {

};

DocumentHandler.prototype.handle = function(request, response) {
  if (request.method == 'GET') {
   
  }
  else if (request.method == 'POST') {
    var key = '123';
    request.on('data', function(data) {
      if (!documents[key]) {
        documents[key] = '';
      } 
      documents[key] += data.toString();
    });
    request.on('end', function(end) {
      response.end(JSON.stringify({ uuid: key }));
    });
  }
};

///////////

http.createServer(function(request, response) {

  var incoming = url.parse(request.url, false);

  var handler = null;
  if (incoming.pathname.indexOf('/documents') === 0) {
    handler = new DocumentHandler();
  }
  else {
    handler = new StaticHandler('./static');
  }

  handler.handle(request, response);

}).listen(7777);

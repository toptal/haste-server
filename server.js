var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var winston = require('winston');


/////////////
// Configure loggin
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: true, level: 'verbose' });

// TODO preparse static instead of using exists
// TODO split into files
// TODO only parse url once for static files

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
  else {
    winston.error('unable to determine content type for static asset with extension: ' + ext);
    return 'text/plain';
  }
};

StaticHandler.prototype.handle = function(request, response) {
  var inc = url.parse(request.url, false);
  var filePath = this.path + (inc.pathname == '/' ? this.defaultPath : inc.pathname);
  path.exists(filePath, function(exists) {
    if (exists) {
      fs.readFile(filePath, function(error, content) {
        if (error) {
          winston.error('unable to read file', { path: filePath, error: error.message });
          response.writeHead(500, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ message: 'IO: Unable to read file' }));
        }
        else {
          response.writeHead(200, { 'content-type': StaticHandler.contentTypeFor(path.extname(filePath)) });
          response.end(content, 'utf-8');
        }
      });    
    }
    else {
      winston.warn('file not found', { path: filePath });
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'file not found' }));
    }
  }); 
};

///////////

var documents = {};

var DocumentHandler = function() {

};

DocumentHandler.prototype.handleGet = function(key, response) {
  if (documents[key]) {
    winston.verbose('retrieved document', { key: key });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ data: documents[key] }));
  }
  else {
    winston.warn('document not found', { key: key });
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'document not found' }));
  }
};

DocumentHandler.prototype.handlePost = function(request, response) {
  var key = '123';
  request.on('data', function(data) {
    if (!documents[key]) {
      documents[key] = '';
    } 
    documents[key] += data.toString();
  });
  request.on('end', function(end) {
    winston.verbose('added document', { key: key });
    response.end(JSON.stringify({ uuid: key }));
  });
  request.on('error', function(error) {
    // TODO handle error
    // TODO rename key to uuid everywhere behind the scenes
    // TODO finish all TODOs
  });
};

///////////

http.createServer(function(request, response) {

  var incoming = url.parse(request.url, false);
  var handler = null;
  var match;

  // Looking to add a new doc
  if (incoming.pathname.match(/^\/documents$/) && request.method == 'POST') {
    handler = new DocumentHandler();
    handler.handlePost(request, response);
  }

  // Looking up a doc
  else if ((match = incoming.pathname.match(/^\/documents\/([A-Za-z0-9]+)$/)) && request.method == 'GET') {
    handler = new DocumentHandler();
    handler.handleGet(match[1], response);
  }

  // Otherwise, look for static file
  else {
    handler = new StaticHandler('./static');
    handler.handle(request, response);
  }

}).listen(7777);

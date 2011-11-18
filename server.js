var http = require('http');
var url = require('url');
var fs = require('fs');

var winston = require('winston');

var StaticHandler = require('./lib/static_handler');
var DocumentHandler = require('./lib/document_handler');

// Load the configuration and set some defaults
var config = JSON.parse(fs.readFileSync('config.js', 'utf8'));
config.port = config.port || 7777;
config.host = config.host || 'localhost';

// Configure logging - TODO make configurable
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: true, level: 'verbose' });

// TODO preparse static instead of using exists
// TODO implement command line

// Set the server up
http.createServer(function(request, response) {

  var incoming = url.parse(request.url, false);
  var handler = null;

  // Looking to add a new doc
  if (incoming.pathname.match(/^\/documents$/) && request.method == 'POST') {
    handler = new DocumentHandler({ keyLength: config.keyLength });
    return handler.handlePost(request, response);
  }

  // Looking up a doc
  var match = incoming.pathname.match(/^\/documents\/([A-Za-z0-9]+)$/);
  if (request.method == 'GET' && match) {
    handler = new DocumentHandler();
    return handler.handleGet(match[1], response);
  }

  // Otherwise, look for static file
  handler = new StaticHandler('./static');
  handler.handle(incoming.pathname, response);

}).listen(config.port, config.host);

console.info('listening on ' + config.host + ':' + config.port);

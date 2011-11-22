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

// Set up the logger
if (config.logging) {
  try {
    winston.remove(winston.transports.Console);
  } catch(er) { }
  var detail, type;
  for (var i = 0; i < config.logging.length; i++) {
    detail = config.logging[i];
    type = detail.type;
    delete detail.type;
    winston.add(winston.transports[type], detail);
  }
}

// build the store from the config on-demand - so that we don't load it
// for statics
if (!config.storage) {
  config.storage = { type: 'file' };
}
if (!config.storage.type) {
  config.storage.type = 'file';
}
var Store = require('./lib/' + config.storage.type + '_document_store');
var preferredStore = new Store(config.storage);

// Send the static documents into the preferred store, skipping expirations
for (var name in config.documents) {
  var path = config.documents[name];
  fs.readFile(path, 'utf8', function(err, data) {
    if (data && !err) {
      preferredStore.set(name, data, function(cb) {
        winston.info('loaded static document', { name: name, path: path });
      }, true);
    }
    else {
      winston.warn('failed to load static document', { name: name, path: path });
    }
  });
}

// Configure a static handler for the static files
var staticHandler = new StaticHandler('./static', !!config.cacheStaticAssets);

// Configure the document handler
var documentHandler = new DocumentHandler({
  store: preferredStore,
  maxLength: config.maxLength,
  keyLength: config.keyLength
});

// Set the server up and listen forever
http.createServer(function(request, response) {
  var incoming = url.parse(request.url, false);
  var handler = null;
  // Looking to add a new doc
  if (incoming.pathname.match(/^\/documents$/) && request.method == 'POST') {
    return documentHandler.handlePost(request, response);
  }
  // Looking up a doc
  var match = incoming.pathname.match(/^\/documents\/([A-Za-z0-9]+)$/);
  if (request.method == 'GET' && match) {
    return documentHandler.handleGet(match[1], response);
  }
  // Otherwise, look for static file
  staticHandler.handle(incoming.pathname, response);
}).listen(config.port, config.host);

winston.info('listening on ' + config.host + ':' + config.port);

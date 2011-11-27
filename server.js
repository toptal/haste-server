var http = require('http');
var url = require('url');
var fs = require('fs');

var winston = require('winston');
var connect = require('connect');

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

// Configure the document handler
var documentHandler = new DocumentHandler({
  store: preferredStore,
  maxLength: config.maxLength,
  keyLength: config.keyLength
});

// Set the server up with a static cache
connect.createServer(
  // First look for api calls
  connect.router(function(app) {
    // add documents 
    app.post('/documents', function(request, response, next) {
      return documentHandler.handlePost(request, response);
    });
    // get documents
    app.get('/documents/:id', function(request, response, next) {
      return documentHandler.handleGet(request.params.id, response);
    });
  }),
  // Otherwise, static
  connect.staticCache(),
  connect.static(__dirname + '/static', { maxAge: config.staticMaxAge }),
  // Then we can loop back - and everything else should be a token,
  // so route it back to /index.html
  connect.router(function(app) {
    app.get('/:id', function(request, response, next) {
      request.url = request.originalUrl = '/index.html';
      next();
    });
  }),
  connect.static(__dirname + '/static', { maxAge: config.staticMaxAge })
).listen(config.port, config.host);

winston.info('listening on ' + config.host + ':' + config.port);

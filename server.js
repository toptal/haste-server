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
var Store = require('./lib/document_stores/' + config.storage.type);
var preferredStore = new Store(config.storage);

// Compress the static javascript assets
if (config.recompressStaticAssets) {
  var jsp = require("uglify-js").parser;
  var pro = require("uglify-js").uglify;
  var list = fs.readdirSync('./static');
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var orig_code, ast;
    if ((item.indexOf('.js') === item.length - 3) &&
        (item.indexOf('.min.js') === -1)) {
      dest = item.substring(0, item.length - 3) + '.min' +
        item.substring(item.length - 3);
      orig_code = fs.readFileSync('./static/' + item, 'utf8');
      ast = jsp.parse(orig_code);
      ast = pro.ast_mangle(ast);
      ast = pro.ast_squeeze(ast);
      fs.writeFileSync('./static/' + dest, pro.gen_code(ast), 'utf8');
      winston.info('compressed ' + item + ' into ' + dest);
    }
  }
}

// Send the static documents into the preferred store, skipping expirations
var path, data;
for (var name in config.documents) {
  path = config.documents[name];
  data = fs.readFileSync(path, 'utf8');
  winston.info('loading static document', { name: name, path: path });
  if (data) {
    preferredStore.set(name, data, function(cb) {
      winston.debug('loaded static document', { success: cb });
    }, true);
  }
  else {
    winston.warn('failed to load static document', { name: name, path: path });
  }
}

// Pick up a key generator
var pwOptions = config.keyGenerator || {};
pwOptions.type = pwOptions.type || 'random';
var gen = require('./lib/key_generators/' + pwOptions.type);
var keyGenerator = new gen(pwOptions);

// Configure the document handler
var documentHandler = new DocumentHandler({
  store: preferredStore,
  maxLength: config.maxLength,
  keyLength: config.keyLength,
  keyGenerator: keyGenerator
});

// Set the server up with a static cache
connect.createServer(
  // First look for api calls
  connect.router(function(app) {
    // get raw documents - support getting with extension
    app.get('/raw/:id', function(request, response, next) {
      var skipExpire = !!config.documents[request.params.id];
      var key = request.params.id.split('.')[0];
      return documentHandler.handleRawGet(key, response, skipExpire);
    });
    // add documents
    app.post('/documents', function(request, response, next) {
      return documentHandler.handlePost(request, response);
    });
    // get documents
    app.get('/documents/:id', function(request, response, next) {
      var skipExpire = !!config.documents[request.params.id];
      return documentHandler.handleGet(
        request.params.id,
        response,
        skipExpire
      );
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

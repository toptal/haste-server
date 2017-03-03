var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');

var winston = require('winston');
var connect = require('connect');
var route = require('connect-route');
var connect_st = require('st');
var connect_rate_limit = require('connect-ratelimit');

var DocumentHandler = require('./lib/document_handler');

// Load the HTTP configuration and set some defaults
var config = JSON.parse(fs.readFileSync('./config.js', 'utf8'));
config.http = process.env.HTTP || config.http || false;
config.http_port = process.env.HTTPS_PORT || config.http_port || 80;
config.http_host = process.env.HTTPS_HOST || config.http_host || 'localhost';

// Load the HTTPS configuration and set some defaults
config.https = process.env.HTTPS || config.https || false;
config.https_port = process.env.HTTPS_PORT || config.https_port || 443;
config.https_host = process.env.HTTPS_HOST || config.https_host || 'localhost';
config.https_key = process.env.HTTPS_KEY || config.https_key || '';
config.https_cert = process.env.HTTPS_CERT || config.https_cert || '';

var https_options = {};
if (config.https) {
  https_options = {
    key: fs.readFileSync(config.https_key),
    cert: fs.readFileSync(config.https_cert)
  };
}

// Verify a service was enabled
if (!config.http && !config.https){
  winston.error('Neither HTTP nor HTTPS enabled. Quitting.');
  process.exit(1)
}

// If both HTTP and HTTPS are enabled, verify different ports were used
if (config.http && config.https){
  if (config.http_port === config.https_port){
    winston.error('HTTP port must not be the same as HTTPS port. Quitting.');
    process.exit(1)
  }
}

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

var Store, preferredStore;

if (process.env.REDISTOGO_URL && config.storage.type === 'redis') {
  var redisClient = require('redis-url').connect(process.env.REDISTOGO_URL);
  Store = require('./lib/document_stores/redis');
  preferredStore = new Store(config.storage, redisClient);
}
else {
  Store = require('./lib/document_stores/' + config.storage.type);
  preferredStore = new Store(config.storage);
}

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

var app = express();

// Rate limit all requests
if (config.rateLimits) {
  config.rateLimits.end = true;
  app.use(connect_rate_limit(config.rateLimits));
}

// first look at API calls
app.use(route(function(router) {
  // get raw documents - support getting with extension
  router.get('/raw/:id', function(request, response, next) {
    var key = request.params.id.split('.')[0];
    var skipExpire = !!config.documents[key];
    return documentHandler.handleRawGet(key, response, skipExpire);
  });
  // add documents
  router.post('/documents', function(request, response, next) {
    return documentHandler.handlePost(request, response);
  });
  // get documents
  router.get('/documents/:id', function(request, response, next) {
    var key = request.params.id.split('.')[0];
    var skipExpire = !!config.documents[key];
    return documentHandler.handleGet(key, response, skipExpire);
  });
}));

// Otherwise, try to match static files
app.use(connect_st({
  path: __dirname + '/static',
  content: { maxAge: config.staticMaxAge },
  passthrough: true,
  index: false
}));

// Then we can loop back - and everything else should be a token,
// so route it back to /
app.use(route(function(router) {
  router.get('/:id', function(request, response, next) {
    request.sturl = '/';
    next();
  });
}));

// And match index
app.use(connect_st({
  path: __dirname + '/static',
  content: { maxAge: config.staticMaxAge },
  index: 'index.html'
}));


if (config.http) {
  http.createServer(app).listen(config.http_port, config.http_host);
  winston.info('listening on http:\/\/' + config.http_host + ':' + config.http_port);
}

if (config.https) {
  https.createServer(https_options, app).listen(config.https_port, config.https_host);
  winston.info('listening on https:\/\/' + config.https_host + ':' + config.https_port);
}



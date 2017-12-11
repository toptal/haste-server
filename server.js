var http = require('http');
var fs = require('fs');

var uglify = require('uglify-js');
var winston = require('winston');
var connect = require('connect');
var route = require('connect-route');
var connect_st = require('st');
var connect_rate_limit = require('connect-ratelimit');

var DocumentHandler = require('./lib/document_handler');

// Load the configuration and set some defaults
var config = JSON.parse(fs.readFileSync('./config.js', 'utf8'));
config.port = process.env.PORT || config.port || 7777;
config.host = process.env.HOST || config.host || 'localhost';

// Set up the logger
if (config.logging) {
  try {
    winston.remove(winston.transports.Console);
  } catch(e) {
    /* was not present */
  }

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
  var list = fs.readdirSync('./static');
  for (var j = 0; j < list.length; j++) {
    var item = list[j];
    if ((item.indexOf('.js') === item.length - 3) && (item.indexOf('.min.js') === -1)) {
      var dest = item.substring(0, item.length - 3) + '.min' + item.substring(item.length - 3);
      var orig_code = fs.readFileSync('./static/' + item, 'utf8');

      fs.writeFileSync('./static/' + dest, uglify.minify(orig_code).code, 'utf8');
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

var app = connect();

// Rate limit all requests
if (config.rateLimits) {
  config.rateLimits.end = true;
  app.use(connect_rate_limit(config.rateLimits));
}

// first look at API calls
app.use(route(function(router) {
  // get raw documents - support getting with extension
  router.get('/raw/:id', function(request, response) {
    var key = request.params.id.split('.')[0];
    var skipExpire = !!config.documents[key];
    return documentHandler.handleRawGet(key, response, skipExpire);
  });
  // add documents
  router.post('/documents', function(request, response) {
    return documentHandler.handlePost(request, response);
  });
  // get documents
  router.get('/documents/:id', function(request, response) {
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

http.createServer(app).listen(config.port, config.host);

winston.info('listening on ' + config.host + ':' + config.port);

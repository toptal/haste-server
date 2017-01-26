var http = require('http');
var url = require('url');
var fs = require('fs');

var winston = require('winston');
var connect = require('connect');
var route = require('connect-route');
var connect_st = require('st');
var connect_rate_limit = require('connect-ratelimit');
var passport = require('passport');
var redirect = require('connect-redirection');
var query = require('connect-query');


require('dotenv').config();
var DocumentHandler = require('./lib/document_handler');

// Load the configuration and set some defaults
var config = JSON.parse(fs.readFileSync('./config.js', 'utf8'));
config.port = process.env.PORT || config.port || 7777;
config.host = process.env.HOST || config.host || 'localhost';
config.origin = 'http://' + config.host + ":" +  config.port + "/";

// Set up the loggergg
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

var app = connect();
app.use(redirect());
app.use(query());
// Rate limit all requests
if (config.rateLimits) {
  config.rateLimits.end = true;
  app.use(connect_rate_limit(config.rateLimits));
}

var GoogleStrategy = require('passport-google-oauth20').Strategy;

// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  config.origin  + 'auth/google/callback'
  },
  function(accessToken, refreshToken, profile, cb) {
    winston.info('hi logged in')
    winston.info(profile);
    return cb(null, profile);
  }
));

// first look at API calls
app.use(passport.initialize());
app.use(passport.session());

app.use(route(function(router) {
  // get raw documents - support getting with extension
  router.get('/', require('connect-ensure-login').ensureLoggedIn());
  router.get('/login', passport.authenticate('google', { scope: ['profile'] }));

  router.get( '/auth/google/callback',
      passport.authenticate( 'google', { scope: ['profile'],
          successRedirect: '/loggedin',
          failureRedirect: '/auth/failure'
  }));
  router.get('/raw/:id', function(request, response, next) {
    var skipExpire = !!config.documents[request.params.id];
    var key = request.params.id.split('.')[0];
    return documentHandler.handleRawGet(key, response, skipExpire);
  });
  // add documents
  router.post('/documents', function(request, response, next) {
    return documentHandler.handlePost(request, response);
  });
  // get documents
  router.get('/documents/:id', function(request, response, next) {
    var skipExpire = !!config.documents[request.params.id];
    return documentHandler.handleGet(
      request.params.id,
      response,
      skipExpire
    );
  });
}));

//app.use(require('connect-ensure-login').ensureLoggedIn());
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

var http = require('http');
var fs = require('fs');

var winston = require('winston');
var passport = require('passport');
var express = require('express')
var session = require('express-session')
var jwt = require('jsonwebtoken')

require('dotenv').config();
var DocumentHandler = require('./lib/document_handler');

// Load the configuration and set some defaults
var config = JSON.parse(fs.readFileSync('./config.js', 'utf8'));
config.port = process.env.PORT || config.port || 7777;
config.host = process.env.HOST || config.host || 'localhost';
config.secret = process.env.SECRET || '43rndsafdsakf;djsafkdsarf';
config.scheme = process.env.SCHEME || config.scheme || 'https'
config.origin = config.scheme + '://' + config.host + ":" +  config.port + "/";
config.restrict_domain = process.env.RESTRICT_DOMAIN

// Set up the loggergg
if (config.logging) {
  try {
    winston.remove(winston.transports.Console);
  } catch(err) {
    console.log(err)
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
  var jsp = require("uglify-js").parser;
  var pro = require("uglify-js").uglify;
  var list = fs.readdirSync('./static');
  var dest;
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

var GoogleStrategy = require('passport-google-oauth20').Strategy;

var OAUTH_SCOPE = ['profile', 'email', 'openid']

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  config.origin  + 'auth/google/callback',
  },
  //function(accessToken, refreshToken, profile, cb) {
  function( accessToken, refreshToken, params, profile, cb){
    if (! params.id_token ){
      winston.error("no id_token in response")
      return
    }
    var jwtObject = jwt.decode(params.id_token)
    if(! (jwtObject && jwtObject.hd && matchDomain(jwtObject.hd)) ){
      // domain doesn't validate
      winston.info("domain does not validate")
      return cb('Your domain is not permitted')
    }
    return cb(null, profile);
  }
));

app.use(session({ secret: config.secret, name: 'tt' , resave:true, saveUnitialized: true}));
// first look at API calls
app.use(passport.initialize());
app.use(passport.session());
var router = app;

// get raw documents - support getting with extension
router.get('/', ensureAuthenticatedWeb);
router.get('/login', passport.authenticate('google', { scope: OAUTH_SCOPE }));

router.get( '/auth/google/callback', function(req,res,next){
    var successRedirectURL = '/'
    if(req.query.state){
      successRedirectURL = req.query.state
    }
    passport.authenticate( 'google', { scope: OAUTH_SCOPE,
        successRedirect: successRedirectURL,
        failureRedirect: '/auth/failure' } )(req,res,next);
})

router.get('/raw/:id', ensureAuthenticatedWeb, function(request, response, next) {
  var skipExpire = !!config.documents[request.params.id];
  var key = request.params.id.split('.')[0];
  return documentHandler.handleRawGet(key, response, skipExpire);
});
// add documents
router.post('/documents', ensureAuthenticatedAPI, function(request, response, next) {
  return documentHandler.handlePost(request, response);
});

router.get('/documents/:id', ensureAuthenticatedAPI, function(request, response, next) {
  var skipExpire = !!config.documents[request.params.id];
  return documentHandler.handleGet(
    request.params.id,
    response,
    skipExpire
  );
});
router.get('/users/me', ensureAuthenticatedAPI, function(req, res, next) {
  return res.json(req.user);
});

function matchDomain(domain){
  var pattern = new RegExp(config.restrict_domain)
  return pattern.test(domain)
}
function ensureAuthenticatedWeb(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // set state = req.path to support redirect after login
  passport.authenticate(
    'google', { scope: OAUTH_SCOPE, state : req.path }
  )(req,res,next)
}

function ensureAuthenticatedAPI(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
}

app.use(  express.static(__dirname + '/static' ) )
// a request for a record returns the index
app.get('/:id', ensureAuthenticatedWeb, function(request, response) {
  response.sendFile(__dirname + '/static/index.html')
});

http.createServer(app).listen(config.port, '0.0.0.0');
winston.info('listening on ' + config.host + ':' + config.port);

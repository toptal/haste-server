var memcached = require('memcache');
var winston = require('winston');

// Create a new store with options
var MemcachedDocumentStore = function(options) {
  this.expire = options.expire;
  if (!MemcachedDocumentStore.client) {
    MemcachedDocumentStore.connect(options);
  }
};

// Create a connection
MemcachedDocumentStore.connect = function(options) {
  var host = options.host || '127.0.0.1';
  var port = options.port || 11211;
  this.client = new memcached.Client(port, host);
  this.client.connect();
  this.client.on('connect', function() {
    winston.info('connected to memcached on ' + host + ':' + port);
  });
  this.client.on('error', function(e) {
    winston.info('error connecting to memcached', { error: e });
  });
};

// Save file in a key
MemcachedDocumentStore.prototype.set =
function(key, data, callback, skipExpire) {
  MemcachedDocumentStore.client.set(key, data, function(err) {
    err ? callback(false) : callback(true);
  }, skipExpire ? 0 : this.expire);
};

// Get a file from a key
MemcachedDocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;
  MemcachedDocumentStore.client.get(key, function(err, reply) {
    callback(err ? false : reply);
    if (_this.expire && !skipExpire) {
      winston.warn('store does not currently push forward expirations on GET');
    }
  });
};

module.exports = MemcachedDocumentStore;

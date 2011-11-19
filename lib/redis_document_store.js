var redis = require('redis');
var winston = require('winston');
var hashlib = require('hashlib');

// TODO move to a different method (conn)
var RedisDocumentStore = function(options) {
  if (!RedisDocumentStore.client) {
    var host = options.host || '127.0.0.1';
    var port = options.port || 6379;
    var index = options.db || 0;
    RedisDocumentStore.client = redis.createClient(port, host);
    RedisDocumentStore.client.select(index, function(err, reply) {
      if (err) {
        winston.error('error connecting to redis index ' + index, { error: error.message });
        process.exit(1);
      }
      else {
        winston.info('connected to redis on ' + host + ':' + port + '/' + index);
      }
    });
  }
};

// Save file in a key
RedisDocumentStore.prototype.set = function(key, data, callback) {
  RedisDocumentStore.client.set(key, data, function(err, reply) {
    callback(!err);
  });
};

// Get a file from a key
RedisDocumentStore.prototype.get = function(key, callback) {
  RedisDocumentStore.client.get(key, function(err, reply) {
    callback(err ? false : reply);
  }); 
};

module.exports = RedisDocumentStore;

var redis = require('redis');
var winston = require('winston');

// For storing in redis
// options[type] = redis
// options[host] - The host to connect to (default localhost)
// options[port] - The port to connect to (default 5379)
// options[db] - The db to use (default 0)
// options[expire] - The time to live for each key set (default never)

var RedisDocumentStore = function(options, client) {
  this.expire = options.expire;
  if (client) {
    winston.info('using predefined redis client');
    RedisDocumentStore.client = client;
  } else if (!RedisDocumentStore.client) {
    winston.info('configuring redis');
    RedisDocumentStore.connect(options);
  }
};

// Create a connection according to config
RedisDocumentStore.connect = function(options) {
  var host = options.host || '127.0.0.1';
  var port = options.port || 6379;
  var index = options.db || 0;
  RedisDocumentStore.client = redis.createClient(port, host);
  // authenticate if password is provided
  if (options.password) {
    RedisDocumentStore.client.auth(options.password);
  }
  RedisDocumentStore.client.select(index, function(err, reply) {
    if (err) {
      winston.error(
        'error connecting to redis index ' + index,
        { error: err }
      );
      process.exit(1);
    }
    else {
      winston.info('connected to redis on ' + host + ':' + port + '/' + index);
    }
  });
};

// Generate secret (10 chars)
RedisDocumentStore.secret = function() {
    return Math.random().toString(24).slice(-10);
};

// Save file in a key
RedisDocumentStore.prototype.set = function(key, data, callback, skipExpire) {
  var _this = this;
  RedisDocumentStore.client.set(key, data, function(err, reply) {
    if (err) {
      callback(false);
    }
    else {
      if (!skipExpire) {
        _this.setExpiration(key);
      }
      var sc = RedisDocumentStore.secret();
      RedisDocumentStore.client.set(key + '-' + sc, "", function(err, reply) {
        if (err) return callback(false);
        callback(true, sc);
      });
    }
  });
};

// Expire a key in expire time if set
RedisDocumentStore.prototype.setExpiration = function(key) {
  if (this.expire) {
    RedisDocumentStore.client.expire(key, this.expire, function(err, reply) {
      if (err) {
        winston.error('failed to set expiry on key: ' + key);
      }
    });
  }
};

// Get a file from a key
RedisDocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;
  RedisDocumentStore.client.get(key, function(err, reply) {
    if (!err && !skipExpire) {
      _this.setExpiration(key);
    }
    callback(err ? false : reply);
  });
};

RedisDocumentStore.prototype.remove = function(key, secret, callback) {
  RedisDocumentStore.client.get(key + "-" + secret, function(err, reply) {
    if (!err) {
      RedisDocumentStore.client.del(key, function(err, reply) {
        if (err) return callback(false);
        RedisDocumentStore.client.del(key + "-" + secret, function(err, reply) {
          if (err) return callback(false);
          callback(reply);
        });
      });
    }
    else {
      callback(false);
    }
  });
};

module.exports = RedisDocumentStore;

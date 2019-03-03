var redis = require('redis');
var winston = require('winston');

// For storing in Pivotal Cloud Foundry p-redis
// options[type] = p-redis
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

// Create a connection according to VCAP_SERVICES
RedisDocumentStore.connect = function() {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  var p_redis = vcapServices['p-redis'][0];
  var index = 0;
  RedisDocumentStore.client = redis.createClient(p_redis.credentials.port, p_redis.credentials.host);
  RedisDocumentStore.client.auth(p_redis.credentials.password);

  RedisDocumentStore.client.on('error', function(err) {
    winston.error('redis disconnected', err);
  });

  RedisDocumentStore.client.select(index, function(err) {
    if (err) {
      winston.error(
        'error connecting to redis index ' + index,
        { error: err }
      );
      process.exit(1);
    }
    else {
      winston.info('connected to redis on ' + p_redis.credentials.host + ':' + p_redis.credentials.port + '/' + index);
    }
  });
};

// Save file in a key
RedisDocumentStore.prototype.set = function(key, data, callback, skipExpire) {
  var _this = this;
  RedisDocumentStore.client.set(key, data, function(err) {
    if (err) {
      callback(false);
    }
    else {
      if (!skipExpire) {
        _this.setExpiration(key);
      }
      callback(true);
    }
  });
};

// Expire a key in expire time if set
RedisDocumentStore.prototype.setExpiration = function(key) {
  if (this.expire) {
    RedisDocumentStore.client.expire(key, this.expire, function(err) {
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

module.exports = RedisDocumentStore;

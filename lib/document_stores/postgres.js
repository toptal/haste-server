/*global require,module,process*/

var postgres = require('pg');
var winston = require('winston');

// create table entries (id serial primary key, key varchar(255) not null, value text not null, expiration int, unique(key));

// A postgres document store
var PostgresDocumentStore = function (options) {
  this.expireJS = options.expire;
  this.connectionUrl = process.env.DATABASE_URL || options.connectionUrl;
  this.secret = () => Math.random().toString(24).slice(-10);
};

PostgresDocumentStore.prototype = {

  // Set a given key
  set: function (key, data, callback, skipExpire) {
    var now = Math.floor(new Date().getTime() / 1000);
    var that = this;
    this.safeConnect(function (err, client, done) {
      if (err) { return callback(false); }
      var sc = that.secret();
      client.query('INSERT INTO entries (key, value, expiration, secret) VALUES ($1, $2, $3, $4)', [
        key,
        data,
        that.expireJS && !skipExpire ? that.expireJS + now : null,
        sc
      ], function (err, result) {
        if (err) {
          winston.error('error persisting value to postgres', { error: err });
          return callback(false);
        }
        callback(true, sc);
        done();
      });
    });
  },

  // Get a given key's data
  get: function (key, callback, skipExpire) {
    var now = Math.floor(new Date().getTime() / 1000);
    var that = this;
    this.safeConnect(function (err, client, done) {
      if (err) { return callback(false); }
      client.query('SELECT id,value,expiration from entries where KEY = $1 and (expiration IS NULL or expiration > $2)', [key, now], function (err, result) {
        if (err) {
          winston.error('error retrieving value from postgres', { error: err });
          return callback(false);
        }
        callback(result.rows.length ? result.rows[0].value : false);
        if (result.rows.length && that.expireJS && !skipExpire) {
          client.query('UPDATE entries SET expiration = $1 WHERE ID = $2', [
            that.expireJS + now,
            result.rows[0].id
          ], function (err, result) {
            if (!err) {
              done();
            }
          });
        } else {
          done();
        }
      });
    });
  },
  
  remove: function (key, secret, callback) {
    var now = Math.floor(new Date().getTime() / 1000);
    this.safeConnect(function (err, client, done) {
      if (err) { return callback(false); }
      client.query('SELECT id,value,expiration,secret from entries where KEY = $1 and (expiration IS NULL or expiration > $2)', [key, now], function (err, result) {
        if (err) {
          winston.error('error retrieving value from postgres', { error: err });
          return callback(false);
        }
        if (result.rows[0].secret == secret) {
          client.query("DELETE FROM entries where KEY = $1", [key], function (err, result) {
            if (err) {
              winston.error('error removing an item from postgres', { error: err });
              return callback(false);
            }
            else {
              callback(true);
              done();
            }
          });
        }
        done();
      });
    });
  },

  // A connection wrapper
  safeConnect: function (callback) {
    postgres.connect(this.connectionUrl, function (err, client, done) {
      if (err) {
        winston.error('error connecting to postgres', { error: err });
        callback(err);
      } else {
        callback(undefined, client, done);
      }
    });
  }

};

module.exports = PostgresDocumentStore;

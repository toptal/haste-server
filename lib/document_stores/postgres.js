/*global require,module,process*/

var postgres = require('pg');
var winston = require('winston');

(function () {

  'use strict';

  // A postgres document store
  var PostgresDocumentStore = function (options) {
    this.expireJS = options.expire * 1000;
    this.connectionString = process.env.DATABASE_URL;
  };

  PostgresDocumentStore.prototype = {

    // Set a given key
    set: function (key, data, callback, skipExpire) {
      var now = new Date().getTime() / 1000;
      var that = this;
      this.safeConnect(function (err, client, done) {
        if (err) { return callback(false); }
        client.query('INSERT INTO entries (key, value, expiration) VALUES ($1, $2, $3)', [
          key,
          data,
          that.expireJS && !skipExpire ? now + that.expireJS : null
        ], function (err, result) {
          if (err) {
            winston.error('error persisting value to postgres', { error: err });
            return callback(false);
          }
          callback(true);
          done();
        });
      });
    },

    // Get a given key's data
    get: function (key, callback, skipExpire) {
      var now = new Date().getTime() / 1000;
      var that = this;
      this.safeConnect(function (err, client, done) {
        if (err) { return callback(false); }
        client.query('SELECT value from entries where KEY = $1 AND (expiration IS NULL or expiration < $2)', [
          key,
          that.expireJS ? now - that.expireJS : 0
        ], function (err, result) {
          if (err) {
            winston.error('error retrieving value from postgres', { error: err });
            return callback(false);
          }
          callback(result.rows.length ? result.rows[0].value : false);
        });
      });
    },

    // A connection wrapper
    safeConnect: function (callback) {
      postgres.connect(this.connectionString, function (err, client, done) {
        if (err) {
          winston.error('error connecting to postgres', { error: err });
          callback(err);
        } else {
          callback(undefined, client, done);
        }
      });
    }

  };

  module.export = PostgresDocumentStore;

}());

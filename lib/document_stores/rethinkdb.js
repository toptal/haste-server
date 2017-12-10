var crypto = require('crypto');
var rethink = require('rethinkdbdash');

var RethinkDBStore = function (options) {
  this._options = options;
  this._options.silent = true;
  this._options.host = options.host || '127.0.0.1';
  this._options.port = options.port || 28015;
  this._options.db = options.db || 'haste';
  this._options.user = options.user || 'admin';
  this._options.password = options.password || '';
  this.client = rethink(this._options);
};

RethinkDBStore.md5 = function (str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
};

RethinkDBStore.prototype.set = function (key, data, callback) {
  try {
    this.client.table('uploads').insert({ id: RethinkDBStore.md5(key), data: data }).run(function (error) {
      if (error) return callback(false);
      callback(true);
    });
  } catch (err) {
    callback(false);
  }
};

RethinkDBStore.prototype.get = function (key, callback) {
  this.client.table('uploads').get(RethinkDBStore.md5(key)).run((error, result) => {
    if (error || !result) return callback(false);
    callback(result.data);
  });
};

module.exports = RethinkDBStore;

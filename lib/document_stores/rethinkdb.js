const crypto = require('crypto');
const rethink = require('rethinkdbdash');

var RethinkDBStore = (options) => {
  this.client = rethink({
    silent: true,
    host: options.host || '127.0.0.1',
    port: options.port || 28015,
    db: options.db || 'haste',
    user: options.user || 'admin',
    password: options.password || ''
  });
};

RethinkDBStore.md5 = (str) => {
  const md5sum = crypto.createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
};

RethinkDBStore.prototype.set = (key, data, callback) => {
  try {
    this.client.table('uploads').insert({ id: RethinkDBStore.md5(key), data: data }).run((error) => {
      if (error) return callback(false);
      callback(true);
    });
  } catch (err) {
    callback(false);
  }
};

RethinkDBStore.prototype.get = (key, callback) => {
  this.client.table('uploads').get(RethinkDBStore.md5(key)).run((error, result) => {
    if (error || !result) return callback(false);
    callback(result.data);
  });
};

module.exports = RethinkDBStore;

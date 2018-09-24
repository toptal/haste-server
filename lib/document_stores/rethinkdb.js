const crypto = require('crypto');
const rethink = require('rethinkdbdash');
const winston = require('winston');

const md5 = (str) => {
  const md5sum = crypto.createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
};

class RethinkDBStore {
  constructor(options) {
    this.client = rethink({
      silent: true,
      host: options.host || '127.0.0.1',
      port: options.port || 28015,
      db: options.db || 'haste',
      user: options.user || 'admin',
      password: options.password || ''
    });
  }

  set(key, data, callback) {
    this.client.table('uploads').insert({ id: md5(key), data: data }).run((error) => {
      if (error) {
        callback(false);
        winston.error('failed to insert to table', error);
        return;
      }
      callback(true);
    });
  }

  get(key, callback) {
    this.client.table('uploads').get(md5(key)).run((error, result) => {
      if (error || !result) {
        callback(false);
        if (error) winston.error('failed to insert to table', error);
        return;
      }
      callback(result.data);
    });
  }
}

module.exports = RethinkDBStore;

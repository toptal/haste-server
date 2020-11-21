var fs = require('fs');
var crypto = require('crypto');

var winston = require('winston');

// For storing in files
// options[type] = file
// options[path] - Where to store

var FileDocumentStore = function(options) {
  this.basePath = options.path || './data';
  this.expire = options.expire;
};

// Generate md5 of a string
FileDocumentStore.md5 = function(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
};

// Save data in a file, key as md5 - since we don't know what we could
// be passed here
FileDocumentStore.prototype.set = function(key, data, callback, skipExpire) {
  try {
    var _this = this;
    fs.mkdir(this.basePath, '700', function() {
      var fn = _this.basePath + '/' + key;
      fs.writeFile(fn, data, 'utf8', function(err) {
        if (err) {
          callback(false);
        }
        else {
          callback(true);
          if (_this.expire && !skipExpire) {
            winston.warn('file store cannot set expirations on keys');
          }
        }
      });
    });
  } catch(err) {
    callback(false);
  }
};

// Get data from a file from key
FileDocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;
  var fn = this.basePath + '/' + key;
  fs.readFile(fn, 'utf8', function(err, data) {
    if (err) {
      callback(false);
    }
    else {
      callback(data);
      if (_this.expire && !skipExpire) {
        winston.warn('file store cannot set expirations on keys');
      }
    }
  });
};

// delete a file from key
FileDocumentStore.prototype.delete = function(key, callback) {
  var _this = this;
  var fn = this.basePath + '/' + key;
  fs.unlink(fn, function(err) {
    if (err) {
      callback(false);
    }
    else {
      callback(true);
    }
  });
};

// list files
FileDocumentStore.prototype.list = function(callback) {
  var _this = this;
  var fn = this.basePath + '/';
  fs.readdir(fn, function(err, listfiles) {
    if (err) {
      callback(false);
    }
    else {
      callback(listfiles);
    }
  });
};

module.exports = FileDocumentStore;

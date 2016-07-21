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

// Generate secret (10 chars)
FileDocumentStore.secret = function() {
  return Math.random().toString(24).slice(-10);
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
      var sc = FileDocumentStore.secret();
      var fn = _this.basePath + '/' + FileDocumentStore.md5(key);
      var sfn = fn + "-" + sc;
      fs.writeFile(fn, data, 'utf8', function(err) {
        if (err) {
          callback(false);
        }
        else {
          fs.writeFile(sfn, "A validation file for " + fn, 'utf8', function (err) {
            if (!err) callback(true, sc);
          });
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

FileDocumentStore.prototype.remove = function(str, key, callback) {
  var file = FileDocumentStore.md5(str);
  var kfn = key;
  fs.exists(this.basePath + "/" + file + "-" + kfn, function(exists) {
    if (exists) {
      try {
        fs.unlink(this.basePath + "/" + file, function() {
          fs.unlink(this.basePath + "/" + file + "-" + kfn, function() {
            callback(true);
          });
        });
      } catch(err) {
        callback(false);
      }
    }
    else {
      callback(false);
    }
  });
};

// Get data from a file from key
FileDocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;
  var fn = this.basePath + '/' + FileDocumentStore.md5(key);
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

module.exports = FileDocumentStore;

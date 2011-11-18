var fs = require('fs');

var winston = require('winston');
var hashlib = require('hashlib');

// For storing in files

var FileDocumentStore = function(options) {
  this.basePath = options.path || './data';
};

// Save data in a file, key as md5 - since we don't know what we could be passed here
FileDocumentStore.prototype.set = function(key, data, callback) {
  try {
    var _this = this;
    fs.mkdir(this.basePath, '700', function() {
      fs.writeFile(_this.basePath + '/' + hashlib.md5(key), data, 'utf8', function(err) {
        if (err) {
          callback(false);
        }
        else {
          callback(true);
        }
      });
    });
  } catch(err) {
    callback(false);
  }
};

// Get data from a file from key
FileDocumentStore.prototype.get = function(key, callback) {
  fs.readFile(this.basePath + '/' + hashlib.md5(key), 'utf8', function(err, data) {
    if (err) {
      callback(false);
    }
    else {
      callback(data);
    }
  });
};

module.exports = FileDocumentStore;

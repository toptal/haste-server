var fs = require('fs');

var winston = require('winston');
var hashlib = require('hashlib');

// For storing in files

var FileDocumentStore = function(options) {
  this.basePath = options.path || './data';
};

// Save data in a file, key as md5 - since we don't know what we could be passed here
FileDocumentStore.prototype.set = function(key, data, callback) {
  var _this = this;
  fs.mkdir(this.basePath, '700', function() {
    fs.writeFile(_this.basePath + '/' + hashlib.md5(key), data, 'utf8', function() {
      callback(true); // TODO handle errors
    });
  });
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

var winston = require('winston');

// For handling serving stored documents

var DocumentHandler = function(options) {
  if (!options) {
    options = {};
  }
  this.keyLength = options.keyLength || DocumentHandler.defaultKeyLength;
  this.maxLength = options.maxLength; // none by default
  this.store = options.store;
};

DocumentHandler.defaultKeyLength = 10;

// Handle retrieving a document
DocumentHandler.prototype.handleGet = function(key, response, skipExpire) {
  this.store.get(key, function(ret) {
    if (ret) {
      winston.verbose('retrieved document', { key: key });
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ data: ret, key: key }));
    }
    else {
      winston.warn('document not found', { key: key });
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'document not found' }));
    }
  }, skipExpire);
};

// Handle retrieving the raw version of a document
DocumentHandler.prototype.handleRawGet = function(key, response, skipExpire) {
  this.store.get(key, function(ret) {
    if (ret) {
      winston.verbose('retrieved raw document', { key: key });
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end(ret);
    }
    else {
      winston.warn('raw document not found', { key: key });
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'document not found' }));
    }
  }, skipExpire);
};

// Handle adding a new Document
DocumentHandler.prototype.handlePost = function(request, response) {
  var _this = this;
  var buffer = '';
  request.on('data', function(data) {
    if (!buffer) {
      response.writeHead(200, { 'content-type': 'application/json' });
    } 
    buffer += data.toString();
    if (_this.maxLength && buffer.length > _this.maxLength) {
      _this.cancelled = true;
      winston.warn('document >maxLength', { maxLength: _this.maxLength });
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'document exceeds maximum length' }));
    }
  });
  request.on('end', function(end) {
    if (_this.cancelled) return;
    _this.chooseKey(function(key) {
      _this.store.set(key, buffer, function(res) {
        if (res) {
          winston.verbose('added document', { key: key });
          response.end(JSON.stringify({ key: key }));
        }
        else {
          winston.verbose('error adding document');
          response.writeHead(500, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ message: 'error adding document' }));
        }
      });
    });
  });
  request.on('error', function(error) {
    winston.error('connection error: ' + error.message);
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'connection error' }));
  });
};

// Get a random key that hasn't been already used
DocumentHandler.prototype.chooseKey = function(callback) {
  var key = this.randomKey();
  var _this = this;
  this.store.get(key, function(ret) {
    if (ret) {
      _this.chooseKey(callback);
    } else {
      callback(key);
    }
  }); 
};

// Generate a random key
DocumentHandler.prototype.randomKey = function() {
  var text = '';
  var keyspace = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < this.keyLength; i++) {
    text += keyspace.charAt(Math.floor(Math.random() * keyspace.length));
  }
  return text;
};

module.exports = DocumentHandler;

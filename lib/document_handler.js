var fs = require('fs'); // TODO won't be needed

var winston = require('winston');
var hashlib = require('hashlib');

// For handling serving stored documents

var DocumentHandler = function(options) {
  if (options) {
    this.keyLength = options.keyLength || 20;
  }
};

// Save a document
// TODO make data path configurable
// TODO move to a separate object
DocumentHandler.save = function(key, data, callback) {
  fs.mkdir('data', '700', function() {
    fs.writeFile('data/' + hashlib.md5(key), data, 'utf8', function() {
      callback(true); // TODO handle errors
    });
  });
};

// Retrieve a document by key
DocumentHandler.get = function(key, callback) {
  fs.readFile('data/' + hashlib.md5(key), 'utf8', function(err, data) {
    if (err) {
      callback(false);
    }
    else {
      callback(data);
    }
  });
};

// Handle retrieving a document
DocumentHandler.prototype.handleGet = function(key, response) {
  DocumentHandler.get(key, function(ret) {
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
  });
};

// Handle adding a new Document
DocumentHandler.prototype.handlePost = function(request, response) {
  var key = this.randomKey();
  var buffer = '';
  request.on('data', function(data) {
    if (!buffer) {
      response.writeHead(200, { 'content-type': 'application/json' });
    } 
    buffer += data.toString();
  });
  request.on('end', function(end) {
    DocumentHandler.save(key, buffer, function(res) {
      if (res) {
        winston.verbose('added document', { key: key });
        response.end(JSON.stringify({ key: key }));
      }
      else {
        winston.verbose('error adding document');
        response.end(JSON.stringify({ message: 'error adding document' }));
      }
    });
  });
  request.on('error', function(error) {
    winston.error('connection error: ' + error.message);
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'connection error' }));
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

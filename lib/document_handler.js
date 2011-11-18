var winston = require('winston');

// For handling serving stored documents

var DocumentHandler = function() {

};

// TODO implement with FS backend
DocumentHandler.documents = {};

// Handle retrieving a document
DocumentHandler.prototype.handleGet = function(key, response) {
  if (DocumentHandler.documents[key]) {
    winston.verbose('retrieved document', { key: key });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ data: DocumentHandler.documents[key], key: key }));
  }
  else {
    winston.warn('document not found', { key: key });
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'document not found' }));
  }
};

// Handle adding a new Document
DocumentHandler.prototype.handlePost = function(request, response) {
  var key = this.randomKey();
  request.on('data', function(data) {
    if (!DocumentHandler.documents[key]) {
      response.writeHead(200, { 'content-type': 'application/json' });
      DocumentHandler.documents[key] = '';
    } 
    DocumentHandler.documents[key] += data.toString();
  });
  request.on('end', function(end) {
    winston.verbose('added document', { key: key });
    response.end(JSON.stringify({ key: key }));
  });
  request.on('error', function(error) {
    winston.error('connection error: ' + error.message);
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'connection error' }));
  });
};

// Generate a random key
// TODO make length configurable
DocumentHandler.prototype.randomKey = function() {
  var text = '';
  var keyspace = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 6; i++) {
    text += keyspace.charAt(Math.floor(Math.random() * keyspace.length));
  }
  return text;
};

module.exports = DocumentHandler;

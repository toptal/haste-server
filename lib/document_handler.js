var winston = require('winston');

// For handling serving stored documents

var DocumentHandler = function() {

};

// TODO implement with FS backend
DocumentHandler.documents = {};

DocumentHandler.prototype.handleGet = function(key, response) {
  if (DocumentHandler.documents[key]) {
    winston.verbose('retrieved document', { key: key });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ data: DocumentHandler.documents[key] }));
  }
  else {
    winston.warn('document not found', { key: key });
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'document not found' }));
  }
};

DocumentHandler.prototype.handlePost = function(request, response) {
  var key = '123';
  request.on('data', function(data) {
    if (!DocumentHandler.documents[key]) {
      DocumentHandler.documents[key] = '';
    } 
    DocumentHandler.documents[key] += data.toString();
  });
  request.on('end', function(end) {
    winston.verbose('added document', { key: key });
    response.end(JSON.stringify({ key: key }));
  });
  request.on('error', function(error) {
    // TODO handle error
    // TODO finish all TODOs
  });
};

// TODO block modifying

module.exports = DocumentHandler;

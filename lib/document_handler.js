var winston = require('winston');
var Busboy = require('busboy');

// For handling serving stored documents

const checkkeyregex = /^[a-zA-Z0-9-_.]+$/;

var DocumentHandler = function(options) {
  if (!options) {
    options = {};
  }
  this.keyLength = options.keyLength || DocumentHandler.defaultKeyLength;
  this.maxLength = options.maxLength; // none by default
  this.store = options.store;
  this.keyGenerator = options.keyGenerator;
};

DocumentHandler.defaultKeyLength = 10;

// Handle retrieving a document
DocumentHandler.prototype.handleGet = function(request, response, config) {
  const key = request.params.id;
  const skipExpire = !!config.documents[key];

  if ((key)&&(!checkkeyregex.test(key))) {
    winston.warn('invalid key', { key: key });
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({ message: 'Invalid key', key: key })
    );

    return;
  }

  this.store.get(key, function(ret) {
    if (ret) {
      winston.verbose('retrieved document', { key: key });
      response.writeHead(200, { 'content-type': 'application/json' });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(JSON.stringify({ data: ret, key: key }));
      }
    }
    else {
      winston.warn('document not found', { key: key });
      response.writeHead(404, { 'content-type': 'application/json' });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(JSON.stringify({ message: 'Document not found.' }));
      }
    }
  }, skipExpire);
};

// Handle retrieving the raw version of a document
DocumentHandler.prototype.handleRawGet = function(request, response, config) {
  const key = request.params.id;
  const skipExpire = !!config.documents[key];

  if ((key)&&(!checkkeyregex.test(key))) {
    winston.warn('invalid key', { key: key });
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({ message: 'Invalid key', key: key })
    );

    return;
  }

  this.store.get(key, function(ret) {
    if (ret) {
      winston.verbose('retrieved raw document', { key: key });
      response.writeHead(200, { 'content-type': 'text/plain; charset=UTF-8' });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(ret);
      }
    }
    else {
      winston.warn('raw document not found', { key: key });
      response.writeHead(404, { 'content-type': 'application/json' });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(JSON.stringify({ message: 'Document not found.' }));
      }
    }
  }, skipExpire);
};

// Handle adding a new Document
DocumentHandler.prototype.handlePost = function (request, response) {
  var _this = this;
  var buffer = '';
  var cancelled = false;

  const key = request.params.id ? request.params.id : null;
  if ((key)&&(!checkkeyregex.test(key))) {
    winston.warn('invalid key', { key: key });
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({ message: 'Invalid key', key: key })
    );

    return;
  }

  // What to do when done
  var onSuccess = function () {
    // Check length
    if (_this.maxLength && buffer.length > _this.maxLength) {
      cancelled = true;
      winston.warn('document >maxLength', { maxLength: _this.maxLength });
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({ message: 'Document exceeds maximum length.' })
      );
      return;
    }

    const store = function (key) {
       _this.store.set(key, buffer, function (res) {
        if (res) {
          winston.verbose('added document', { key: key });
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ key: key }));
        }
        else {
          winston.verbose('error adding document');
          response.writeHead(500, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ message: 'Error adding document.' }));
        }
      });
    }

    // And then save if we should
    if (!key) {
      _this.chooseKey(function (key) {
        store(key);
      });
    } else {
      store(key);
    }
  };

  // If we should, parse a form to grab the data
  var ct = request.headers['content-type'];
  if (ct && ct.split(';')[0] === 'multipart/form-data') {
    var busboy = new Busboy({ headers: request.headers });
    busboy.on('field', function (fieldname, val) {
      if (fieldname === 'data') {
        buffer = val;
      }
    });
    busboy.on('finish', function () {
      onSuccess();
    });
    request.pipe(busboy);
  // Otherwise, use our own and just grab flat data from POST body
  } else {
    request.on('data', function (data) {
      buffer += data.toString();
    });
    request.on('end', function () {
      if (cancelled) { return; }
      onSuccess();
    });
    request.on('error', function (error) {
      winston.error('connection error: ' + error.message);
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'Connection error.' }));
      cancelled = true;
    });
  }
};


// Handle deleting a document
DocumentHandler.prototype.handleDelete = function(request, response, config) {
  const key = request.params.id;
  const allowdelete = config.storage.allowDelete;

  if ((key)&&(!checkkeyregex.test(key))) {
    winston.warn('invalid key', { key: key });
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({ message: 'Invalid key', key: key })
    );

    return;
  }
  
  if (!this.store.delete||!allowdelete) {
    winston.warn('document provider does not support delete', { key: key });
    response.writeHead(405, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'Delete not supported.' }));
    return;
  }

  this.store.delete(key, function(ret) {
    if (ret) {
      winston.verbose('deleted document', { key: key });
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'Document deleted', key: key }));
    }
    else {
      winston.warn('raw document not found', { key: key });
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'Document not found.' }));
    }
  });
};

// Handle listing documents
DocumentHandler.prototype.handleList = function(request, response, config) {
  const allowlist = config.storage.allowList;

  if (!this.store.list||!allowlist) {
    winston.warn('document provider does not support list');
    response.writeHead(405, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'Delete not supported.' }));
    return;
  }

  this.store.list(function(ret) {
      winston.verbose('list documents');
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(ret));
  });
};

// Handle listing documents
DocumentHandler.prototype.handleGetKey = function(request, response, config) {
  this.chooseKey(function(ret) {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end(ret);
  });
};

// Keep choosing keys until one isn't taken
DocumentHandler.prototype.chooseKey = function(callback) {
  var key = this.acceptableKey();
  var _this = this;
  this.store.get(key, function(ret) {
    if (ret) {
      _this.chooseKey(callback);
    } else {
      callback(key);
    }
  }, true); // Don't bump expirations when key searching
};

DocumentHandler.prototype.acceptableKey = function() {
  return this.keyGenerator.createKey(this.keyLength);
};

module.exports = DocumentHandler;

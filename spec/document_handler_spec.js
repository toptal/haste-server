var DocumentHandler = require('../lib/document_handler');
var Generator = require('../lib/key_generators/random');

describe('document_handler', function() {

  describe('randomKey', function() {

    it('should choose a key of the proper length', function() {
      var gen = new Generator();
      var dh = new DocumentHandler({ keyLength: 6, keyGenerator: gen });
      dh.acceptableKey().length.should.equal(6);
    });

    it('should choose a default key length', function() {
      var gen = new Generator();
      var dh = new DocumentHandler({ keyGenerator: gen });
      dh.keyLength.should.equal(DocumentHandler.defaultKeyLength);
    });

  });

});

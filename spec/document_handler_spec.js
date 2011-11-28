var DocumentHandler = require('../lib/document_handler');

describe('document_handler', function() {

  describe('randomKey', function() {

    it('should choose a key of the proper length', function() {
      var dh = new DocumentHandler({ keyLength: 6 });
      expect(dh.randomKey().length).toBe(6);
    });

    it('should choose a default key length', function() {
      var dh = new DocumentHandler();
      expect(dh.keyLength).toBe(DocumentHandler.defaultKeyLength);
    });

  });

});

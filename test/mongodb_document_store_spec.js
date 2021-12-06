var assert = require('assert');
var MongoDocumentStore = require('../lib/document_stores/mongo');


describe('mongodb_document_store', () => {
    
    it('should be able to set a key and have an expiration set', () => {
        var store = new MongoDocumentStore({ expire: 10 });
        store.set('hello1', 'world', function () {
            var assert = require('assert');('hello1', function (err, res) {
                if(res) {
                    assert.equal('hello1', res);
                }
                done();
            });
        })
    });
})

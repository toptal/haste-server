var RedisDocumentStore = require('../lib/document_stores/redis');

var winston = require('winston');
winston.remove(winston.transports.Console);

describe('redis_document_store', function() {

  /* reconnect to redis on each test */
  afterEach(function() {
    if (RedisDocumentStore.client) {
      RedisDocumentStore.client.quit();
      RedisDocumentStore.client = false;
    }
  });
  
  describe('set', function() {

    it('should be able to set a key and have an expiration set', function(done) {
      var store = new RedisDocumentStore({ expire: 10 });
      store.set('hello1', 'world', function() {
        RedisDocumentStore.client.ttl('hello1', function(err, res) {
          res.should.be.above(1);
          done();
        });
      });
    });

    it('should not set an expiration when told not to', function(done) {
      var store = new RedisDocumentStore({ expire: 10 });
      store.set('hello2', 'world', function() {
        RedisDocumentStore.client.ttl('hello2', function(err, res) {
          res.should.equal(-1);
          done();
        });
      }, true);
    });

    it('should not set an expiration when expiration is off', function(done) {
      var store = new RedisDocumentStore({ expire: false });
      store.set('hello3', 'world', function(worked) {
        RedisDocumentStore.client.ttl('hello3', function(err, res) {
          res.should.equal(-1);
          done();
        });
      });
    });

  });

});

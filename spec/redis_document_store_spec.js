var RedisDocumentStore = require('../lib/redis_document_store');

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

    it('should be able to set a key and have an expiration set', function() {
      var store = new RedisDocumentStore({ expire: 10 });
      runs(function() {
        var _this = this;
        store.set('hello1', 'world', function(worked) {
          _this.result = worked; 
        });
      });
      waitsFor(function() {
        return typeof(this.result) === 'boolean';
      });
      runs(function() {
        var _this = this;
        RedisDocumentStore.client.ttl('hello1', function(err, res) {
          expect(res).toBeGreaterThan(1);
          _this.done = true;
        });
      });
      waitsFor(function() {
        return this.done;
      });
    });

    it('should not set an expiration when told not to', function() {
      var store = new RedisDocumentStore({ expire: 10 });
      runs(function() {
        var _this = this;
        store.set('hello2', 'world', function(worked) {
          _this.result = worked; 
        }, true);
      });
      waitsFor(function() {
        return typeof(this.result) === 'boolean';
      });
      runs(function() {
        var _this = this;
        RedisDocumentStore.client.ttl('hello2', function(err, res) {
          expect(res).toBe(-1);
          _this.done = true;
        });
      });
      waitsFor(function() {
        return this.done;
      });
    });

    it('should not set an expiration when expiration is off', function() {
      var store = new RedisDocumentStore({ expire: false });
      runs(function() {
        var _this = this;
        store.set('hello3', 'world', function(worked) {
          _this.result = worked; 
        });
      });
      waitsFor(function() {
        return typeof(this.result) === 'boolean';
      });
      runs(function() {
        var _this = this;
        RedisDocumentStore.client.ttl('hello3', function(err, res) {
          expect(res).toBe(-1);
          _this.done = true;
        });
      });
      waitsFor(function() {
        return this.done;
      });
    });

  });

});

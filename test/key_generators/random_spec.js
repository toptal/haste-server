/* global describe, it */

const assert = require('assert');

const Generator = require('../../lib/key_generators/random');

describe('RandomKeyGenerator', function() {
  describe('randomKey', function() {
    it('should return a key of the proper length', function() {
      var gen = new Generator();
      assert.equal(6, gen.createKey(6).length);
    });

    it('should use a key from the given keyset if given', () => {
      var gen = new Generator({keyspace: 'A'});
      assert.equal('AAAAAA', gen.createKey(6));
    });
  });
});

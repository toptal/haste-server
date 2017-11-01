/* global describe, it */

const assert = require('assert');

const Generator = require('../../lib/key_generators/random');

describe('RandomKeyGenerator', () => {
  describe('randomKey', () => {
    it('should return a key of the proper length', () => {
      const gen = new Generator();
      assert.equal(6, gen.createKey(6).length);
    });

    it('should use a key from the given keyset if given', () => {
      const gen = new Generator({keyspace: 'A'});
      assert.equal('AAAAAA', gen.createKey(6));
    });
  });
});

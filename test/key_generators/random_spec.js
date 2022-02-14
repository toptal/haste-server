/* global describe, it */

const assert = require('assert');

const Generator = require('../../lib/key_generators/random');

describe('RandomKeyGenerator', () => {
  describe('generation', () => {
    it('should return a key of the proper length', () => {
      const gen = new Generator();
      assert.equal(gen.createKey(6).length, 6);
    });

    it('should use a key from the given keyset if given', () => {
      const gen = new Generator({keyspace: 'A'});
      assert.equal(gen.createKey(6), 'AAAAAA');
    });

    it('should not use a key from the given keyset if not given', () => {
      const gen = new Generator({keyspace: 'A'});
      assert.ok(!gen.createKey(6).includes('B'));
    });
  });
});

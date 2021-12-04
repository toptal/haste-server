/* global describe, it */

const assert = require('assert');

const fs = require('fs');

const Generator = require('../../lib/key_generators/dictionary');

describe('RandomKeyGenerator', function() {
  describe('randomKey', function() {
    it('should throw an error if given no options', () => {
      assert.throws(() => {
        new Generator();
      }, Error);
    });

    it('should throw an error if given no path', () => {
      assert.throws(() => {
        new Generator({});
      }, Error);
    });

    it('should return a key of the proper number of words from the given dictionary', (done) => {
      const path = 'data/haste-server-test-dictionary';
      const charList = 'cat';
      fs.writeFile(path, charList, function (err) {
        if (err) throw err;
      });
      done();
      const gen = new Generator({path});
      const key = gen.createKey(3);
      assert.equal(6, key.length);
      fs.unlinkSync(path);
    });
  });
});

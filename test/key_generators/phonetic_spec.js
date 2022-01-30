/* global describe, it */

const assert = require('assert');

const Generator = require('../../lib/key_generators/phonetic');

const vowels = 'aeiou';
const consonants = 'bcdfghjklmnpqrstvwxyz';

describe('PhoneticKeyGenerator', () => {
  describe('generation', () => {
    it('should return a key of the proper length', () => {
      const gen = new Generator();
      assert.equal(6, gen.createKey(6).length);
    });

    it('should alternate consonants and vowels', () => {
      const gen = new Generator();

      const key = gen.createKey(3);

      // if it starts with a consonant, we expect cvc
      // if it starts with a vowel, we expect vcv
      if(consonants.includes(key[0])) {
        assert.ok(consonants.includes(key[0]));
        assert.ok(consonants.includes(key[2]));
        assert.ok(vowels.includes(key[1]));
      } else {
        assert.ok(vowels.includes(key[0]));
        assert.ok(vowels.includes(key[2]));
        assert.ok(consonants.includes(key[1]));
      }
    });
  });
});

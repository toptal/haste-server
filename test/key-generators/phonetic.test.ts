/* eslint-disable jest/no-conditional-expect */
import Generator from 'src/lib/key-generators/phonetic'

const vowels = 'aeiou';
const consonants = 'bcdfghjklmnpqrstvwxyz';

describe('PhoneticKeyGenerator', () => {
  describe('generation', () => {
    it('should return a key of the proper length', () => {
      const gen = new Generator({ type: 'phonetic'});
      expect(gen.createKey(6).length).toEqual(6);
    });

    it('should alternate consonants and vowels', () => {
      const gen = new Generator({ type: 'phonetic'});
      const key = gen.createKey(3);
      // if it starts with a consonant, we expect cvc
      // if it starts with a vowel, we expect vcv
      if(consonants.includes(key[0])) {
        expect(consonants.includes(key[0])).toBeTruthy()
        expect(consonants.includes(key[2])).toBeTruthy()
        expect(vowels.includes(key[1])).toBeTruthy()
      } else {
        expect(vowels.includes(key[0])).toBeTruthy()
        expect(vowels.includes(key[2])).toBeTruthy()
        expect(consonants.includes(key[1])).toBeTruthy()
      }
    });
  });
});

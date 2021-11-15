// Draws inspiration from pwgen and http://tools.arantius.com/password
// Helper methods to get an random vowel or consonant
const randOf = (collection) => {
    return () => {
        return collection[Math.floor(Math.random() * collection.length)];
    };
}, randVowel = randOf('aeiou'), randConsonant = randOf('bcdfghjklmnpqrstvwxyz');

module.exports = class PhoneticKeyGenerator {

    // Generate a phonetic key of alternating consonant & vowel
    createKey(keyLength) {
        let text = '';
        const start = Math.round(Math.random());

        for (let i = 0; i < keyLength; i++) {
            text += i % 2 !== start ? randVowel() : randConsonant();
        }

        return text;
    }

};

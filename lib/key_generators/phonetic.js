// Draws inspiration from pwgen and http://tools.arantius.com/password
var PhoneticKeyGenerator = function(options) {
  // No options
};

// Generate a phonetic key
PhoneticKeyGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  var start = Math.round(Math.random());
  for (var i = 0; i < keyLength; i++) {
    text += (i % 2 == start) ? this.randConsonant() : this.randVowel();
  }
  return text;
};

PhoneticKeyGenerator.consonants = 'bcdfghjklmnpqrstvwxyz';
PhoneticKeyGenerator.vowels = 'aeiou';

// Get an random vowel
PhoneticKeyGenerator.prototype.randVowel = function() {
  return PhoneticKeyGenerator.vowels[
    Math.floor(Math.random() * PhoneticKeyGenerator.vowels.length)
  ];
};

// Get an random consonant
PhoneticKeyGenerator.prototype.randConsonant = function() {
  return PhoneticKeyGenerator.consonants[
    Math.floor(Math.random() * PhoneticKeyGenerator.consonants.length)
  ];
};

module.exports = PhoneticKeyGenerator;

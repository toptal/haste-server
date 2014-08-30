/*
	The current timestamp is sha1 hashed, then that hash value is converted
	into a number system represented by a 'legible' alphabet.

	This provides several enhancements over the default random keygen.
		1) Keys are unlikely to collide due to using timestamp as seed
		2) Keys will display more entropy due to sha1-hashing
		3) Similar-looking letters have been removed from alphabet
*/

var crypto = require('crypto');

// the alphabet is separated this way so when we convert hex to this system,
// we can have some manner of style, like upper case, followed by 2 lower case, etc.
var code = ['ABCDEFGHJKMNPRSTWXYZ',
			'abcdefhkmnprstwxyz',
			/*'abcdefhkmnprstwxyz',
			'0123456789'*/];

function sha1(str) {
 	var hash = crypto.createHash('sha1');
 	hash.update(str);
 	return hash.digest('hex');
}

function convertNumberToLegible(n) {
	var legible = '';
	var codeIndex = 0;
	var alphabet = code[codeIndex];
	while (n > 0) {
		var c = n % alphabet.length;
		n = Math.floor(n / alphabet.length);
		legible += alphabet.charAt(c);
		codeIndex = (codeIndex+1) % code.length;
		alphabet = code[codeIndex];
	}
	return legible;
}

function createKey(keyLength) {
	// process.hrtime() gives more precision (nanoseconds?) than new Date().getTime() (milliseconds)
	var time = process.hrtime().join('');
	var sha1Hex= sha1(time).substring(0, 8);
	var key = convertNumberToLegible(parseInt(sha1Hex, 16));
	if (key.length > keyLength) {
		return key.substring(0, keyLength);
	}
	return key;
};

var UniqueRandomKeyGenerator = function() {};
UniqueRandomKeyGenerator.prototype.createKey = createKey;
module.exports = UniqueRandomKeyGenerator;

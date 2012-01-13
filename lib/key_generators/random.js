var RandomKeyGenerator = function(options) {
  if (!options) {
    options = {};
  }
  this.keyspace = options.keyspace || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
};

// Generate a random key
RandomKeyGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  for (var i = 0; i < keyLength; i++) {
    text += this.keyspace.charAt(Math.floor(Math.random() * this.keyspace.length));
  }
  return text;
};

module.exports = RandomKeyGenerator;

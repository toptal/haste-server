var RandomKeyGenerator = function(options) {
  if (!options) {
    options = {};
  }
  this.keyspace = options.keyspace || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
};

// Generate a random key
RandomKeyGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  var index;
  for (var i = 0; i < keyLength; i++) {
    index = Math.floor(Math.random() * this.keyspace.length);
    text += this.keyspace.charAt(index);
  }
  return text;
};

module.exports = RandomKeyGenerator;

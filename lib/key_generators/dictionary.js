var fs = require('fs');

var DictionaryGenerator = function(options) {
  //Options
  if (!options) throw Error('No options passed to generator');
  if (!options.path) throw Error('No dictionary path specified in options');

  //Load dictionary
  fs.readFile(options.path, 'utf8', (err, data) => {
    if (err) throw err;
    this.dictionary = data.split(/[\n\r]+/);
  });
};

//Generates a dictionary-based key, of keyLength words
DictionaryGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  for(var i = 0; i < keyLength; i++)
    text += this.dictionary[Math.floor(Math.random() * this.dictionary.length)];

  return text;
};

module.exports = DictionaryGenerator;

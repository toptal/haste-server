var fs = require('fs')
var dictionary;

var DictionaryGenerator = function(options) {
  //Options
  if (!options) 
    return done(Error('No options passed to generator'));
  if(!options.path)
    return done(Error('No dictionary path specified in options'));
  
  //Load dictionary
  fs.readFile(options.path, 'utf8', (err,data) => {
    if(err) throw err;
    this.dictionary = data.split(/[\n\r]+/);
  });
};

//Generates a dictionary-based key, of keyLength words
DictionaryGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  for(var i = 0; i < keyLength; i++) {
    var index =Math.floor(Math.random()*this.dictionary.length);
    text += this.dictionary[index];
  }

  return text;
};

module.exports = DictionaryGenerator;

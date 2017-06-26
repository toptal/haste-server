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
    this.dictionary = data.split(',');
    
    //Remove any non alpha-numeric characters
    for(var i = 0; i < this.dictionary.length; i++)
      this.dictionary[i] = this.dictionary[i].replace(/\W/g,'');
    
    });
};

//Generates a dictionary-based key, of keyLength words
DictionaryGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  for(var i = 0; i < keyLength; i++)
    text += this.dictionary[Math.floor(Math.random()*this.dictionary.length)];
  return text;
};

module.exports = DictionaryGenerator;

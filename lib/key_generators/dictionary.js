var rand = require('random-js');
var fs = require('fs')
var dictionary;
var randomEngine;
var random;

var DictionaryGenerator = function(options) {
  //Options
  if (!options) 
    return done(Error('No options passed to generator'));
  if(!options.path)
    return done(Error('No dictionary path specified in options'));
  
  //Load dictionary
  fs.readFile(options.path,'utf8',(err,data) => {
    if(err) throw err;
    dictionary = data.split(',');
    
    //Remove any non alpha-numeric characters
    for(var i = 0; i < dictionary.length; i++){
      dictionary[i] = dictionary[i].replace(/\W/g,'');
    }

    random = rand.integer(0,dictionary.length);
    randomEngine = rand.engines.nativeMath;
    });
};

//Generates a dictionary-based key, of keyLength words
DictionaryGenerator.prototype.createKey = function(keyLength) {
  var text = '';
  for(var i = 0; i < keyLength; i++)
    text += dictionary[random(randomEngine)];
  return text;
};

module.exports = DictionaryGenerator;

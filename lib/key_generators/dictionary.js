const fs = require('fs');

module.exports = class DictionaryGenerator {

    constructor(options, readyCallback) {
        // Check options format
        if (options) {
            if (!options.path) throw Error('No dictionary path specified in options');
            fs.readFile(options.path, 'utf8', (err, data) => {
                if (err) throw err;

                this.dictionary = data.split(/[\n\r]+/);

                if (readyCallback) readyCallback();
            });
        } else {
            throw Error('No options passed to generator');
        }
    }

    // Generates a dictionary-based key, of keyLength words
    createKey(keyLength) {
        let text = '';

        let i;
        for (i = 0; i < keyLength; i++) {
            const index = Math.floor(Math.random() * this.dictionary.length);
            text += this.dictionary[index];
        }

        return text;
    }

};

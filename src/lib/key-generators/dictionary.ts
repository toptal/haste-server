import * as fs from 'fs'
import type { KeyGeneratorConfig } from '../../types/config'
import type { KeyGenerator } from '../../types/key-generator'

class DictionaryGenerator implements KeyGenerator {
  type: string

  dictionary: string[]

  constructor(options: KeyGeneratorConfig, readyCallback?: () => void) {
    // Check options format
    if (!options) throw Error('No options passed to generator')
    if (!options.path) throw Error('No dictionary path specified in options')

    this.dictionary = []
    this.type = options.type

    // Load dictionary
    fs.readFile(options.path, 'utf8', (err, data) => {
      if (err) throw err

      this.dictionary = data.split(/[\n\r]+/)

      readyCallback?.()
    })
  }

  // Generates a dictionary-based key, of keyLength words
  createKey(keyLength: number): string {
    let text = ''

    for (let i = 0; i < keyLength; i += 1) {
      const index = Math.floor(Math.random() * this.dictionary.length)
      text += this.dictionary[index]
    }

    return text
  }
}

export default DictionaryGenerator

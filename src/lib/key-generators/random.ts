import type { KeyGeneratorConfig } from '../../types/config'
import type { KeyGenerator } from '../../types/key-generator'

class RandomKeyGenerator implements KeyGenerator {
  type: string

  keyspace: string

  // Initialize a new generator with the given keySpace
  constructor(options: KeyGeneratorConfig) {
    this.keyspace =
      options.keyspace ||
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    this.type = options.type
  }

  // Generate a key of the given length
  createKey(keyLength: number): string {
    let text = ''

    for (let i = 0; i < keyLength; i += 1) {
      const index = Math.floor(Math.random() * this.keyspace.length)
      text += this.keyspace.charAt(index)
    }

    return text
  }
}

export default RandomKeyGenerator

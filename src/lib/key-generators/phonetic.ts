// Draws inspiration from pwgen and http://tools.arantius.com/password
import KeyGenerator from '.'

const randOf = (collection: string) => () =>
  collection[Math.floor(Math.random() * collection.length)]

// Helper methods to get an random vowel or consonant
const randVowel = randOf('aeiou')
const randConsonant = randOf('bcdfghjklmnpqrstvwxyz')

class PhoneticKeyGenerator extends KeyGenerator {
  // Generate a phonetic key of alternating consonant & vowel
  // eslint-disable-next-line class-methods-use-this
  createKey(keyLength: number) {
    let text = ''
    const start = Math.round(Math.random())

    for (let i = 0; i < keyLength; i += 1) {
      text += i % 2 === start ? randConsonant() : randVowel()
    }

    return text
  }
}

export default PhoneticKeyGenerator

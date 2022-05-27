import DocumentHandler from '../../src/lib/document-handler/index'
import Generator from '../../src/lib/key-generators/random'
import constants from '../../src/constants'

describe('document-handler', () => {
  describe('with randomKey', () => {
    it('should choose a key of the proper length', () => {
      const gen = new Generator({ type: 'random' })
      const dh = new DocumentHandler({ keyLength: 6, keyGenerator: gen})
      expect(dh.acceptableKey()?.length).toEqual(6);
    })

    it('should choose a default key length', () => {
      const gen = new Generator({ type: 'random' })
      const dh = new DocumentHandler({ keyGenerator: gen, maxLength: 1 })
      expect(dh.keyLength).toEqual(constants.DEFAULT_KEY_LENGTH);

    })
  })
})

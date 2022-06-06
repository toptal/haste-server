import { createMock } from 'ts-auto-mock';
import DocumentHandler from 'src/lib/document-handler/index'
import Generator from 'src/lib/key-generators/random'
import constants from 'src/constants'
import { Config } from 'src/types/config'
import { Store } from 'src/lib/document-stores';

const store : Store = createMock<Store>();
const config : Config = createMock<Config>();

describe('document-handler', () => {
  describe('with random key', () => {
    it('should choose a key of the proper length', () => {
      const gen = new Generator({ type: 'random' })
      const dh = new DocumentHandler({ keyLength: 6, keyGenerator: gen, store, config})
      expect(dh.acceptableKey()?.length).toEqual(6);
    })

    it('should choose a default key length', () => {
      const gen = new Generator({ type: 'random' })
      const dh = new DocumentHandler({ keyGenerator: gen, maxLength: 1, store, config })
      expect(dh.keyLength).toEqual(constants.DEFAULT_KEY_LENGTH);
    })
  })
})

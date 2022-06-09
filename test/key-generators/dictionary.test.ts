import Generator from 'src/lib/key-generators/dictionary'

jest.mock('fs', () => ({
  readFile: jest
    .fn()
    .mockImplementation((_, a, callback) => callback(null, 'cat'))
}))

describe('DictionaryGenerator', () => {
  describe('options', () => {
    it('should throw an error if given no options or path', () => {
      expect(() => new Generator({ type: '' })).toThrow()
    })
  })
  describe('generation', () => {
    it('should return a key of the proper number of words from the given dictionary', () => {
      const path = '/tmp/haste-server-test-dictionary'

      const gen = new Generator({ path, type: '' })

      expect(gen.createKey(3)).toEqual('catcatcat')
    })
  })
})

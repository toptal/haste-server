import Generator from '../../src/lib/key-generators/random'

describe('RandomKeyGenerator', () => {
  describe('generation', () => {
    it('should return a key of the proper length', () => {
      const gen = new Generator({ type: 'random' })
      expect(gen.createKey(6).length).toEqual(6)
    })

    it('should use a key from the given keyset if given', () => {
      const gen = new Generator({ type: 'random', keyspace: 'A' })
      expect(gen.createKey(6)).toEqual('AAAAAA')
    })

    it('should not use a key from the given keyset if not given', () => {
      const gen = new Generator({ type: 'random', keyspace: 'A' })
      expect(gen.createKey(6).includes('B')).toBeFalsy()
    })
  })
})

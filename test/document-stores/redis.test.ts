import RedisDocumentStore from '../../src/lib/document-stores/redis'

describe('Redis document store', () => {
  let store: RedisDocumentStore
  /* reconnect to redis on each test */
  afterEach(() => {
    if (store) {
      store.client?.quit()
    }
  })

  describe('set', () => {
    it('should be able to set a key and have an expiration set', async () => {
      store = new RedisDocumentStore({
        expire: 10,
        type: 'redis',
        url: 'http://localhost:6666',
      })
      return store.set('hello1', 'world', async () => {
        const res = await store.client?.ttl('hello1')
        expect(res).toBeGreaterThan(1)
      })
    })

    it('should not set an expiration when told not to', async () => {
      store = new RedisDocumentStore({
        expire: 10,
        type: 'redis',
        url: 'http://localhost:6666',
      })

      store.set(
        'hello2',
        'world',
        async () => {
          const res = await store.client?.ttl('hello2')
          expect(res).toEqual(-1)
        },
        true,
      )
    })

    it('should not set an expiration when expiration is off', async () => {
      store = new RedisDocumentStore({
        type: 'redis',
        url: 'http://localhost:6666',
      })

      store.set('hello3', 'world', async () => {
        const res = await store.client?.ttl('hello3')
        expect(res).toEqual(-1)
      })
    })
  })
})

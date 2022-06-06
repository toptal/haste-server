import type {
  AmazonStoreConfig,
  BaseStoreConfig,
  Config,
  GoogleStoreConfig,
  MemcachedStoreConfig,
  MongoStoreConfig,
  PostgresStoreConfig,
  RedisStoreConfig,
  RethinkDbStoreConfig
} from 'src/types/config'
import type { Store } from 'src/types/callback'
import { StoreNames } from 'src/types/store-names'

const build = async (config: Config): Promise<Store> => {
  const DocumentStore = (await import(`../document-stores/${config.storeName}`))
    .default

  let store: BaseStoreConfig

  switch (config.storeName) {
    case StoreNames.amazons3:
      store = config.storage as AmazonStoreConfig
      break
    case StoreNames.googledatastore:
      store = config.storage as GoogleStoreConfig
      break
    case StoreNames.memcached:
      store = config.storage as MemcachedStoreConfig
      break
    case StoreNames.mongo:
      store = config.storage as MongoStoreConfig
      break
    case StoreNames.postgres:
      store = config.storage as PostgresStoreConfig
      break
    case StoreNames.redis:
      store = config.storage as RedisStoreConfig
      break
    case StoreNames.rethinkdb:
      store = config.storage as RethinkDbStoreConfig
      break
    case StoreNames.file:
    default:
      store = config.storage as BaseStoreConfig
      break
  }
  return new DocumentStore(store)
}

export default build

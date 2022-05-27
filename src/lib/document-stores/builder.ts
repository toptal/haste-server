import type { Config } from '../../types/config'
import type { Store } from '../../types/store'

const build = async (config: Config): Promise<Store> => {

  if (process.env.REDISTOGO_URL && config.storage.type === 'redis') {
    // const redisClient = require("redis-url").connect(process.env.REDISTOGO_URL);
    // Store = require("./lib/document-stores/redis");
    // preferredStore = new Store(config.storage, redisClient);

    const DocumentStore = (await import(`../document-stores/${config.storage.type}`)).default

    return new DocumentStore(config.storage)
  } 
    const DocumentStore = (await import(`../document-stores/${config.storage.type}`)).default

    return new DocumentStore(config.storage)
  
}

export default build


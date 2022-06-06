import type { Config } from 'src/types/config'
import type { Store } from 'src/types/store'

const build = async (config: Config): Promise<Store> => {
  const DocumentStore = (
    await import(`../document-stores/${config.storage.type}`)
  ).default

  return new DocumentStore(config.storage)
}

export default build

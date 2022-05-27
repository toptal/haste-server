import type { Config } from '../../types/config'
import buildGenerator from '../key-generators/builder'
import buildStore from '../document-stores/builder'
import DocumentHandler from "./index"

const build = async (config: Config) => {
  const storage = await buildStore(config)
  const keyGenerator = await buildGenerator(config)

  const documentHandler = new DocumentHandler({
    store: storage,
    config,
    maxLength: config.maxLength,
    keyLength: config.keyLength,
    keyGenerator,
  })

  return documentHandler
}

export default build
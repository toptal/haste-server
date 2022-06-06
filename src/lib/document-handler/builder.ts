import buildGenerator from 'src/lib/key-generators/builder'
import type { Config } from 'src/types/config'
import buildStore from 'src/lib/document-stores/builder'
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

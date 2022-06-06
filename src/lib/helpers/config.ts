import * as fs from 'fs'
import * as path from 'path'

import { Config } from 'src/types/config'

const getConfig = (): Config => {
  const configPath =
    process.argv.length <= 2 ? 'project-config.js' : process.argv[2]
  const config = JSON.parse(
    fs.readFileSync(path.join('config', configPath), 'utf8')
  )

  config.port = Number(process.env.PORT) || config.port || 7777
  config.host = process.env.HOST || config.host || 'localhost'

  if (!config.storage) {
    config.storage = {}
  }

  if (!config.storeName) {
    config.storeName = 'file'
  }

  return config
}

export default getConfig

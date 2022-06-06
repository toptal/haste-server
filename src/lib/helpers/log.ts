import * as winston from 'winston'
import type { Config } from 'src/types/config'
import { Logging, LoggingType } from 'src/types/log'

const addLogging = (config: Config) => {
  try {
    winston.remove(winston.transports.Console)
  } catch (e) {
    /* was not present */
  }

  let detail: Logging
  let type: LoggingType

  for (let i = 0; i < config.logging.length; i += 1) {
    detail = config.logging[i]
    type = detail.type
    const transport = winston.transports[type]

    winston.add(transport, detail)
  }
}

export default addLogging

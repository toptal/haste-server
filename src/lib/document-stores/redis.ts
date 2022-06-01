import * as winston from 'winston'
import { createClient } from 'redis'
import { bool } from 'aws-sdk/clients/redshiftdata'
import { Callback, Store } from '../../types/store'
import { RedisStoreConfig } from '../../types/config'

export type RedisClientType = ReturnType<typeof createClient>

// For storing in redis
// options[type] = redis
// options[url] - the url to connect to redis
// options[host] - The host to connect to (default localhost)
// options[port] - The port to connect to (default 5379)
// options[db] - The db to use (default 0)
// options[expire] - The time to live for each key set (default never)

class RedisDocumentStore implements Store {
  type: string

  expire?: number | undefined

  client?: RedisClientType

  constructor(options: RedisStoreConfig) {
    this.expire = options.expire
    this.type = options.type
    this.connect(options)
  }

  connect = (options: RedisStoreConfig) => {
    winston.info('configuring redis')

    const url = process.env.REDISTOGO_URL || options.url
    const host = options.host || '127.0.0.1'
    const port = options.port || 6379
    const index = options.db || 0

    const connectionParameters = url ? {
      url
    }: {
      host,
      port
    }

    const config = {
      ...connectionParameters,
      database: index as number,
      ...(options.username ? { username: options.username } : {}),
      ...(options.password ? { username: options.username } : {}),
    }

    this.client = createClient(config)
    this.client.connect()

    this.client.on('error', err => {
      winston.error('redis disconnected', err)
    })

    this.client
      .select(index as number)
      .then(() => {
        winston.info(`connected to redis on ${url}/${index}`)
      })
      .catch(err => {
        winston.error(`error connecting to redis index ${index}`, {
          error: err,
        })
        process.exit(1)
      })
  }

  getExpire = (skipExpire?: bool) => (!skipExpire ? { EX: this.expire } : {})

  get = (key: string, callback: Callback): void => {
    this.client
      ?.get(key)
      .then(reply => {
        callback(reply || false)
      })
      .catch(() => {
        callback(false)
      })
  }

  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    this.client
      ?.set(key, data, this.getExpire(skipExpire))
      .then(() => {
        callback(true)
      })
      .catch(() => {
        callback(false)
      })
  }
}

export default RedisDocumentStore

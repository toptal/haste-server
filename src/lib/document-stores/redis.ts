import * as winston from 'winston'
import redis = require('redis')

import type { Callback } from 'src/types/callback'
import { RedisStoreConfig } from 'src/types/config'
import { Store } from '.'

const { createClient } = redis

export type RedisClientType = ReturnType<typeof redis.createClient>

// For storing in redis
// options[type] = redis
// options[url] - the url to connect to redis
// options[host] - The host to connect to (default localhost)
// options[port] - The port to connect to (default 5379)
// options[db] - The db to use (default 0)
// options[expire] - The time to live for each key set (default never)

class RedisDocumentStore extends Store {
  client: RedisClientType

  constructor(options: RedisStoreConfig) {
    super(options)

    const url = process.env.REDISTOGO_URL || options.url
    const host = options.host || '127.0.0.1'
    const port = options.port || '6379'
    const index = options.db || 0

    winston.info('configuring redis')

    const connectionParameters = url
      ? {
          url
        }
      : {
          host,
          port
        }

    const config = {
      ...connectionParameters,
      database: index,
      ...(options.username ? { username: options.username } : {}),
      ...(options.password ? { username: options.username } : {})
    }

    this.client = createClient(config)
    this.connect(index)
  }

  connect = (index: number) => {
    this.client.connect()

    this.client.on('error', err => {
      winston.error('redis disconnected', err)
    })

    this.client
      .select(index)
      .then(() => {
        winston.info(`connected to redis on ${index}`)
      })
      .catch(err => {
        winston.error(`error connecting to redis index ${index}`, {
          error: err
        })
        process.exit(1)
      })
  }

  getExpire = (skipExpire?: boolean) => (!skipExpire ? { EX: this.expire } : {})

  get = (key: string, callback: Callback): void => {
    this.client
      .get(key)
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
    skipExpire?: boolean | undefined
  ): void => {
    this.client
      .set(key, data, this.getExpire(skipExpire))
      .then(() => {
        callback(true)
      })
      .catch(() => {
        callback(false)
      })
  }
}

export default RedisDocumentStore

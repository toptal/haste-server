import * as winston from 'winston'
import Memcached = require('memcached')

import type { Callback, Store } from '../../types/store'
import type { MemcachedStoreConfig } from '../../types/config'

class MemcachedDocumentStore implements Store {
  expire: number | undefined

  client?: Memcached

  type: string

  // Create a new store with options
  constructor(options: MemcachedStoreConfig) {
    this.expire = options.expire
    this.type = options.type
    const host = options.host || '127.0.0.1'
    const port = options.port || 11211
    const url = `${host}:${port}`
    this.connect(url)
  }

  // Create a connection
  connect = (url: string) => {
    this.client = new Memcached(url)

    winston.info(`connecting to memcached on ${url}`)

    this.client.on('failure', (error: Memcached.IssueData) => {
      winston.info('error connecting to memcached', { error })
    })
  }

  // Get a file from a key
  get = (
    key: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    this.client?.get(key, (error, data: string) => {
      const value = error ? false : data

      callback(value as string)

      // Update the key so that the expiration is pushed forward
      if (value && !skipExpire) {
        this.set(
          key,
          data,
          updateSucceeded => {
            if (!updateSucceeded) {
              winston.error('failed to update expiration on GET', { key })
            }
          },
          skipExpire,
        )
      }
    })
  }

  // Save file in a key
  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    this.client?.set(key, data, skipExpire ? 0 : this.expire || 0, error => {
      callback(!error)
    })
  }
}

export default MemcachedDocumentStore

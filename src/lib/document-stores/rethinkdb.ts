import * as winston from 'winston'
import * as crypto from 'crypto'

import rethink = require('rethinkdbdash')

import type { RethinkDbStoreConfig } from 'src/types/config'
import type { Callback } from 'src/types/callback'
import { Store } from '.'

const md5 = (str: string) => {
  const md5sum = crypto.createHash('md5')
  md5sum.update(str)
  return md5sum.digest('hex')
}

class RethinkDBStore extends Store {
  client: rethink.RethinkClient

  constructor(options: RethinkDbStoreConfig) {
    super(options)
    this.client = rethink({
      silent: true,
      host: options.host || '127.0.0.1',
      port: options.port || 28015,
      db: options.db || 'haste',
      user: options.user || 'admin',
      password: options.password || ''
    })
  }

  set = (key: string, data: string, callback: Callback): void => {
    this.client
      .table('uploads')
      .insert({ id: md5(key), data })
      .run(error => {
        if (error) {
          callback(false)
          winston.error('failed to insert to table', error)
          return
        }
        callback(true)
      })
  }

  get = (key: string, callback: Callback): void => {
    this.client
      .table('uploads')
      .get(md5(key))
      .run((error, result) => {
        if (error || !result) {
          callback(false)
          if (error) winston.error('failed to insert to table', error)
          return
        }
        callback(result.data)
      })
  }
}

export default RethinkDBStore

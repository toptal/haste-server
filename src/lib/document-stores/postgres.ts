import * as winston from 'winston'
import { Pool, PoolClient } from 'pg'

import type { Callback, Store } from 'src/types/store'
import type { PostgresStoreConfig } from 'src/types/config'

type ConnectCallback = (
  error?: Error,
  client?: PoolClient,
  done?: () => void,
) => void

// A postgres document store
class PostgresDocumentStore implements Store {
  type: string

  expireJS?: number

  pool: Pool

  constructor(options: PostgresStoreConfig) {
    this.expireJS = options.expire
    this.type = options.type

    const connectionString = process.env.DATABASE_URL || options.connectionUrl
    this.pool = new Pool({ connectionString })
  }

  // A connection wrapper
  safeConnect = (callback: ConnectCallback) => {
    this.pool.connect((error: Error, client: PoolClient, done: () => void) => {
      if (error) {
        winston.error('error connecting to postgres', { error })
        callback(error)
      } else {
        callback(undefined, client, done)
      }
    })
  }

  // Get a given key's data
  get = (
    key: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    const now = Math.floor(new Date().getTime() / 1000)
    this.safeConnect((err, client, done): void => {
      if (err) {
        return callback(false)
      }

      return client?.query(
        'SELECT id,value,expiration from entries where KEY = $1 and (expiration IS NULL or expiration > $2)',
        [key, now],
        (error: Error, result) => {
          if (error) {
            winston.error('error retrieving value from postgres', {
              error,
            })
            return callback(false)
          }
          callback(result.rows.length ? result.rows[0].value : false)
          if (result.rows.length && this.expireJS && !skipExpire) {
            return client.query(
              'UPDATE entries SET expiration = $1 WHERE ID = $2',
              [this.expireJS + now, result.rows[0].id],
              (currentErr: Error) => {
                if (!currentErr) {
                  return done?.()
                }

                return callback(false)
              },
            )
          }

          return done?.()
        },
      )
    })
  }

  // Set a given key
  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    const now = Math.floor(new Date().getTime() / 1000)
    this.safeConnect((err, client, done) => {
      if (err) {
        return callback(false)
      }
      return client?.query(
        'INSERT INTO entries (key, value, expiration) VALUES ($1, $2, $3)',
        [key, data, this.expireJS && !skipExpire ? this.expireJS + now : null],
        (error: Error) => {
          if (error) {
            winston.error('error persisting value to postgres', { error })
            return callback(false)
          }
          callback(true)
          return done?.()
        },
      )
    })
  }
}

export default PostgresDocumentStore

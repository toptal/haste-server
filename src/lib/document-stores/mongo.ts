import * as winston from 'winston'
import mongodb = require('mongodb')

import type { Callback } from 'src/types/callback'
import type { MongoStoreConfig } from 'src/types/config'
import { Store } from '.'

const { MongoClient } = mongodb

type ConnectCallback = (error?: Error, db?: mongodb.MongoClient) => void

class MongoDocumentStore extends Store {
  connectionUrl: string

  constructor(options: MongoStoreConfig) {
    super(options)
    this.connectionUrl = process.env.DATABASE_URl || options.connectionUrl
  }

  safeConnect = (callback: ConnectCallback) => {
    MongoClient.connect(this.connectionUrl, (err, client) => {
      if (err) {
        winston.error('error connecting to mongodb', { error: err })
        callback(err)
      } else {
        callback(undefined, client)
      }
    })
  }

  get = (
    key: string,
    callback: Callback,
    skipExpire?: boolean | undefined
  ): void => {
    const now = Math.floor(new Date().getTime() / 1000)

    this.safeConnect((err, client) => {
      if (err) return callback(false)

      return client
        ?.db()
        .collection('entries')
        .findOne(
          {
            entry_id: key,
            $or: [{ expiration: -1 }, { expiration: { $gt: now } }]
          },
          (error?: Error, entry?) => {
            if (error) {
              winston.error('error persisting value to mongodb', { error })
              return callback(false)
            }

            callback(entry === null ? false : entry?.value)

            if (
              entry !== null &&
              entry?.expiration !== -1 &&
              this.expire &&
              !skipExpire
            ) {
              return client
                .db()
                .collection('entries')
                .update(
                  {
                    entry_id: key
                  },
                  {
                    $set: {
                      expiration: this.expire + now
                    }
                  },
                  {},
                  () => {}
                )
            }

            return true
          }
        )
    })
  }

  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean | undefined
  ): void => {
    const now = Math.floor(new Date().getTime() / 1000)

    this.safeConnect((err, client) => {
      if (err) return callback(false)

      return client
        ?.db()
        .collection('entries')
        .update(
          {
            entry_id: key,
            $or: [{ expiration: -1 }, { expiration: { $gt: now } }]
          },
          {
            entry_id: key,
            value: data,
            expiration: this.expire && !skipExpire ? this.expire + now : -1
          },
          {
            upsert: true
          },
          (error?: Error) => {
            if (error) {
              winston.error('error persisting value to mongodb', { error })
              return callback(false)
            }

            return callback(true)
          }
        )
    })
  }
}

export default MongoDocumentStore

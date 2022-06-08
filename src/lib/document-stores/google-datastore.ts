import Datastore = require('@google-cloud/datastore')
import * as winston from 'winston'

import type { Callback } from 'src/types/callback'
import type { GoogleStoreConfig } from 'src/types/config'
import { Store } from '.'

class GoogleDatastoreDocumentStore extends Store {
  kind: string

  datastore: Datastore

  // Create a new store with options
  constructor(options: GoogleStoreConfig) {
    super(options)
    this.kind = 'Haste'
    this.datastore = new Datastore()
  }

  // Save file in a key
  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean
  ) => {
    const expireTime =
      skipExpire || this.expire === undefined
        ? null
        : new Date(Date.now() + this.expire * 1000)

    const taskKey = this.datastore.key([this.kind, key])
    const task = {
      key: taskKey,
      data: [
        {
          name: 'value',
          value: data,
          excludeFromIndexes: true
        },
        {
          name: 'expiration',
          value: expireTime
        }
      ]
    }

    this.datastore
      .insert(task)
      .then(() => {
        callback(true)
      })
      .catch(() => {
        callback(false)
      })
  }

  // Get a file from a key
  get = (key: string, callback: Callback, skipExpire?: boolean): void => {
    const taskKey = this.datastore.key([this.kind, key])

    this.datastore
      .get(taskKey)
      .then(entity => {
        if (skipExpire || entity[0]?.expiration == null) {
          callback(entity[0].value)
        } else if (entity[0].expiration < new Date()) {
          winston.info('document expired', {
            key,
            expiration: entity[0].expiration,
            check: new Date()
          })
          callback(false)
        } else {
          // update expiry
          const task = {
            key: taskKey,
            data: [
              {
                name: 'value',
                value: entity[0]?.value,
                excludeFromIndexes: true
              },
              {
                name: 'expiration',
                value: new Date(
                  Date.now() + (this.expire ? this.expire * 1000 : 0)
                )
              }
            ]
          }
          this.datastore
            .update(task)
            .then(() => {})
            .catch(err => {
              winston.error('failed to update expiration', { error: err })
            })
          callback(entity[0]?.value)
        }
      })
      .catch(err => {
        winston.error('Error retrieving value from Google Datastore', {
          error: err
        })
        callback(false)
      })
  }
}

export default GoogleDatastoreDocumentStore

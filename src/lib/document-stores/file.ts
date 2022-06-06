import * as winston from 'winston'
import * as fs from 'fs'
import * as crypto from 'crypto'

import type { Callback, Store } from 'src/types/store'
import type { FileStoreConfig } from 'src/types/config'

// Generate md5 of a string
const md5 = (str: string) => {
  const md5sum = crypto.createHash('md5')
  md5sum.update(str)
  return md5sum.digest('hex')
}

// For storing in files
// options[type] = file
// options[path] - Where to store

class FileDocumentStore implements Store {
  type: string

  expire?: number | undefined

  basePath: string

  constructor(options: FileStoreConfig) {
    this.basePath = options.path || './data'
    this.expire = options.expire
    this.type = options.type
  }

  // Get data from a file from key
  get = (
    key: string,
    callback: Callback,
    skipExpire?: boolean | undefined
  ): void => {
    const fn = `${this.basePath}/${md5(key)}`
    fs.readFile(fn, 'utf8', (err, data) => {
      if (err) {
        callback(false)
      } else {
        callback(data)
        if (this.expire && !skipExpire) {
          winston.warn('file store cannot set expirations on keys')
        }
      }
    })
  }

  // Save data in a file, key as md5 - since we don't know what we could
  // be passed here
  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean | undefined
  ): void => {
    try {
      fs.mkdir(this.basePath, '700', () => {
        const fn = `${this.basePath}/${md5(key)}`
        fs.writeFile(fn, data, 'utf8', err => {
          if (err) {
            callback(false)
          } else {
            callback(true)
            if (this.expire && !skipExpire) {
              winston.warn('file store cannot set expirations on keys')
            }
          }
        })
      })
    } catch (err) {
      callback(false)
    }
  }
}

export default FileDocumentStore

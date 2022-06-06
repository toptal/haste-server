import * as winston from 'winston'
import AWS from 'aws-sdk'
import type { Callback, Store } from 'src/types/store'
import type { AmazonStoreConfig } from 'src/types/config'

class AmazonS3DocumentStore implements Store {
  bucket: string | undefined

  client: AWS.S3

  type: string

  expire?: number | undefined

  constructor(options: AmazonStoreConfig) {
    this.expire = options.expire
    this.bucket = options.bucket
    this.type = options.type
    this.client = new AWS.S3({ region: options.region })
  }

  get = (
    key: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    if (!this.bucket) {
      callback(false)
      return
    }

    const req = {
      Bucket: this.bucket,
      Key: key,
    }

    this.client.getObject(req, (err, data) => {
      if (err || !data.Body) {
        callback(false)
      } else {
        callback(data.Body.toString('utf-8'))
        if (this.expire && !skipExpire) {
          winston.warn('amazon s3 store cannot set expirations on keys')
        }
      }
    })
  }

  set = (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean | undefined,
  ): void => {
    if (!this.bucket) {
      callback(false)
      return
    }

    const req = {
      Bucket: this.bucket,
      Key: key,
      Body: data as AWS.S3.PutObjectOutput,
      ContentType: 'text/plain',
    }

    this.client.putObject(req, err => {
      if (err) {
        callback(false)
      } else {
        callback(true)
        if (this.expire && !skipExpire) {
          winston.warn('amazon s3 store cannot set expirations on keys')
        }
      }
    })
  }
}

export default AmazonS3DocumentStore

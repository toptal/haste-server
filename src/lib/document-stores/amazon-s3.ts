import * as winston from 'winston'
import AWS = require('aws-sdk')
import type { AmazonStoreConfig } from 'src/types/config'
import { Callback } from 'src/types/callback'
import { Store } from '.'

class AmazonS3DocumentStore extends Store {
  bucket: string | undefined

  client: AWS.S3

  constructor(options: AmazonStoreConfig) {
    super(options)
    this.bucket = options.bucket
    this.client = new AWS.S3({ region: options.region })
  }

  get = (
    key: string,
    callback: Callback,
    skipExpire?: boolean | undefined
  ): void => {
    if (!this.bucket) {
      callback(false)
      return
    }

    const req = {
      Bucket: this.bucket,
      Key: key
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
    skipExpire?: boolean | undefined
  ): void => {
    if (!this.bucket) {
      callback(false)
      return
    }

    const req = {
      Bucket: this.bucket,
      Key: key,
      Body: data as AWS.S3.PutObjectOutput,
      ContentType: 'text/plain'
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

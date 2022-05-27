import { Request, Response } from 'express'
import * as winston from 'winston'
import Busboy from 'busboy'
import type { Config } from '../../types/config'
import type { Store } from '../../types/store'
import type { KeyGenerator } from '../../types/key-generator'
import type { Document } from '../../types/document'

const defaultKeyLength = 10

class DocumentHandler {
  keyLength: number

  maxLength: number

  public store: Store

  keyGenerator: KeyGenerator

  config: Config

  constructor(options: Document) {
    this.keyLength = options.keyLength || defaultKeyLength
    this.maxLength = options.maxLength // none by default
    this.store = options.store
    this.config = options.config
    this.keyGenerator = options.keyGenerator
  }

  public handleGet(request: Request, response: Response) {
    const key = request.params.id.split('.')[0]
    const skipExpire = !!this.config.documents[key]

    this.store.get(
      key,
      ret => {
        if (ret) {
          winston.verbose('retrieved document', { key })
          response.writeHead(200, { 'content-type': 'application/json' })
          if (request.method === 'HEAD') {
            response.end()
          } else {
            response.end(JSON.stringify({ data: ret, key }))
          }
        } else {
          winston.warn('document not found', { key })
          response.writeHead(404, { 'content-type': 'application/json' })
          if (request.method === 'HEAD') {
            response.end()
          } else {
            response.end(JSON.stringify({ message: 'Document not found.' }))
          }
        }
      },
      skipExpire,
    )
  }

  public handlePost(request: Request, response: Response) {
    // const this = this
    let buffer = ''
    let cancelled = false

    // What to do when done
    const onSuccess = () => {
      // Check length
      if (this.maxLength && buffer.length > this.maxLength) {
        cancelled = true
        winston.warn('document >maxLength', { maxLength: this.maxLength })
        response.writeHead(400, { 'content-type': 'application/json' })
        response.end(
          JSON.stringify({ message: 'Document exceeds maximum length.' }),
        )
        return
      }
      // And then save if we should
      this.chooseKey(key => {
        this.store.set(key, buffer, res => {
          if (res) {
            winston.verbose('added document', { key })
            response.writeHead(200, { 'content-type': 'application/json' })
            response.end(JSON.stringify({ key }))
          } else {
            winston.verbose('error adding document')
            response.writeHead(500, { 'content-type': 'application/json' })
            response.end(JSON.stringify({ message: 'Error adding document.' }))
          }
        })
      })
    }

    // If we should, parse a form to grab the data
    const ct = request.headers['content-type']
    if (ct && ct.split(';')[0] === 'multipart/form-data') {
      const busboy = Busboy({ headers: request.headers })
      busboy.on('field', (fieldname, val) => {
        if (fieldname === 'data') {
          buffer = val
        }
      })
      busboy.on('finish', () => {
        onSuccess()
      })
      request.pipe(busboy)
      // Otherwise, use our own and just grab flat data from POST body
    } else {
      request.on('data', data => {
        buffer += data.toString()
      })
      request.on('end', () => {
        if (cancelled) {
          return
        }
        onSuccess()
      })
      request.on('error', error => {
        winston.error(`connection error: ${error.message}`)
        response.writeHead(500, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ message: 'Connection error.' }))
        cancelled = true
      })
    }
  }

  public handleRawGet(request: Request, response: Response) {
    const key = request.params.id.split('.')[0]
    const skipExpire = !!this.config.documents[key]

    this.store.get(
      key,
      ret => {
        if (ret) {
          winston.verbose('retrieved raw document', { key })
          response.writeHead(200, {
            'content-type': 'text/plain; charset=UTF-8',
          })
          if (request.method === 'HEAD') {
            response.end()
          } else {
            response.end(ret)
          }
        } else {
          winston.warn('raw document not found', { key })
          response.writeHead(404, { 'content-type': 'application/json' })
          if (request.method === 'HEAD') {
            response.end()
          } else {
            response.end(JSON.stringify({ message: 'Document not found.' }))
          }
        }
      },
      skipExpire,
    )
  }

  chooseKey = (callback: { (key: string): void }) => {
    const key = this.acceptableKey()

    if (!key) return

    this.store.get(
      key,
      (ret: string | boolean) => {
        if (ret) {
          this.chooseKey(callback)
        } else {
          callback(key)
        }
      },
      true,
    ) // Don't bump expirations when key searching
  }

  acceptableKey = () => this.keyGenerator.createKey?.(this.keyLength)
}

export default DocumentHandler

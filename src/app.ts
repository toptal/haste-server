import express, { Router, Express, Request } from 'express'
import * as fs from 'fs'
import * as winston from 'winston'
import uglify from 'uglify-js'
import connectSt from 'st'
import connectRateLimit from 'connect-ratelimit'
import getConfig from './lib/helpers/config'
import addLogging from './lib/helpers/log'
import build from './lib/document-handler/builder'
import DocumentHandler from './lib/document-handler'
import { Config } from './types/config'
import {
  getStaticDirectory,
  getStaticItemDirectory,
} from './lib/helpers/directory'

class App {
  public server: Express

  public config: Config

  documentHandler?: DocumentHandler

  constructor() {
    this.config = getConfig()
    this.server = express()
    this.setLogging()
    this.setDocumentHandler()
    this.compressStaticAssets()
    this.sendDocumentsToStore()
    this.middlewares()
    this.setRateLimits()
    this.apiCalls()
    this.staticPages()
  }

  middlewares() {
    this.server.use(express.json())
  }

  setLogging() {
    if (this.config.logging) {
      addLogging(this.config)
    }
  }

  setDocumentHandler = async () => {
    this.documentHandler = await build(this.config)
  }

  apiCalls() {
    const router = Router()

    // get raw documents - support getting with extension
    router.get('/raw/:id', async (request, response) =>
      this.documentHandler?.handleRawGet(request, response),
    )

    router.head('/raw/:id', (request, response) =>
      this.documentHandler?.handleRawGet(request, response),
    )

    // // add documents
    router.post('/documents', (request, response) =>
      this.documentHandler?.handlePost(request, response),
    )

    // get documents
    router.get('/documents/:id', (request, response) =>
      this.documentHandler?.handleGet(request, response),
    )

    router.head('/documents/:id', (request, response) =>
      this.documentHandler?.handleGet(request, response),
    )

    this.server.use(router)
  }

  setRateLimits() {
    if (this.config.rateLimits) {
      this.config.rateLimits.end = true
      this.server.use(connectRateLimit(this.config.rateLimits))
    }
  }

  compressStaticAssets() {
    // Compress the static javascript assets
    if (this.config.recompressStaticAssets) {
      const list = fs.readdirSync(getStaticDirectory(__dirname))
      for (let j = 0; j < list.length; j += 1) {
        const item = list[j]
        if (
          item.indexOf('.js') === item.length - 3 &&
          item.indexOf('.min.js') === -1
        ) {
          const dest = `${item.substring(
            0,
            item.length - 3,
          )}.min${item.substring(item.length - 3)}`
          const origCode = fs.readFileSync(
            getStaticItemDirectory(__dirname, item),
            'utf8',
          )

          fs.writeFileSync(
            getStaticItemDirectory(__dirname, dest),
            uglify.minify(origCode).code,
            'utf8',
          )
          winston.info(`compressed ${item} into ${dest}`)
        }
      }
    }
  }

  sendDocumentsToStore() {
    // Send the static documents into the preferred store, skipping expirations
    let documentPath
    let data

    Object.keys(this.config.documents).forEach(name => {
      documentPath = this.config.documents[name]
      data = fs.readFileSync(documentPath, 'utf8')
      winston.info('loading static document', { name, path: documentPath })

      if (data) {
        this.documentHandler?.store.set(
          name,
          data,
          cb => {
            winston.debug('loaded static document', { success: cb })
          },
          true,
        )
      } else {
        winston.warn('failed to load static document', {
          name,
          path: documentPath,
        })
      }
    })
  }

  staticPages() {

    // Otherwise, try to match static files
    this.server.use(
      connectSt({
        path: getStaticDirectory(__dirname),
        content: { maxAge: this.config.staticMaxAge },
        passthrough: true,
        index: false,
      }),
    )

    // Then we can loop back - and everything else should be a token,
    // so route it back to /
    this.server.get('/:id', (request: Request, response, next) => {
      request.sturl = '/'
      next()
    })

    // And match index
    this.server.use(
      connectSt({
        path: getStaticDirectory(__dirname),
        content: { maxAge: this.config.staticMaxAge },
        index: 'index.html',
      }),
    )
  }
}

export default App

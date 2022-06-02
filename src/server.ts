import express, { Express, Request } from 'express'
import * as fs from 'fs'
import * as winston from 'winston'
import uglify from 'uglify-js'
import connectSt from 'st'
import connectRateLimit from 'connect-ratelimit'
import getConfig from './lib/helpers/config'
import addLogging from './lib/helpers/log'
import buildDocumenthandler from './lib/document-handler/builder'
import DocumentHandler from './lib/document-handler'
import { Config } from './types/config'
import {
  getStaticDirectory,
  getStaticItemDirectory,
} from './lib/helpers/directory'

const config: Config = getConfig()

if (config.logging) {
  addLogging(config)
}

buildDocumenthandler(config).then((documentHandler: DocumentHandler) => {
  // Compress the static javascript assets
  if (config.recompressStaticAssets) {
    const list = fs.readdirSync(getStaticDirectory(__dirname))
    for (let j = 0; j < list.length; j += 1) {
      const item = list[j]
      if (
        item.indexOf('.js') === item.length - 3 &&
        item.indexOf('.min.js') === -1
      ) {
        const dest = `${item.substring(0, item.length - 3)}.min${item.substring(
          item.length - 3,
        )}`
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

  // Send the static documents into the preferred store, skipping expirations
  let documentPath
  let data

  Object.keys(config.documents).forEach(name => {
    documentPath = config.documents[name]
    data = fs.readFileSync(documentPath, 'utf8')
    winston.info('loading static document', { name, path: documentPath })

    if (data) {
      documentHandler.store?.set(
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

  const app: Express = express()

  // Rate limit all requests
  if (config.rateLimits) {
    config.rateLimits.end = true
    app.use(connectRateLimit(config.rateLimits))
  }

  // get raw documents - support getting with extension
  app.get('/raw/:id', async (request, response) =>
    documentHandler.handleRawGet(request, response),
  )

  app.head('/raw/:id', (request, response) =>
    documentHandler.handleRawGet(request, response),
  )

  // // add documents
  app.post('/documents', (request, response) =>
    documentHandler.handlePost(request, response),
  )

  // get documents
  app.get('/documents/:id', (request, response) =>
    documentHandler.handleGet(request, response),
  )

  app.head('/documents/:id', (request, response) =>
    documentHandler.handleGet(request, response),
  )

  // Otherwise, try to match static files
  app.use(
    connectSt({
      path: getStaticDirectory(__dirname),
      content: { maxAge: config.staticMaxAge },
      passthrough: true,
      index: false,
    }),
  )

  // Then we can loop back - and everything else should be a token,
  // so route it back to /
  app.get('/:id', (request: Request, response, next) => {
    request.sturl = '/'
    next()
  })

  // And match index
  app.use(
    connectSt({
      path: getStaticDirectory(__dirname),
      content: { maxAge: config.staticMaxAge },
      index: 'index.html',
    }),
  )

  app.listen(config.port, config.host, () => {
    winston.info(`listening on ${config.host}:${config.port}`)
  })
})

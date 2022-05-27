import winston = require('winston')
import App from './app'

const { server, config } = new App()

server.listen(config.port, config.host, () => {
  winston.info(`listening on ${config.host}:${config.port}`)
})

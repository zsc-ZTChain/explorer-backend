'use strict'
const express = require('express')
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('config')
const Redis = require('ioredis')
const {errors} = require('celebrate')

const app = express()
app.set('trust proxy', ['loopback', 'uniquelocal'])

if (app.get('env') === 'development') {
  app.use(logger('dev'))
} else {
  app.use(logger('combined'))
}
const session = require('express-session')
const redisStore = require('connect-redis')(session)
const redisConfig = config.get('redis')
const sessionConfig = config.get('session')

app.use(cookieParser(sessionConfig.secret))

const client = new Redis(redisConfig)
app.use(session(
  Object.assign({
    store: new redisStore(Object.assign(
      {client}, redisConfig
      )
    )},
    sessionConfig,
  )
))

// if (app.get('env') === 'development') {
//   app.use(cors())
// }

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(require('./module/middlewares').centerMiddleware)

app.use('/', require('./routes/index'))

require('express-simple-route')(path.join(__dirname, 'routes'), app, '/api')

app.use(express.static(path.join(__dirname, 'public')))

if (app.get('env') === 'development') {
  app.use('/apidoc', express.static(path.join(__dirname, 'apidoc')))
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404)
    .json({
      message: 'not found',
    })
})

const exporterService = require('./services/syncBlock.js');
setTimeout(function() { exporterService(); }, 5000);
require('./services/jobs.js');
// error handler
app.use(errors())
if (app.get('env') !== 'production') {
  app.use((err, req, res, next) => {
    if (!err.status) {
      err.status = 500
    }
    if (err.status === 500) {
      req.logger.fatal({err})
    }
    if (res.headersSent) return
    res.status(err.status)
      .json({
        message: err.message,
        err: {
          code: err.code,
          status: err.status,
          ...err.data,
        },
      })
  })
} else {
  app.use((err, req, res, next) => {
    if (!err.status) {
      err.status = 500
    }
    if (err.status === 500) {
      req.logger.fatal({err})
    }
    if (res.headersSent) return
    res.status(err.status)
      .json({
        message: err.message,
        err: {
          code: err.code, ...err.data
        },
      })
  })
}

module.exports = app

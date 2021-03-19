'use strict';
const bunyanPrettyStream = require('bunyan-prettystream')

const prettyStream = new bunyanPrettyStream()
prettyStream.pipe(process.stdout)

const streams = [{
  type: 'raw',
  stream: prettyStream,
}, {
  level: 'fatal',
  stream: process.stderr,
}]

const Loggers = {
  service: {
    middleware: {
      name: 'explorer',
      level: 'debug',
      streams,
    },
    timeTask: {
      name: 'timeTaskService',
      level: 'debug',
      streams,
    },
    push: {
      name: 'service',
      service: 'push',
      level: 'info',
      streams: [{
        type: 'raw',
        stream: prettyStream,
      }],
    },
  }
}

module.exports = function getLogger(name) {
  const defaultLogger = {
    name,
    level: 'debug',
    streams,
  }

  let loggers = Loggers
  const steps = name.split('.')
  for (const step of steps) {
    if (step in loggers) {
      loggers = loggers[step]
    } else {
      return defaultLogger
    }
  }
  return loggers
}
// module.exports = function getLogLevel(identity) {
//   return {
//     name: identity,
//     level: 'info',
//     streams: [{
//       type: 'raw',
//       stream: prettyStream,
//     }],
//   }
// }

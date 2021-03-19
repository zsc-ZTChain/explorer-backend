import * as bunyan from 'bunyan'
import * as SocketIO from 'socket.io'
import push from '../socket/push'

const server = SocketIO({
  serveClient: false,
  cookie: true,
})

export default server

push(server)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line
    interface Process {
      on(event: 'stop-server', listener: () => void)

      emit(event: 'stop-server')
    }
  }
}

declare module 'socket.io' {
  // eslint-disable-next-line
  interface Socket {
    logger: bunyan
  }
}

async function aboutExit() {
  process.emit('stop-server')
  server.close(() => {
    process.exit()
  })
}

process.on('uncaughtException', aboutExit)
process.on('unhandledRejection', aboutExit)
process.on('SIGTERM', aboutExit)
process.on('SIGINT', aboutExit)

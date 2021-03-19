import * as SocketIO from 'socket.io'
import * as loggerConfig from '../module/logger'
import {createLogger} from 'bunyan'
import {TransactionModel} from '../model/transaction'
import {BlockModel} from '../model/block'

const Logger = createLogger({
  ...loggerConfig('service.push'),
  namespace: '/push',
} as any)

let nsp: SocketIO.Namespace
export default function (server: SocketIO.Server) {
  nsp = server.of('/push')

  nsp.on('connection', async (socket: SocketIO.Socket) => {
    socket.emit('hello', {message: 'hello'})
    socket.on('disconnect', async (reason: string) => {
      Logger.error('disconnect', {reason})
    })
  })
}

export function blockBroadcast(insertBlock) {
  insertBlock.difficulty = (insertBlock.difficulty).toString()
  nsp.emit('block', insertBlock)
}

export async function transBroadcast(data) {
  const totalCount = await TransactionModel.count()
  const insertTrans = []
  for (const item of data) {
    const block = await BlockModel.findOne({where: {number: item.blockNumber}, raw: true})
    if (block) {
      item['timestamp'] = block.timestamp
    }
    insertTrans.push(item)
  }
  nsp.emit('transaction', {insertTrans, totalCount})
}


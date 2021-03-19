import * as web3 from '../lib/web3'
import {ContractService} from './contract'
import {BlockService} from './block'
// eslint-disable-next-line
// @ts-ignore
import {EventLog} from '@types/web3/types'
import {createHttpError} from '../error/errors'
import {arrCompare, pagination} from '../helper/functions'

interface IEventExtension extends EventLog{
  timestamp?: number
}
interface IEventParam {
  address: string
  pageSize?: number
  pageNumber?: number
  event: string
  transactionHash?: string
}
export class EventService {
  public static async getEventsByAddress({
    address, pageSize, pageNumber,
    event = 'allEvents',
    transactionHash,
  }: IEventParam): Promise<IEventExtension[] | {events: IEventExtension[] ; count: number}> {
    const contract = await ContractService.getByAddress(address)
    if (contract.verifiedStatus === 0) {
      throw createHttpError({status: 200, message: 'You need to verify the contract first', code: 40003})
    }
    const myContract = new web3.eth.Contract(JSON.parse(contract.abi), address)
    let events: Array<EventLog>
    try {
      events = await myContract.getPastEvents(event, {fromBlock: 0})
    } catch (e) {
      throw createHttpError({status: 200, message: e.message, code: 40005})
    }
    let eventExtension: Array<IEventExtension> = []
    for (const event of events) {
      const block = await BlockService.getBlockByNumber(event.blockNumber)
      event['timestamp'] = block.timestamp
      for (const index in event.returnValues) {
        if (/^\d+$/.test(index)) {
          delete event.returnValues[`${index}`]
        }
      }
    }
    if (transactionHash) {
      eventExtension = events.filter((item) => item.transactionHash === transactionHash)
      return {events: pagination(Number(pageSize), Number(pageNumber), eventExtension), count: eventExtension.length}
    }
    events.sort(arrCompare('timestamp'))

    if (pageSize) {
      return {events: pagination(Number(pageSize), Number(pageNumber), events), count: events.length}
    }
    return events
  }

  public static async sendEventsByAddress(address: string, methodName: string, params: Array<{}> = []) {
    const contract = await ContractService.getByAddress(address)
    try {
      const myContract = new web3.eth.Contract(JSON.parse(contract.abi), address)
      const result = await myContract.methods[methodName](...params).call()
      if (typeof result === 'object') {
        for (const index in result) {
          if (/^\d+$/.test(index)) {
            delete result[`${index}`]
          }
        }
      }
      return result
    } catch (e) {
      throw createHttpError({status: 200, message: 'call failed', code: 40001}, {...e})
    }
  }
}

import {UncleBlockModel} from '../model/uncle'
import {bufferFormatter} from '../utils/bufferformatter'
import {dbPool} from '../lib/db'
import * as Bluebird from 'bluebird'

export class UncleService {
  public static async getListByPage(pageSize = 10, pageNumber = 1):
  Promise<{uncles: UncleBlockModel[]; count: number}> {
    const blockParams: Record<string, any> = {
      order: [
        ['number', 'DESC'],
      ],
      offset: Number((pageNumber - 1) * pageSize),
      limit: Number(pageSize),
      raw: true,
    }
    const [data, count] = await Bluebird.all([
      UncleBlockModel.findAll(blockParams),
      UncleBlockModel.count(),
    ])
    if (!data) return
    const uncles = data.map((item) => {
      return this.uncleFormatter(item)
    })
    return {uncles, count}
  }

  public static async getUncleByParamter(param): Promise<UncleBlockModel> {
    let uncles: UncleBlockModel[]
    if (param.startsWith('0x')) {
      uncles = await dbPool.query(`select * from t_uncles where hash=${Buffer.from(param).toString('binary')}`, {
        replacements: [],
        type: 'SELECT',
      })
    } else {
      uncles = await dbPool.query('select * from t_uncles where number=?', {
        replacements: [param],
        type: 'SELECT',
      })
    }
    return this.uncleFormatter(uncles[0])
  }

  public static async getUncleCountByMiner(account: string): Promise<number> {
    const counts = await dbPool.query(`select count(1) count from t_uncles 
    where miner = ${Buffer.from(account).toString('binary')}`, {
      replacements: [],
      type: 'SELECT',
    })
    return counts[0].count
  }

  public static async getUnclesByMiner(account: string, pageNumber = 1, pageSize = 10):
  Promise<{uncles: UncleBlockModel[]; count: number}> {
    const offset = (pageNumber - 1) * pageSize
    const data = await dbPool.query(`select number, difficulty, gasUsed, 
    timestamp, hash, blockNumber, reward
       from t_uncles
       where miner = ${Buffer.from(account).toString('binary')}
       order by number desc limit ? , ?`, {
      replacements: [Number(offset), Number(pageSize)],
      type: 'SELECT',
    })
    const uncles = data.map((item) => {
      return this.uncleFormatter(item)
    })
    const count = await this.getUncleCountByMiner(account)
    return {uncles, count}
  }

  public static async getListByBlockNumber(blockNumber: number, pageSize = 10, pageNumber = 1):
  Promise<{uncles: UncleBlockModel[]; count: number}> {
    const blockParams: Record<string, any> = {
      where: {
        blockNumber,
      },
      order: [
        ['number', 'DESC'],
      ],
      offset: Number((pageNumber - 1) * pageSize),
      limit: Number(pageSize),
      raw: true,
    }
    const [data, count] = await Bluebird.all([
      UncleBlockModel.findAll(blockParams),
      UncleBlockModel.count({where: {blockNumber}}),
    ])
    if (!data) return
    const uncles = data.map((item) => {
      return this.uncleFormatter(item)
    })
    return {uncles, count}
  }


  public static uncleFormatter(item) {
    return {...item, extraData: bufferFormatter(item.extraData),
      difficulty: item.difficulty.toString(),
      hash: bufferFormatter(item.hash),
      logsBloom: bufferFormatter(item.logsBloom),
      miner: bufferFormatter(item.miner),
      mixHash: bufferFormatter(item.mixHash),
      nonce: bufferFormatter(item.nonce),
      parentHash: bufferFormatter(item.parentHash),
      receiptsRoot: bufferFormatter(item.receiptsRoot),
      sha3Uncles: bufferFormatter(item.sha3Uncles),
      stateRoot: bufferFormatter(item.stateRoot),
      transactionsRoot: bufferFormatter(item.transactionsRoot)}
  }
}

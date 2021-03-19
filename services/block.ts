import {BlockModel} from '../model/block'
import {bufferFormatter} from '../utils/bufferformatter'
import * as web3 from '../lib/web3'
import {dbPool} from '../lib/db'
import * as Bluebird from 'bluebird'
import {TransactionModel} from '../model/transaction'
import {BlockChartModel} from '../model/blockChart'

export class BlockService {
  public static async getFistPage(): Promise<BlockModel[]> {
    const blockParams: Record<string, any> = {
      order: [
        ['number', 'DESC'],
      ],
      offset: 0,
      limit: 10,
      raw: true,
    }
    const data = await BlockModel.findAll(blockParams)
    return data.map((item) => {
      return this.blockFormatter(item)
    })
  }

  public static async getListByPage(pageSize = 10, pageNumber = 1): Promise<{blocks: BlockModel[]; count: number}> {
    const blockParams: Record<string, any> = {
      order: [
        ['number', 'DESC'],
      ],
      offset: Number((pageNumber - 1) * pageSize),
      limit: Number(pageSize),
      raw: true,
    }
    const data = await BlockModel.findAll(blockParams)
    if (!data) return
    const count = await BlockModel.count()
    const blocks = await Bluebird.all(data.map(async (item) => {
      item['txn'] = await TransactionModel.count({where: {blockNumber: item.number}})
      const transParam: Record<string, any> = {
        where: {blockNumber: item.number},
        attributes: ['gasPrice'],
        raw: true,
      }
      const trans = await TransactionModel.findAll(transParam)
      if (item['txn'] !== 0) {
        const sum = trans.reduce((accumulator, currentValue) =>  accumulator + Number(
          web3.utils.fromWei(String(currentValue.gasPrice), 'Gwei')
        ), 0)
        item['avgGasPrice'] = (sum / item['txn']).toFixed(2)
      } else {
        item['avgGasPrice'] = 0
      }
      return this.blockFormatter(item)
    }))

    return {blocks, count}
  }

  public static async getblockbyParamter(param): Promise<BlockModel | any> {
    let blocks: BlockModel[]
    if (param.startsWith('0x')) {
      blocks = await dbPool.query(`
        select * from t_blocks 
        where hash=${Buffer.from(param).toString('binary')}
      `, {
        replacements: [],
        type: 'SELECT',
      })
    } else {
      blocks = await dbPool.query('select * from t_blocks where number=?', {
        replacements: [param],
        type: 'SELECT',
      })
    }

    let block: Partial<BlockModel> = blocks[0]
    if (Number(param) === 0) {
      block = await web3.eth.getBlock(0, false)
    }

    const uncles = await dbPool.query('select reward from t_uncles where blockNumber=? ', {
      replacements: [block.number],
      type: 'SELECT',
    })
    let blockReward = 0

    uncles.forEach((uncle) => {
      blockReward += uncle.reward
    })

    block.difficulty = block.difficulty.toString()
    block['txn'] = await TransactionModel.count({where: {blockNumber: block.number}})
    const blockFormatter = this.blockFormatter(block)
    return {block: blockFormatter, uncles, uncleReward: blockReward}
  }

  public static async getBlockCountByMiner(account: string): Promise<number> {
    const counts = await dbPool.query(`select count(1) count from t_blocks 
    where miner = ${Buffer.from(account).toString('binary')}`, {
      replacements: [],
      type: 'SELECT',
    })
    return counts[0].count
  }

  public static async getBlocksByMiner(account: string, pageNumber = 1, pageSize = 10):
  Promise<{blocks: BlockModel[] | any[]; count: number}> {
    const offset = (pageNumber - 1) * pageSize
    const data = await dbPool.query(`select number, difficulty, gasUsed, 
    timestamp, unclesCount, uncleInclusionRewards, txnFees, minerReward, foundation
       from t_blocks 
       where miner = ${Buffer.from(account).toString('binary')} 
       order by number desc limit ? , ?`, {
      replacements: [Number(offset), Number(pageSize)],
      type: 'SELECT',
    })
    const blocks = await Bluebird.all(data.map(async (item) => {
      item['txn'] = await TransactionModel.count({where: {blockNumber: item.number}})
      const transParam: Record<string, any> = {
        where: {blockNumber: item.number},
        attributes: ['gasPrice'],
        raw: true,
      }
      const trans = await TransactionModel.findAll(transParam)
      if (item['txn'] !== 0) {
        const sum = trans.reduce((accumulator, currentValue) =>  accumulator + Number(
          web3.utils.fromWei(String(currentValue.gasPrice), 'Gwei')
        ), 0)
        item['avgGasPrice'] = (sum / item['txn']).toFixed(2)
      } else {
        item['avgGasPrice'] = 0
      }
      return this.blockFormatter(item)
    }))
    const count = await this.getBlockCountByMiner(account)
    return {blocks, count}
  }

  public static async getBlockByNumber(number: number): Promise<Partial<BlockModel>> {
    const blocks = await dbPool.query('select * from blocks where number=?', {
      replacements: [number],
      type: 'SELECT',
    })
    return blocks[0]
  }


  /* eslint-disable */
  public static async countBlockChart() {
    await dbPool.query(
      `
    replace into t_blocks_chart
    select
      @difficulty:=round(avg(\`difficulty\`)) as difficulty,
      round(avg(\`size\`)) as size,
      count(1) as blockCount,
      @avgTime:=round((max(\`timestamp\`)-min(\`timestamp\`))/count(1),2) as avgTime,
      sum(txCount) txCount,
      sum(uncleCount) uncleCount,
      round(round(avg(\`difficulty\`))/round((max(\`timestamp\`)-min(\`timestamp\`))/count(1),2)) as avgHashrate,
      IFNULL(sum(fee),0) txFee,
      concat(year(from_unixtime(\`timestamp\`)),'-',LPAD(month(from_unixtime(\`timestamp\`)),2,0),'-',LPAD(day(from_unixtime(\`timestamp\`)),2,0)) as date
    from blocks as b 
      left join (
        select count(1) txCount,blockNumber,round(sum(gasUsed*(gasPrice/power(10,18))),6) fee from transactions group by blockNumber
      ) as tx 
      on b.number = tx.blockNumber 
      left join (
        select count(1) uncleCount,blockNumber from t_uncles group by blockNumber
      ) as u
    on b.number = u.blockNumber
    group by date
    having avgTime > 0
    `,
      {
        replacements: [],
        type: "INSERT",
      }
    );
  }
  /* eslint-enable */

  public static async getChartData() {
    return BlockChartModel.findAll({
      order: [
        ['date', 'ASC'],
      ],
    })
  }

  public static blockFormatter(item) {
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
      totalDifficulty: bufferFormatter(item.totalDifficulty),
      stateRoot: bufferFormatter(item.stateRoot),
      transactionsRoot: bufferFormatter(item.transactionsRoot)}
  }
}


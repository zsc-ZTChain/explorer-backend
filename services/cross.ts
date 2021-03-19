import {CrossEventModel} from '../model/cross'
import {dbPool} from '../lib/db'
import * as web3 from '../lib/web3'
import * as Bluebird from 'bluebird'
import  * as axios from 'axios'
import * as config from 'config'
const web3Config = config.get('web3')

export class CrossService {
  public static async getList() {
    return CrossEventModel.findAll()
  }

  public static async getCrossMakerList(address, pageSize = 10, pageNumber = 1) {
    const count = await dbPool.query(`
      select count(1) count from(
      select event,transactionHash,remoteChainId,\`from\`,blockNumber,
        case 
        when event = 'MakerTx' 
        then (select \`to\` from t_cross_events where t.txId=txId and \`event\` = 'MakerFinish')
        else \`to\` 
        end 
        \`to\`,\`value\`,\`destValue\`, \`data\`, (select timestamp from t_blocks where number=t.blockNumber) timestamp 
      from t_cross_events t) t 
    where (event='MakerTx' or event='TakerTx') and (\`to\` is not null)
    and (\`from\`=? or \`to\` =?)
    `, {
      replacements: [address.toLowerCase(), address.toLowerCase()],
      type: 'SELECT',
    })
    const rows = await dbPool.query(`
    select * from(
      select event,transactionHash,remoteChainId,\`from\`,blockNumber,
        case 
        when event = 'MakerTx' 
        then (select \`to\` from t_cross_events where t.txId=txId and \`event\` = 'MakerFinish')
        else \`to\` 
        end 
        \`to\`,\`value\`,\`destValue\`, \`data\`, (select timestamp from t_blocks where number=t.blockNumber) timestamp 
      from t_cross_events t) t 
    where (event='MakerTx' or event='TakerTx') and (\`to\` is not null)
    and (\`from\`=? or \`to\` =?)
    order by blockNumber desc limit ? , ?
    `, {
      replacements: [
        address.toLowerCase(),
        address.toLowerCase(),
        Number((pageNumber - 1) * pageSize),
        Number(pageSize),
      ],
      type: 'SELECT',
    })
    const chainId = await web3.eth.net.getId()

    let setCount = count[0].count
    const setRows = await Bluebird.all(rows.map(async (item) => {
      item['chainId'] = chainId
      if (item.from === item.to) {
        item['isRevoked'] = true
      } else {
        item['isRevoked'] = false
      }
      const isFinish = (await this.getCtxQuery(item.transactionHash)).result
      if (!isFinish) {
        return item
      }
      setCount -= 1
    }))

    return {count: setCount, rows: setRows}
  }
  /* eslint-disable */
  public static async getCrossDetail(txHash)  {
    const crossEvent = await dbPool.query(`
     select event,transactionHash,remoteChainId,\`from\`,
      case
      when event = 'MakerTx' 
      then (select \`to\` from t_cross_events where t.txId=txId and \`event\` = 'MakerFinish')
      else \`to\` 
      end \`to\`,
      case
      when event = 'MakerTx' 
      then (select \`timestamp\` from t_blocks where number=(select blockNumber from t_cross_events where t.txId=txId and \`event\` = 'MakerFinish'))
      else null
      end makerFinishTime, 
    \`value\`,\`destValue\`, \`data\`, \`input\`, (select timestamp from t_blocks where number=t.blockNumber) timestamp
    from t_cross_events t
    where transactionHash = ?
    `, {
      replacements: [txHash],
      type: 'SELECT',
    })
    const tx = await dbPool.query(`select blockNumber,gas,gasUsed,gasPrice,status from t_transactions where hash=${Buffer.from(txHash).toString('binary')}`, {
      replacements: [],
      type: 'SELECT',
    })
    /* eslint-disable */

    const chainId = await web3.eth.net.getId()
    const cross = crossEvent[0]
    cross['chainId'] = chainId
    if (cross.from === cross.to) {
      cross['isRevoked'] = true
    } else {
      cross['isRevoked'] = false
    }
    return {cross, tx: tx[0]}
  }

  public static async getCtxQuery(txHash) {
    const maker = await axios.default({method: 'GET',
      url: web3Config.gethServer,
      data: {id: 1, method: 'eth_ctxQuery', jsonrpc: '2.0', params: [txHash]}})
    return maker.data
  }
}

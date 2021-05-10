import { TransactionService } from "./transaction";

const web3 = require('../lib/web3');
const { dbPool, redis } = require('../lib/db');
const Sequelize = require("sequelize");
const config = require('config')
const tokenConfig = config.get('token')
const amqpConfig = config.get('amqp')

const { sendMessage } = require("../mq/sender");

let syncReceipt = async () => {
  try {
    const curBlockNumber = await redis.get('curBlockNumber');
    if (!curBlockNumber) {
      const startBlock = await dbPool.query(`select blockNumber from transactions order by blockNumber desc limt 1`);
      const nowBlock = web3.eth.getBlockNumber();
      await redis.set('curBlockNumber', startBlock || nowBlock);
    }
    const result = await dbPool.query(`select cast(hash as CHAR) hash,blockNumber,\`from\`,\`to\`,cast(\`value\` as char) 
    value from transactions where blockNumber between ${curBlockNumber} and ${curBlockNumber + 20} order by blockNumber`);

    for (let i = 0; i < result.length; i++) {
      const data = result[i];
      const receipt = await web3.eth.getTransactionReceipt(String(data.hash));
      // 如果收据不存在；则下一次从该块开始同步
      if (!receipt) {
        await redis.set('curBlockNumber', data.blockNumber);
        return
      }
      await dbPool.query(`update t_transactions set gasUsed=${receipt.gasUsed},status=${receipt.status} where hash=${receipt.transactionHash}`)
      data.status = receipt.status;
      data.name = tokenConfig.baseToken;
      data.decimals = 18;
      if (amqpConfig.enable && receipt && receipt.logs.length === 0) {
        sendMessage(amqpConfig.key, JSON.stringify(data));
      }
      if (receipt.contractAddress) {
        const transaction = await TransactionService.getByHash(receipt.transactionHash)
        const code = await web3.eth.getCode(receipt.contractAddress)
        const splitCode = transaction.input.split(code.substring(2))
        let arg = splitCode.pop()
        if (splitCode.length < 2) {
          arg = ''
        }
        let sql = 'replace into t_contracts(hash, address, `from`, cumulativeGasUsed, txns, verifiedStatus, arg) values '
        sql += `(${receipt.transactionHash}, ${receipt.contractAddress}, ${receipt.from},?,?,?,?)`
        await dbPool.query(sql, {
          replacements: [receipt.cumulativeGasUsed, 0, 0, arg],
          type: Sequelize.QueryTypes.INSERT
        })
      }
      if (i === result.length - 1) {
        await redis.set('curBlockNumber', data.blockNumber);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

module.exports = syncReceipt



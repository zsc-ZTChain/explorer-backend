const web3 = require('../lib/web3');
const {dbPool} = require('../lib/db');
const Sequelize = require("sequelize");
const blockReward = require('../utils/blockReward')
const {setHashRate} = require('../utils/avgHashRate')
async function add(blockNumber) {
  const result = await web3.eth.getBlock(blockNumber, true)
    if (result === undefined || result === null) {
      return false;
    }

    if (result.extraData === '0x') {
      result.extraData = '0x0'
    }

    let reward = blockReward.getConstReward(result.number)
    try {
      let minerReward = reward * (1 - blockReward.getFoundationPercent(result.number));
      let foundation = reward * blockReward.getFoundationPercent(result.number);
      let txnFees = blockReward.getGasInBlock(result.transactions);
      let unclesCount = result.uncles.length;
      let uncleInclusionRewards = blockReward.getRewardForUncle(result.number, unclesCount);
      await dbPool.query(`replace into t_blocks set number=${result.number},difficulty=${result.difficulty},
          extraData=${result.extraData},gasLimit=${result.gasLimit},gasUsed=${result.gasUsed},
          hash=${result.hash},logsBloom=${result.logsBloom},miner=${result.miner},mixHash=${result.mixHash},
          nonce=${result.nonce},parentHash=${result.parentHash},receiptsRoot=${result.receiptsRoot},
          sha3Uncles=${result.sha3Uncles},unclesCount=${unclesCount},uncleInclusionRewards=${uncleInclusionRewards},
          minerReward=${minerReward},foundation=${foundation},txnFees=${txnFees},size=${result.size},stateRoot=${result.stateRoot},
          timestamp=${result.timestamp},totalDifficulty=${result.totalDifficulty},transactionsRoot=${result.transactionsRoot}`, {
        replacements: [],
        type: Sequelize.QueryTypes.INSERT
      })
      await setHashRate(result.number, result.timestamp)
    } catch (e) {
      console.log("save block error:", blockNumber, e)
    }
}
module.exports = {add}

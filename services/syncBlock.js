const web3 = require('../lib/web3');
const {dbPool} = require('../lib/db');
const Sequelize = require("sequelize");
const config = require('config')
const tokenConfig = config.get('token')
const {listenBlockTransactions} = require('./syncData')
const blockReward = require('../utils/blockReward')
const {setHashRate} = require('../utils/avgHashRate')
// const PERCENT_OF_FOUNDATION = 0.05;

let listenBlock = async (blockNumber) => {
    if (blockNumber % 10 === 0) {
        console.log("Get block ", blockNumber);
    }
    let currentHeight = await web3.eth.getBlockNumber();

    if (blockNumber > currentHeight){
        //confirm 20 blocks;
        setTimeout(async () => {
            await listenBlock(blockNumber - 12);
        },tokenConfig.refreshingTime);
        return false;
    }

  const result = await web3.eth.getBlock(blockNumber, true)
    try {
      if (result === undefined || result === null){
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
          timestamp=${result.timestamp},totalDifficulty=${result.totalDifficulty},transactionsRoot=${result.transactionsRoot}`,{
          replacements: [],
          type: Sequelize.QueryTypes.INSERT
        })
        await setHashRate(result.number, result.timestamp)
      }catch (e) {
        console.log("save block error:",blockNumber, e)
      }

      try {
        if (result.uncles.length > 0){
          const count =  await web3.eth.getBlockUncleCount(blockNumber)
          for (var i = 0 ; i < count; i++){
            const uncle =  await web3.eth.getUncle(blockNumber,i)
            if (uncle.extraData === '0x') {
              uncle.extraData = '0x0'
            }

            let uncleReward = blockReward.getUncleReward(uncle.number, blockNumber, reward);

            await dbPool.query(`replace into t_uncles set blockNumber=${blockNumber},number=${uncle.number},difficulty=${uncle.difficulty},
                extraData=${uncle.extraData},gasLimit=${uncle.gasLimit},gasUsed=${uncle.gasUsed},
                hash=${uncle.hash},logsBloom=${uncle.logsBloom},miner=${uncle.miner},mixHash=${uncle.mixHash},
                nonce=${uncle.nonce},parentHash=${uncle.parentHash},receiptsRoot=${uncle.receiptsRoot},
                sha3Uncles=${uncle.sha3Uncles},size=${uncle.size},stateRoot=${uncle.stateRoot},
                timestamp=${uncle.timestamp},transactionsRoot=${uncle.transactionsRoot},
                uncleIndex=${i},reward=${uncleReward}`, {
              replacements: [],
              type: Sequelize.QueryTypes.INSERT
            })
          }
        }
      }catch (e) {
        console.log('getBlockUncleCount error:', blockNumber, e)
      }

    }catch (e) {
      console.log('getBlock error:',blockNumber,e)
    }
    await listenBlock(blockNumber+1 );
}

let syncBlocks = () =>{
    dbPool.query(`select COALESCE(max(number),0) blockNumber from t_blocks`,{
      replacements: [],
      type: Sequelize.QueryTypes.SELECT
  }).then(async result => {
    let number = result[0].blockNumber;
    console.log('start block:',number);
    listenBlock(number);
    await listenBlockTransactions(number+1);
  })
}

module.exports = syncBlocks

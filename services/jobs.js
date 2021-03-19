const schedule = require('node-schedule');
const config = require('config')
const tokenConfig = config.get('token')
import {ContractService} from './contract'
import {BlockService} from './block'

const {getListFromEth} = require('../module/batchDownloadCompiler')
const listenReceipt = require('./syncReceipt')
const listenCross = require('./syncCross')


//统计合约手续费和交易数量
schedule.scheduleJob('0 */30 * * * *', async () => {
    await ContractService.countContractFee();
});

//统计每天块内信息
schedule.scheduleJob('0 */30 * * * *', async () => {
    await BlockService.countBlockChart();
});

//每天凌晨1点半拉取compiler版本
schedule.scheduleJob({hour: 1, minute: 30}, async () => {
    await getListFromEth()
})

//Receipt 每5秒执行一次
schedule.scheduleJob('*/5 * * * * *', async () => {
    listenReceipt()
})

//cross 每5秒执行一次
schedule.scheduleJob('*/5 * * * * *', async () => {
    if (tokenConfig.crossAddress) {
        await listenCross()
    }
})

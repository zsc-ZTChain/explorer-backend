import {TransactionService} from "./transaction";

const web3 = require('../lib/web3');
const {dbPool} = require('../lib/db');
const Sequelize = require("sequelize");
const config = require('config')
const tokenConfig = config.get('token')
const amqpConfig = config.get('amqp')

const {sendMessage} = require("../mq/sender");

let syncReceipt = () => {
    dbPool.query("select cast(hash as CHAR) hash,blockNumber,`from`,`to`,cast(`value` as char) value from transactions where gasUsed is NULL order by blockNumber limit 10",{
        replacements: [],
        type: Sequelize.QueryTypes.SELECT
    }).then(result => {
        for (let i = 0 ; i < result.length; i++){
            let data = result[i];
            web3.eth.getTransactionReceipt(String(data.hash)).then(async (receipt) => {
                try{
                    dbPool.query(`update t_transactions set gasUsed=${receipt.gasUsed},status=${receipt.status} where hash=${receipt.transactionHash}`,{
                        replacements: [],
                        type: Sequelize.QueryTypes.UPDATE
                    }).then((r) => {
                        data.status = receipt.status;
                        data.name = tokenConfig.baseToken;
                        data.decimals = 18;

                        //推送消息至MQ
                        if (amqpConfig.enable && receipt && receipt.logs.length === 0){
                            sendMessage(amqpConfig.key,JSON.stringify(data));
                        }
                    })

                    if (receipt.contractAddress) {
                        const transaction = await TransactionService.getByHash(receipt.transactionHash)
                        const code = await web3.eth.getCode(receipt.contractAddress)
                        const splitCode = transaction.input.split(code.substring(2))
                        let arg = splitCode.pop()
                        if(splitCode.length < 2) {
                            arg = ''
                        }
                        let sql = 'replace into t_contracts(hash, address, `from`, cumulativeGasUsed, txns, verifiedStatus, arg) values '
                        sql += `(${receipt.transactionHash}, ${receipt.contractAddress}, ${receipt.from},?,?,?,?)`
                        await dbPool.query(sql,{
                            replacements: [receipt.cumulativeGasUsed, 0, 0, arg],
                            type: Sequelize.QueryTypes.INSERT
                        })
                    }
                }catch (e) {
                    console.log(e)
                }
            })
        }

        // setTimeout(() => {
        //     syncReceipt();
        // }, tokenConfig.refreshingTime)

    }).catch(e => {
        console.log(e)
    })
}

module.exports = syncReceipt



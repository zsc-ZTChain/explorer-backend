import {transBroadcast} from "../socket/push";

const web3 = require('../lib/web3');
const config = require('config')
const tokenConfig = config.get('token')
const {dbPool} = require('../lib/db');
const Sequelize = require("sequelize");
const {TransactionService} = require('./transaction')

async function listenBlockTransactions(blockNumber) {

    let currentHeight = await web3.eth.getBlockNumber();
    if (blockNumber > currentHeight){
        setTimeout(async () => {
            await listenBlockTransactions(blockNumber);
        },tokenConfig.refreshingTime);
        return false;
    }

    web3.eth.getBlock(blockNumber, true).then(async (result) => {
        if (result === undefined || result === null){
            return false;
        }

        if (result.transactions != null && result.transactions.length > 0){
            let sql = "replace into t_transactions(blockHash,blockNumber,`from`,gas,gasPrice,hash,input,nonce,`to`,transactionIndex,value) values ";

            for(let i = 0 ; i < result.transactions.length ; i++){
                let transaction = result.transactions[i];
                if (transaction.input === '0x') {
                    transaction.input = '0x0'
                }

                if (transaction.input.length > 50000) {
                    transaction.input = '0x0'
                }

                sql += `(${transaction.blockHash},'${transaction.blockNumber}',${transaction.from},'${transaction.gas}',
                        '${transaction.gasPrice}',${transaction.hash},${transaction.input},${transaction.nonce},
                        ${transaction.to},'${transaction.transactionIndex}','${transaction.value}')`;
                if (i !== result.transactions.length-1){
                    sql += ",";
                }
            }


            try {
                const insertT_Transs = await dbPool.query(sql,{
                    replacements: [],
                    type: Sequelize.QueryTypes.INSERT
                })
                if (insertT_Transs[1] === 1){
                    const  insertTrans = await TransactionService.getTransAllByBlockNumber(blockNumber)
                    await transBroadcast(insertTrans)
                    // if(insertTrans.to){
                    //     const code = await web3.eth.getCode(transaction.to)
                    //     if(code !== '0x') {
                    //         const ss = await dbPool.query(`update t_contracts set txns=txns+1 where address= ${Buffer.from(insertTrans.to).toString('binary')}`, {
                    //             replacements: [],
                    //             type: Sequelize.QueryTypes.UPDATE
                    //         })
                    //     }
                    // }
                }


            }catch (e) {
                console.log(e);
                throw e;
            }
        }

    }).catch(e => {
        console.log('getTransactions error:',blockNumber,e)
    })

    await listenBlockTransactions(blockNumber+1 );

}

module.exports = {
    listenBlockTransactions: listenBlockTransactions
}


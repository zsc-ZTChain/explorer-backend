
const web3 = require('../lib/web3');
const Sequelize = require("sequelize");
const {dbPool} = require('../lib/db');
const config = require('config');
const tokenConfig = config.get('token');
const crossABI = require('../abi/cross.json');
const contract = new web3.eth.Contract(crossABI,tokenConfig.crossAddress);
const {EnumCrossEvent} = require('../model/cross')
const {decodeCrossTaker} = require('../utils/abiDecoder')

let syncCross = async () => {

    let result = await dbPool.query("select IFNULL(max(blockNumber),0) blockNumber from t_cross_events",{
        replacements: [],
        type: Sequelize.QueryTypes.SELECT
    });

    contract.getPastEvents('allEvents',{fromBlock : result[0].blockNumber} ,async (error, events) => {
        for (const event of events){
            let eventParam = event.returnValues;
            let sql = ``
            switch (event.event) {
                case EnumCrossEvent.EVENT_MARKE :
                    sql = `replace into t_cross_events (id,blockNumber,txId,event,\`from\`,remoteChainId,\`value\`,destValue,transactionHash, data) values ('${event.id}',${event.blockNumber},'${eventParam.txId}','${event.event}','${eventParam.from.toLowerCase()}','${eventParam.remoteChainId}','${eventParam.value}','${eventParam.destValue}','${event.transactionHash}', '${eventParam.data}')`;
                    break;
                case EnumCrossEvent.EVENT_TAKE :
                    const tx = await web3.eth.getTransaction(event.transactionHash)
                    const input = decodeCrossTaker(tx.input)
                    sql = `replace into t_cross_events (id,blockNumber,txId,event,\`from\`,\`to\`,remoteChainId,\`value\`,destValue,transactionHash, data, input) values ('${event.id}',${event.blockNumber},'${eventParam.txId}','${event.event}','${eventParam.from.toLowerCase()}','${eventParam.to.toLowerCase()}','${eventParam.remoteChainId}','${eventParam.value}','${eventParam.destValue}','${event.transactionHash}', '${eventParam.input}', '${input}')`;
                    break;
                case EnumCrossEvent.EVENT_FINISH :
                    sql = `replace into t_cross_events (id,blockNumber,txId,event,\`to\`,transactionHash) values ('${event.id}',${event.blockNumber},'${eventParam.txId}','${event.event}','${eventParam.to.toLowerCase()}','${event.transactionHash}')`;
                    break;
                default :
                    break;
            }

            if (sql){
                dbPool.query(sql,{
                    replacements: [],
                    type: Sequelize.QueryTypes.INSERT
                })
            }
        }
    });

    // setTimeout(async () => {
    //     await syncCross();
    // },tokenConfig.refreshingTime)
};


module.exports = syncCross;

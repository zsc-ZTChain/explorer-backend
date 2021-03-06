let web3 = require('../lib/web3');
const BN = require('bn.js');

// 获取普通区块奖励。 从0开始，每250万个区块后减半。
function getConstReward(height) {
    const year = 42048000
    let n = Math.ceil((height + 1) / year)
    return 0.8086 * Math.pow((1 / 2), n - 1)
}

function getFoundationPercent(height){
    // const year = 42048000
    // let n = Math.ceil((height + 1) / year)
    //
    // return (0.05 * Math.pow((1 / 2), n - 1));
    // 无基金会
    return 0
}


// 包含叔块的奖励,最多两个叔块
function getRewardForUncle(height, uncleNumber) {
    let reward = getConstReward(height);
    return (reward / 32) * uncleNumber;
}

// 获取叔块奖励,uHeight为叔块高度，height为包含区块高度, constReward为固定奖励
function getUncleReward(uHeight, height, constReward) {
    // let reward = (uHeight + 8 - height) * constReward / 8;
    // 无数块奖励
    return 0
}

// 获取区块所有消耗的txsFee
function getGasInBlock(transactions) {
    let length = transactions.length
    if (length === 0) {
        return 0
    }
    let txsFee = 0;
    for (let i = 0; i < length; i++) {
        const bigFee = (new BN(transactions[i].gas)).mul(new BN(transactions[i].gasPrice))
        const fee = web3.utils.fromWei(bigFee)
        txsFee += parseFloat(fee)
    }
    return txsFee
}

module.exports = {
    getUncleReward,
    getGasInBlock,
    getConstReward,
    getRewardForUncle,
    getFoundationPercent
}

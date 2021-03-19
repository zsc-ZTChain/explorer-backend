const web3 = require('../lib/web3');
const BigNumber = require('bignumber.js');
const BN = web3.utils.BN;

function txPriceFormatter (gas, gasPrice) {
    const price = new BigNumber(gas * gasPrice).toString();
    const bn = new BN(price).toString();
    return web3.utils.fromWei(bn, "ether")
}

module.exports = {txPriceFormatter};

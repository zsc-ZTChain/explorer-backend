var web3 = require('../lib/web3');
const config = require('config')
const tokenConfig = config.get('token')

function formatter() {
  this.format = function(gasPrice) {
    var w = web3.utils.fromWei(String(gasPrice), "ether");
    return Number.parseFloat(w).toFixed(10) + " "+tokenConfig.baseToken;
  }
}

module.exports = formatter;

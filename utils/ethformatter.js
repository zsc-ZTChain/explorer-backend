var web3 = require('../lib/web3');
const config = require('config')
const tokenConfig = config.get('token')

function formatter() {
  this.format = function(txt) {
    if (isNaN(txt)) return txt;
    var w = web3.utils.fromWei(txt, "ether");
    return Number.parseFloat(w).toFixed(6) + " " + tokenConfig.baseToken;
  }
}

module.exports = formatter;

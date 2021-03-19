var web3 = require('../lib/web3');

function valueFormatter(value) {
  return web3.utils.fromWei(String(value), "ether");
}

module.exports = {valueFormatter};

const config = require('config')
const web3Config = config.get('web3')
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(web3Config.gethServer));

setInterval(
    () => {
        web3.eth.net.isListening().then().catch(() => {
            console.log('[ - ] Lost connection to the node, reconnecting');
            web3.setProvider(new Web3.providers.HttpProvider(web3Config.gethServer));
        })
    },
  web3Config.reconnect);

module.exports = web3;

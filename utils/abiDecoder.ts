import * as abiDecoder from 'abi-decoder'
// eslint-disable-next-line
const crossABI = require('../abi/cross.json')
export function decodeInput(methodAbi, param, method) {
  const methItem = methodAbi.filter((item) => item.name === method)
  abiDecoder.addABI(methItem)
  return  abiDecoder.decodeMethod(param)
}
export function decodeCrossTaker(input) {
  const code = decodeInput(crossABI, input, 'taker')
  const ctx = (code.params.filter((item) => item.name === 'ctx'))[0].value
  return ctx[6]
}

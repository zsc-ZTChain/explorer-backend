import * as web3 from '../lib/web3'
import * as cbor from 'cbor'
import * as linker from 'solc/linker'
import {createHttpError} from '../error/errors'

export function verifySourceCode(explorerCode: string, customerCode: string, libraries: object) {
  if (explorerCode === '0x') return {status: false}
  explorerCode = verifyLibraries(explorerCode, libraries)
  const eHash = getMateHash(explorerCode)
  const cHash = getMateHash(customerCode)
  if (!eHash) return {status: false}
  if (explorerCode.includes(eHash) && customerCode.includes(cHash)) {
    const eArr = explorerCode.split(eHash)
    const eCode = eArr.join('')
    const cArr = customerCode.split(cHash)
    const cCode = cArr.join('')
    if (eCode === cCode) {
      return {status: true}
    }
    return {status: false, eCode, cCode}
  }
  return {status: false}
}

function cborDecode(bytecode) {
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const cborLength = bytecode[bytecode.length - 2] * 0x100 + bytecode[bytecode.length - 1]
  if (cborLength.length > bytecode.length) return
  return cbor.decodeFirstSync(Buffer.from(bytecode.slice(bytecode.length - 2 - cborLength, -2)))
}

function getMateHash(bytecode) {
  const cborData = cborDecode(web3.utils.hexToBytes(bytecode))
  if (!cborData) return
  const dataArr = Object.keys(cborData)
  const bzzrName = dataArr.filter((item) => item.includes('bzzr'))
  return web3.utils.bytesToHex(cborData[`${bzzrName}`]).slice(2)
}

export function verifyLibraries(eCode: string, libraries: object) {
  const linkReferences = linker.findLinkReferences(eCode)
  const clibName = Object.keys(linkReferences)
  const elibName = Object.keys(libraries)
  if (clibName.length === 0) return eCode
  if (clibName.length > 0 && elibName.length === 0) {
    throw createHttpError({status: 200, type: 'verify', code: 30007, message: 'contract need add libraries address'},
      {outputData: clibName})
  }
  const libObject = {}
  for (const link in linkReferences) {
    for (const lib in libraries) {
      const re = new RegExp(`^.*${lib}$`)
      if (re.test(link)) {
        libObject[`${link}`] =  libraries[`${lib}`]
      }
    }
  }
  if (Object.keys(libObject).length === 0) {
    throw createHttpError({status: 200, type: 'verify', code: 30008, message: 'libraries name not match'},
      {outputData: clibName})
  }
  return linker.linkBytecode(eCode, libObject)
}

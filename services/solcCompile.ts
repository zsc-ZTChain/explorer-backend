import * as fs from 'fs-extra'
import {createHttpError} from '../error/errors'
import * as path from 'path'
import {multiNestingGetValue} from '../helper/functions'
import {ContractService} from './contract'
import * as web3 from '../lib/web3'
import * as _ from 'lodash'
import {verifySourceCode} from '../utils/verifySourceCode'
import {loadLocalVersion} from '../utils/downloadCompiler'

interface ICompileSourceParameters {
  version: string
  optimizer?: { enabled: boolean; runs: number}
  libraries: object
}
interface ICompileMultiSourceParameters extends ICompileSourceParameters{
  address: string
}

interface ICompileSingleSourceParameters extends ICompileSourceParameters {
  code: string
  address: string
}

interface IVerifySource {
  status: boolean
  name: string
  cCode?: string
  eCode?: string
  abi?: string
  sourceMap?: string
}

interface IOutCompile {
  output: IVerifySource[]
  input?: string
}
export async function compileSingleSource({version, address, code, optimizer, libraries}:
ICompileSingleSourceParameters): Promise<IOutCompile> {
  const input = {
    language: 'Solidity',
    sources: {
      'default.sol': {
        content: code,
      },
    },
    settings: {
      optimizer,
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
        },
      },
      libraries: {
        'default.sol': libraries,
      },
    },
  }
  const outputData: {contracts: {}; errors: {}; sources: {}} = await loadLocalVersion(
    version,  JSON.stringify(input)
  )
  if (!outputData.contracts || Object.keys(outputData.contracts).length === 0) {
    throw createHttpError({status: 200, message: 'compile error', code: 30001, type: 'compile'}, {outputData})
  }
  return {output: await getContract(outputData, address, libraries)}
}

export async function compileMultiSource({version, address, optimizer, libraries}: ICompileMultiSourceParameters):
Promise<IOutCompile> {
  const input = {}
  const contractsDirectory = path.resolve(__dirname, `../public/uploads/${address}`)
  if (!await fs.pathExists(contractsDirectory)) {
    throw createHttpError({status: 200,
      message: `${address} dir is not created, file is empty`, code: 30004, type: 'compile'})
  }

  const files = fs.readdirSync(contractsDirectory)
  for (const file of files) {
    if (file.endsWith('.sol')) {
      const filePath = `${contractsDirectory}/${file}`
      input[file] = {content: fs.readFileSync(filePath, 'utf8')}
    }
  }
  const sourceInput = {
    language: 'Solidity',
    sources: input,
    settings: {
      optimizer,
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  }
  const outputData: {contracts: {}; errors: {}; sources: {}} = await loadLocalVersion(
    version, JSON.stringify(sourceInput)
  )
  await fs.remove(contractsDirectory)

  if (!outputData.contracts || Object.keys(outputData.contracts).length === 0) {
    throw createHttpError({status: 200, message: 'compile error', code: 30001, type: 'compile'}, {outputData})
  }

  return {output: await getContract(outputData, address, libraries), input: JSON.stringify(input)}
}

export async function compileJsonSource({version, address, optimizer, libraries}:
ICompileMultiSourceParameters): Promise<IOutCompile>  {
  let sourceInput: string
  const contractsDirectory = path.resolve(__dirname, `../public/uploads/${address}`)

  if (!await fs.pathExists(contractsDirectory)) {
    throw createHttpError({status: 200,
      message: `${address} dir is not created, file is empty`, code: 30004, type: 'compile'})
  }

  const files = fs.readdirSync(contractsDirectory)
  if (files[0].endsWith('.json')) {
    const filePath = `${contractsDirectory}/${files[0]}`
    sourceInput = fs.readFileSync(filePath, 'utf8')
  }
  const outputData: {contracts: {}; errors: {}; sources: {}} =  await loadLocalVersion(version, sourceInput)
  await fs.remove(contractsDirectory)

  if (!outputData.contracts || Object.keys(outputData.contracts).length === 0) {
    throw createHttpError({status: 200, message: 'compile error', code: 30001, type: 'compile'}, {outputData})
  }
  const input = multiNestingGetValue(JSON.parse(sourceInput), 'content')
  const getOptimizer = multiNestingGetValue(JSON.parse(sourceInput), 'optimizer')
  if (getOptimizer) {
    optimizer = getOptimizer
  }

  await ContractService.updateAnyByAddress({optimizer:
      JSON.stringify({enabled: optimizer.enabled, runs: optimizer.runs})}, address)

  return {output: await getContract(outputData, address, libraries), input: JSON.stringify(input)}
}

async function getContract(outputData, address, libraries: object): Promise<IVerifySource[]> {
  const fileValues = Object.values(outputData.contracts)
  const getCode = await web3.eth.getCode(address)
  const contract: IVerifySource[] = []
  for (const item of fileValues) {
    const data = Object.values(item)
    const ContractName = Object.keys(item)
    data.forEach((m, i) => {
      const deployCode = _.get(m, 'evm.deployedBytecode.object')
      if (deployCode === undefined || deployCode === null) {
        throw createHttpError({status: 200,
          message: 'can not found deployedBytecode in evm object',
          code: 30011, type: 'compile'}, {outputData})
      }
      const verify =  verifySourceCode(`0x${deployCode}`, getCode, libraries)
      let result
      if (verify.status) {
        const abi = JSON.stringify(m.abi)
        if (!abi) {
          throw createHttpError({status: 200,
            message: 'can not found abi in evm object',
            code: 30012, type: 'compile'}, {outputData})
        }
        const sourceMap = _.get(data[0], 'evm.bytecode.sourceMap')
        result = {status: true, abi, sourceMap, name: ContractName[i]}
      } else {
        result = Object.assign(verify, {name: ContractName[i]})
      }
      contract.push(result)
    })
  }
  return contract
}

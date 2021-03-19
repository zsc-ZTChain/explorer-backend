import {bufferFormatter} from '../utils/bufferformatter'
import {ContractModel, EnumCompilerType} from '../model/contract'
import {dbPool} from '../lib/db'
import * as web3 from '../lib/web3'
import {TransactionService} from './transaction'
import {createHttpError} from '../error/errors'
import {compileJsonSource, compileMultiSource, compileSingleSource} from './solcCompile'
import {ContractChartModel} from '../model/ContractChart'
import {scientToNum} from '../utils/scientToNum'

// import {BaseUserService} from './base_user_service'
export class ContractService {
  public static async getListByPage(pageSize = 10, pageNumber = 1) {
    const transParam: Record<string, any> = {
      where: {
        verifiedStatus: 1,
      },
      order: [
        ['verifiedTime', 'DESC'],
      ],
      offset: Number((pageNumber - 1) * pageSize),
      limit: Number(pageSize),
      raw: true,
    }
    const data = await ContractModel.findAll(transParam)
    const count = await ContractModel.count({where: {verifiedStatus: 1}})
    const contracts = await Promise.all(data.map(async (item) => {
      const web3Balance = await web3.eth.getBalance(bufferFormatter(item.address))
      item['balance'] = web3.utils.fromWei(String(web3Balance), 'ether')
      item.txns = await TransactionService.getTransCountByHashOrTo(
        bufferFormatter(item.hash), bufferFormatter(item.address)
      )
      return this.contractFormatter(item)
    }))
    return {contracts, count}
  }

  public static async updateAnyByAddress(fields: Partial<ContractModel>, address: string) {
    const keys = Object.keys(fields)
    const keyFormatter = keys.map((item) => {
      return `${item}=?`
    })
    const sql = `update t_contracts set ${String(keyFormatter)} where address=${address}`
    await dbPool.query(sql, {
      replacements: Object.values(fields),
      type: 'UPDATE',
    })
    return this.getByAddress(address)
  }

  public static async updateVerifyByAddress(data: Partial<ContractModel>,
    optimizer: { enabled: boolean; runs: number} = {enabled: false, runs: 200}, libraries: object = {}) {
    await this.verifyAddress(data.address)
    const contract = await this.getByAddress(data.address)
    if (!contract.compiler || !contract.version) {
      throw createHttpError({status: 200, message: 'You need to initialize validation', code: 30011, type: 'verify'})
    }
    await this.updateAnyByAddress({optimizer: JSON.stringify(optimizer)}, data.address)
    switch (contract.compiler) {
      case EnumCompilerType.SoliditySingle:
        return this.verifySingleFile(data, contract.version, optimizer, libraries)
      case EnumCompilerType.SolidityMulti:
        return this.verifyMultiFiles(data, contract.version, optimizer, libraries)
      case EnumCompilerType.SolidityStandardJson:
        return this.verifyJSonFiles(data, contract.version, optimizer, libraries)
      default:
        throw createHttpError({status: 200,
          message: `compiler ${contract.compiler} is not exist`, type: 'verify', code: 30003})
    }
  }

  public static async verifySingleFile(data: Partial<ContractModel>, version: string, optimizer, libraries) {
    const solc = await compileSingleSource({version,
      address: data.address,
      code: data.sourceCode,
      optimizer, libraries})
    const contracts = solc.output.filter((item) => item.status === true)
    if (contracts.length === 0) {
      throw createHttpError({status: 200, message: 'Contract source does not match', code: 30006, type: 'verify'},
        {outputData: solc})
    }
    const contract = contracts[0]
    const verifiedTime = Math.round(new Date().getTime() / 1000)
    await this.updateAnyByAddress({
      sourceCode: data.sourceCode,
      abi: contract.abi,
      verifiedTime,
      verifiedStatus: 1,
      contractName: contract.name,
      sourceMap: contract.sourceMap,
    }, data.address)
    return this.getByAddress(data.address)
  }

  public static async verifyMultiFiles(data: Partial<ContractModel>, version: string, optimizer, libraries) {
    const solc = await compileMultiSource({version, address: data.address, libraries, optimizer})
    const contracts = solc.output.filter((item) => item.status === true)
    if (contracts.length === 0) {
      throw createHttpError({status: 200, type: 'verify', code: 30006, message: 'Contract source does not match'},
        {outputData: solc})
    }
    const contract = contracts[0]
    const verifiedTime = Math.round(new Date().getTime() / 1000)
    await this.updateAnyByAddress({
      sourceCode: solc.input,
      abi: contract.abi,
      verifiedTime,
      verifiedStatus: 1,
      contractName: contract.name,
      sourceMap: contract.sourceMap,
    }, data.address)
    return this.getByAddress(data.address)
  }

  // TODO Code needs improvement
  public static async verifyJSonFiles(data: Partial<ContractModel>, version: string, optimizer, libraries: object) {
    const solc = await compileJsonSource({version, address: data.address, optimizer, libraries})
    const contracts = solc.output.filter((item) => item.status === true)
    if (contracts.length === 0) {
      throw createHttpError({status: 200, type: 'verify', code: 30006, message: 'Contract source does not match'},
        {outputData: solc})
    }
    const contract = contracts[0]
    const verifiedTime = Math.round(new Date().getTime() / 1000)
    await this.updateAnyByAddress({
      sourceCode: solc.input,
      abi: contract.abi,
      verifiedTime,
      verifiedStatus: 1,
      contractName: contract.name,
      sourceMap: contract.sourceMap,
    }, data.address)
    return this.getByAddress(data.address)
  }

  public static async getByAddress(address: string): Promise<ContractModel> {
    const result = await dbPool.query(`
      select * from t_contracts 
      where address = ${Buffer.from(address).toString('binary')}
    `, {
      replacements: [],
      type: 'SELECT',
    })
    if (result.length === 0) {
      throw createHttpError({status: 200, type: 'contract', code: 20001, message: 'Contract address is not exist'})
    }
    const contract = this.contractFormatter(result[0])
    const trans = await TransactionService.getByHash(contract.hash)
    contract['byteCode'] = trans.input
    return contract
  }

  public static async getByHash(hash: string): Promise<ContractModel> {
    const result = await dbPool.query(`
      select * from t_contracts 
      where hash = ${Buffer.from(hash).toString('binary')}
    `, {
      replacements: [],
      type: 'SELECT',
    })
    if (result.length === 0) {
      return result[0]
    }
    return this.contractFormatter(result[0])
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static async verifyAddress(address: string) {
    try {
      const code = await web3.eth.getCode(address)
      if (code === '0x') {
        throw createHttpError({status: 200, message: 'contract address is not exist', type: 'contract', code: 20001})
      }
      const contract = await this.getByAddress(address)
      if (!contract) {
        throw createHttpError({status: 200, message: 'contract address is not exist', type: 'contract', code: 20001})
      }
      if (contract.verifiedStatus === 1) {
        throw createHttpError({status: 200, message: 'contract is verified', type: 'verify', code: 20003})
      }
    } catch (e) {
      if (e.message.startsWith('Provided address')) {
        throw createHttpError({status: 200,
          message: 'contract address is not exist', type: 'contract', code: 20001}, {...e})
      } else {
        throw e
      }
    }
  }

  public static async isContractAddress(address: string) {
    try {
      const code = await web3.eth.getCode(address)
      if (code === '0x') {
        return false
      }
      return true
    } catch (e) {
      if (e.message.startsWith('Provided address')) {
        throw createHttpError({status: 200,
          message: 'address is not exist', type: 'contract', code: 20001}, {...e})
      } else {
        throw e
      }
    }
  }

  public static async getArgs(hash: string, address: string) {
    const transaction = await TransactionService.getByHash(hash)
    const code = await web3.eth.getCode(address)
    return transaction.input.split(code.substring(2)).pop()
  }

  public static async addContractByhash(hash) {
    const receipt = await web3.eth.getTransactionReceipt(hash)
    if (receipt.contractAddress) {
      const contract = await this.getByAddress(receipt.contractAddress)
      if (!contract) {
        const transaction = await TransactionService.getByHash(receipt.transactionHash)
        const code = await web3.eth.getCode(receipt.contractAddress)
        const arg = transaction.input.split(code.substring(2)).pop()
        const txns = await TransactionService.getTransCountByFromOrTo(receipt.contractAddress)
        // eslint-disable-next-line max-len
        let sql = 'replace into t_contracts(hash, address, `from`, cumulativeGasUsed, txns, verifiedStatus, arg) values '
        sql += `(${receipt.transactionHash}, ${receipt.contractAddress}, ${receipt.from},?,?,?,?)`
        await dbPool.query(sql, {
          replacements: [receipt.cumulativeGasUsed, txns, 0, arg],
          type: 'INSERT',
        })
      }
    }
  }

  public static async updateInitByAddress(data: ContractModel) {
    await ContractService.verifyAddress(data.address)
    return ContractService.updateAnyByAddress({
      compiler: data.compiler,
      version: data.version,
      // uid: this.userId,
    }, data.address)
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public static contractFormatter(item) {
    return {...item, hash: bufferFormatter(item.hash),
      address: bufferFormatter(item.address),
      from: bufferFormatter(item.from)}
  }

  // TODO: close user
  // public async getListByUid(pageSize = 10, pageNumber = 1) {
  //   const transParam: Record<string, any> = {
  //     where: {
  //        uid: this.userId,
  //     },
  //     offset: Number((pageNumber - 1) * pageSize),
  //     limit: Number(pageSize),
  //     raw: true,
  //   }
  //   const data = await ContractModel.findAll(transParam)
  //   const count = await ContractModel.count({where: {uid: this.userId}})
  //   const contracts = data.map((item) => {
  //     return ContractService.contractFormatter(item)
  //   })
  //   return {contracts, count}
  // }

  /* eslint-disable */
  public static async countContractFee() {
    return dbPool.query(`
        replace into t_contracts_chart
        select address,(select IFNULL(contractName, "Unverified") contractName from t_contracts where t.address = lower(concat('0x',hex(\`address\`)))) contractName,count(1) count,sum(fee) fee,date from (
        select hash,lower(concat('0x',hex(\`to\`))) address,
          @blockTime := (select \`timestamp\` from t_blocks where number = t.blockNumber),
          concat(year(from_unixtime(@blockTime)),'-',LPAD(month(from_unixtime(@blockTime)),2,0),'-',LPAD(day(from_unixtime(@blockTime)),2,0)) as date,
          gasUsed*(gasPrice/power(10,18)) fee
        from t_transactions t where exists (select 1 from t_contracts where address = t.\`to\`)  
        ) t group by address,date 
    `, {
      replacements: [],
      type: 'INSERT',
    })
  }
  /* eslint-disable */

  public static async getTotalContractFee() {
     const result = await dbPool.query('select sum(fee) total from t_contracts_chart', {
      replacements: [],
      type: 'SELECT',
    })
    return scientToNum(result[0].total)
  }


  public static async  getTxFeeChatData() {
    return dbPool.query(`
      select date,totalFee,(@contractFee := @contractFee + contractFee) AS contractFee from (
          select t1.date,t1.totalFee,@contractFee := IFNULL(t2.fee,0) contractFee from (
          SELECT date, txFee, (@csum := @csum + txFee) AS totalFee FROM t_blocks_chart,(SELECT @csum:=0) s
        ) t1 left join (
          select sum(fee) fee,date from t_contracts_chart group by date 
        ) t2 on t1.date = t2.date
      ) t,(SELECT @contractFee:=0) s
      order by date asc
    `, {
      replacements: [],
      type: 'SELECT',
    })
  }


  public static async getContractFeeList(pageSize = 10, pageNumber = 1, params) {
    const query = params ? 'where address=? or name like concat(\'%\',?,\'%\')' : ''
    // eslint-disable-next-line max-len
    const replacements = params ? [params, params, Number((pageNumber - 1) * pageSize), Number(pageSize)] : [Number((pageNumber - 1) * pageSize), Number(pageSize)]
    const countReplacements = params ? [params, params] : []


    const rows = await dbPool.query(`
      select address,name,sum(fee) fee,sum(txs) txs 
      from t_contracts_chart ${query} group by address,name order by fee desc limit ?,?
    `, {
      replacements,
      type: 'SELECT',
    })

    const result = await dbPool.query(`
      select count(1) count from (select count(1) from t_contracts_chart ${query} group by address) t
    `, {
      replacements: countReplacements,
      type: 'SELECT',
    })

    return {rows, count: result[0].count}
  }


  public static async getContractDetailByAddress(address) {
    return ContractChartModel.findAll({
      where: {
        address: address
      },
      order: [
        ['date', 'ASC'],
      ],
    })
  }
}

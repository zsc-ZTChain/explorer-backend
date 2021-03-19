import {INTEGER, MEDIUMINT, Model, STRING, TEXT} from 'sequelize'
import {dbPool} from '../lib/db'

export enum  EnumCompilerType {
  SoliditySingle = 'Solidity(Single File)',
  SolidityStandardJson = 'Solidity(Standard-Json-Input)',
  SolidityMulti = 'Solidity(Multi-Part Files)'
}
export class ContractModel extends Model {
  hash: string
  cumulativeGasUsed: number
  address: string
  contractName: string
  compiler: EnumCompilerType
  version: string
  verifiedStatus?: number
  verifiedTime: number
  sourceCode: string
  abi: string
  arg: string
  txns: number
  from: string
  sourceMap: string
  swarmSource: string
  optimizer: string
  uid: number
}
ContractModel.init(
  {
    hash: {
      type: 'binary(32)',
      primaryKey: true,
    },
    cumulativeGasUsed: MEDIUMINT,
    address: {
      type: 'binary(20)',
    },
    contractName: STRING(200),
    compiler: STRING(100),
    version: STRING(100),
    verifiedStatus: {
      type: 'tinyint(1)',
    },
    verifiedTime: INTEGER,
    sourceCode: TEXT,
    abi: TEXT,
    arg: STRING(1000),
    txns: INTEGER,
    from: {
      type: 'binary(20)',
    },
    sourceMap: TEXT,
    swarmSource: STRING(200),
    optimizer: STRING(30),
    uid: INTEGER,
  }, {
    sequelize: dbPool,
    tableName: 't_contracts',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['address'],
      },
      {
        fields: ['hash'],
      },
    ],
  }
)

